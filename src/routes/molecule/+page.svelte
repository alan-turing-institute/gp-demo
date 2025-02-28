<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import * as math from 'mathjs';
  // State variables
  let phi = 0;
  let psi = 0;
  let samples = [];
  let gpPredictions = [];
  let canvas;
  let contourCanvas;
  let isLoading = false;
  let showEnergyFunction = false;
  // Constants
  const WIDTH = 400;
  const HEIGHT = 400;
  const MARGIN = 40;
  const PLOT_SIZE = WIDTH - 2 * MARGIN;
  
  // Scales for plotting
  const xScale = d3.scaleLinear([-Math.PI, Math.PI], [MARGIN, WIDTH - MARGIN]);
  const yScale = d3.scaleLinear([-Math.PI, Math.PI], [HEIGHT - MARGIN, MARGIN]);
  
  // Calculate min and max energy values for consistent color scaling
  let energyMin = Infinity;
  let energyMax = -Infinity;
  
  // Pre-calculate energy values across the domain to find min/max
  function calculateEnergyRange() {
    const gridSize = 50;
    const phiVals = math.range(-Math.PI, Math.PI, 2 * Math.PI / gridSize).toArray();
    const psiVals = math.range(-Math.PI, Math.PI, 2 * Math.PI / gridSize).toArray();
    
    for (const gridPhi of phiVals) {
      for (const gridPsi of psiVals) {
        const energy = calculateEnergy(gridPhi, gridPsi);
        energyMin = Math.min(energyMin, energy);
        energyMax = Math.max(energyMax, energy);
      }
    }
    
    // Add a small buffer to the range
    energyMin = Math.floor(energyMin * 10) / 10;
    energyMax = Math.ceil(energyMax * 10) / 10;
    
    console.log(`Energy range: ${energyMin} to ${energyMax}`);
  }
  
  // Energy function (as provided)
  function calculateEnergy(phi, psi) {
    // Modified free energy function with multiple peaks along psi
    const term1 = Math.exp(-((phi + Math.PI / 2) ** 2) - ((psi - Math.PI / 2) ** 2) / 0.5);
    const term2 = Math.exp(-((phi + Math.PI / 2) ** 2) - ((psi + 0.5) ** 2) / 0.3);
    const term3 = Math.exp(-((phi - Math.PI / 2) ** 2) - ((psi + Math.PI / 2) ** 2) / 0.5);
    const term4 = Math.exp(-((phi - Math.PI / 2) ** 2) - ((psi - 0.5) ** 2) / 0.3);
    const term5 = Math.exp(-((phi - 0) ** 2) / 0.3 - ((psi - Math.PI / 4) ** 2) / 0.2); // Central peak
    
    const F = term1 + term2 + term3 + term4 + term5;
    return -Math.log(F + 1e-6); // Convert to free energy
  }
  
  // Function to add a new sample
  function addSample() {
    const energy = calculateEnergy(phi, psi);
    samples = [...samples, { phi, psi, energy }];
    updateGP();
  }
  
  // Add sample by clicking on contour plot
  function handleContourClick(event) {
    if (isLoading) return;
    
    const rect = contourCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert click coordinates to phi/psi values
    const clickedPhi = xScale.invert(x);
    const clickedPsi = yScale.invert(y);
    
    // Check if the click is within the plot area
    if (
      x >= MARGIN && 
      x <= WIDTH - MARGIN && 
      y >= MARGIN && 
      y <= HEIGHT - MARGIN
    ) {
      // Update the current phi/psi values
      phi = clickedPhi;
      psi = clickedPsi;
      
      // Add sample at the clicked location
      const energy = calculateEnergy(phi, psi);
      samples = [...samples, { phi, psi, energy }];
      
      // Update the GP model
      updateGP();
      
      // Update the molecule visualization
      drawMolecule();
    }
  }
  
  // Perform Gaussian Process regression using RBF kernel
  function updateGP() {
    isLoading = true;
    
    // Need at least one sample for GP
    if (samples.length === 0) {
      isLoading = false;
      return;
    }
    setTimeout(() => {
      // Prepare training data
      const X = samples.map(s => [s.phi, s.psi]);
      const y = samples.map(s => s.energy);
      
      // RBF kernel function
      const rbf = (x1, x2, lengthScale = 1.0) => {
        const squaredDist = math.sum(math.dotPow(math.subtract(x1, x2), 2));
        return math.exp(-0.5 * squaredDist / (lengthScale * lengthScale));
      };
      
      // Compute kernel matrix for training points
      const n = X.length;
      const K = math.zeros(n, n);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          K.set([i, j], rbf(X[i], X[j]));
        }
      }
      
      // Add small noise to diagonal for numerical stability
      const noise = 0.01;
      for (let i = 0; i < n; i++) {
        K.set([i, i], K.get([i, i]) + noise);
      }
      
      // Compute predictions over a grid
      const gridSize = 40;
      const phiVals = math.range(-Math.PI, Math.PI, 2 * Math.PI / gridSize).toArray();
      const psiVals = math.range(-Math.PI, Math.PI, 2 * Math.PI / gridSize).toArray();
      
      gpPredictions = [];
      
      for (const gridPhi of phiVals) {
        for (const gridPsi of psiVals) {
          const x_star = [gridPhi, gridPsi];
          
          // Compute kernel between test point and all training points
          const k_star = math.zeros(1, n);
          for (let i = 0; i < n; i++) {
            k_star.set([0, i], rbf(x_star, X[i]));
          }
          
          // Predict mean
          try {
            // Compute K^-1 * y
            const K_inv_y = math.lusolve(K, y);
            const mean = math.multiply(k_star, K_inv_y).get([0, 0]);
            
            gpPredictions.push({
              phi: gridPhi,
              psi: gridPsi,
              predicted: mean
            });
          } catch (e) {
            console.error("Error in GP calculation:", e);
          }
        }
      }
      
      drawContourPlot();
      isLoading = false;
    }, 50); // Small timeout to allow UI to update
  }
  
  // Draw the GP contour plot
  function drawContourPlot() {
    if (!contourCanvas) return;
    
    const ctx = contourCanvas.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Use pre-calculated min/max for color scaling instead of per-sample min/max
    const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([energyMin, energyMax]);
    
    // If we should display the energy function instead of GP predictions
    if (showEnergyFunction || gpPredictions.length === 0) {
      // Draw the actual energy function
      const gridSize = 80;
      const cellSize = PLOT_SIZE / gridSize;
      
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const phi = -Math.PI + (2 * Math.PI * i) / gridSize;
          const psi = -Math.PI + (2 * Math.PI * j) / gridSize;
          
          const energy = calculateEnergy(phi, psi);
          const x = xScale(phi);
          const y = yScale(psi);
          
          ctx.fillStyle = colorScale(energy);
          ctx.fillRect(x - cellSize/2, y - cellSize/2, cellSize, cellSize);
        }
      }
    } else {
      // Draw GP predictions
      const cellSize = PLOT_SIZE / Math.sqrt(gpPredictions.length);
      
      gpPredictions.forEach(p => {
        const x = xScale(p.phi);
        const y = yScale(p.psi);
        
        ctx.fillStyle = colorScale(p.predicted);
        ctx.fillRect(x - cellSize/2, y - cellSize/2, cellSize, cellSize);
      });
    }
    
    // Draw colorbar
    drawColorbar(ctx, colorScale);
    
    // Draw axes
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // X-axis
    ctx.moveTo(MARGIN, HEIGHT - MARGIN);
    ctx.lineTo(WIDTH - MARGIN, HEIGHT - MARGIN);
    
    // Y-axis
    ctx.moveTo(MARGIN, MARGIN);
    ctx.lineTo(MARGIN, HEIGHT - MARGIN);
    ctx.stroke();
    
    // Draw axis labels
    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    
    // X-axis labels
    ctx.fillText("-π", MARGIN, HEIGHT - MARGIN + 15);
    ctx.fillText("0", (WIDTH) / 2, HEIGHT - MARGIN + 15);
    ctx.fillText("π", WIDTH - MARGIN, HEIGHT - MARGIN + 15);
    ctx.fillText("φ", WIDTH - MARGIN + 15, HEIGHT - MARGIN + 5);
    
    // Y-axis labels
    ctx.textAlign = "right";
    ctx.fillText("-π", MARGIN - 5, HEIGHT - MARGIN);
    ctx.fillText("0", MARGIN - 5, (HEIGHT) / 2);
    ctx.fillText("π", MARGIN - 5, MARGIN);
    ctx.fillText("ψ", MARGIN - 15, MARGIN - 10);
    
    // Draw sample points
    ctx.fillStyle = "#ff0000";
    samples.forEach(s => {
      const x = xScale(s.phi);
      const y = yScale(s.psi);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  }
  
  // Draw colorbar for the contour plot
  function drawColorbar(ctx, colorScale) {
    const barWidth = 20;
    const barHeight = HEIGHT - 2 * MARGIN;
    const barX = WIDTH - MARGIN + 20;
    const barY = MARGIN;
    
    // Draw colorbar gradient
    const steps = 100;
    const stepHeight = barHeight / steps;
    
    for (let i = 0; i < steps; i++) {
      const value = energyMin + (energyMax - energyMin) * (steps - i - 1) / steps;
      ctx.fillStyle = colorScale(value);
      ctx.fillRect(barX, barY + i * stepHeight, barWidth, stepHeight + 1); // +1 to avoid gaps
    }
    
    // Draw border around colorbar
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Draw labels for the colorbar
    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    
    // Min/Max labels
    ctx.fillText(energyMin.toFixed(1), barX + barWidth + 5, barY + barHeight);
    ctx.fillText(energyMax.toFixed(1), barX + barWidth + 5, barY);
    
    // Middle value
    const middle = (energyMin + energyMax) / 2;
    ctx.fillText(middle.toFixed(1), barX + barWidth + 5, barY + barHeight/2);
    
    // Title
    ctx.save();
    ctx.translate(barX + barWidth + 25, barY + barHeight/2);
    ctx.rotate(-Math.PI/2);
    ctx.textAlign = "center";
    ctx.fillText("Energy", 0, 0);
    ctx.restore();
  }
  // Draw the molecule visualization
  function drawMolecule() {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Center of the canvas
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;
    const radius = 120;
    
    // Draw backbone
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.stroke();
    
    // Draw atoms
    const atoms = [
      { x: centerX - radius, y: centerY, color: "#0066cc", label: "N", size: 25 },
      { x: centerX - radius/2, y: centerY, color: "#333333", label: "Cα", size: 28 },
      { x: centerX, y: centerY, color: "#999999", label: "C", size: 25 },
      { x: centerX + radius/2, y: centerY, color: "#cc0000", label: "O", size: 25 },
      { x: centerX + radius, y: centerY, color: "#0066cc", label: "N", size: 25 }
    ];
    
    // Draw bonds with phi and psi angles
    ctx.save();
    ctx.translate(centerX - radius/2, centerY);
    ctx.rotate(phi);
    ctx.strokeStyle = "#00cc00";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -60);
    ctx.stroke();
    ctx.fillStyle = "#00cc00";
    ctx.font = "14px Arial";
    ctx.fillText("φ = " + phi.toFixed(2), 5, -30);
    ctx.restore();
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(psi);
    ctx.strokeStyle = "#cc00cc";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -60);
    ctx.stroke();
    ctx.fillStyle = "#cc00cc";
    ctx.font = "14px Arial";
    ctx.fillText("ψ = " + psi.toFixed(2), 5, -30);
    ctx.restore();
    
    // Draw atoms
    atoms.forEach(atom => {
      ctx.fillStyle = atom.color;
      ctx.beginPath();
      ctx.arc(atom.x, atom.y, atom.size, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = "#fff";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(atom.label, atom.x, atom.y);
    });
  }
  // Toggle energy function display
  function toggleEnergyFunction() {
    showEnergyFunction = !showEnergyFunction;
    drawContourPlot(); // Redraw contour plot when toggling
  }
  onMount(() => {
    calculateEnergyRange(); // Calculate min/max energy values
    drawMolecule();
    drawContourPlot(); // Initial draw with energy function
  });
  // Watch for changes to redraw
  $: {
    if (canvas && (phi || psi)) {
      drawMolecule();
    }
  }
</script>
<main>
  <h1>Protein Backbone Conformation Explorer</h1>
  
  <div class="container">
    <div class="panel">
      <h2>Backbone Angles</h2>
      <canvas bind:this={canvas} width={WIDTH} height={HEIGHT}></canvas>
      
      <div class="controls">
        <div class="slider-container">
          <label for="phi">φ (Phi): {phi.toFixed(2)}</label>
          <input 
            type="range" 
            id="phi" 
            min={-Math.PI} 
            max={Math.PI} 
            step={0.01} 
            bind:value={phi}
          />
        </div>
        
        <div class="slider-container">
          <label for="psi">ψ (Psi): {psi.toFixed(2)}</label>
          <input 
            type="range" 
            id="psi" 
            min={-Math.PI} 
            max={Math.PI} 
            step={0.01} 
            bind:value={psi}
          />
        </div>
      </div>
    </div>
    
    <div class="panel">
      <h2>Energy Landscape</h2>
      <div class="contour-container">
        <canvas 
          bind:this={contourCanvas} 
          width={WIDTH + 60} 
          height={HEIGHT} 
          on:click={handleContourClick}
          class={isLoading ? 'loading' : ''}
        ></canvas>
      </div>
      
      <div class="info">
        <p>Samples: {samples.length}</p>
        <p>Current energy: {calculateEnergy(phi, psi).toFixed(2)}</p>
        <div class="instruction">
          <p class="highlight">Click on the plot above to add sample points and update the GP model</p>
        </div>
        <div class="button-group">
          {#if samples.length > 0}
            <button on:click={() => { samples = []; updateGP(); }}>Clear Samples</button>
          {/if}
          <button on:click={toggleEnergyFunction} class="info-button">
            {showEnergyFunction ? 'Show GP Prediction' : 'Show Energy Function'}
          </button>
        </div>
        
        <div class="energy-function">
          <h3>About the Visualization:</h3>
          <p>{showEnergyFunction ? 'Showing actual energy function' : 'Showing Gaussian Process prediction'}</p>
          <p>The energy function represents different stable conformations of the protein backbone. Darker blue regions indicate lower energy (more stable conformations).</p>
          <p>Click directly on the plot to add sample points and build a GP model that learns this energy landscape.</p>
        </div>
      </div>
    </div>
  </div>
</main>
<style>
  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
  }
  
  h1 {
    text-align: center;
    margin-bottom: 20px;
  }
  
  h2 {
    margin-top: 0;
  }
  
  h3 {
    margin-top: 15px;
    margin-bottom: 5px;
  }
  
  .container {
    display: flex;
    flex-direction: row;
    gap: 20px;
  }
  
  @media (max-width: 900px) {
    .container {
      flex-direction: column;
    }
  }
  
  .panel {
    flex: 1;
    background-color: #f5f5f5;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  canvas {
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 15px;
  }
  
  canvas.loading {
    cursor: wait;
    opacity: 0.7;
  }
  
  .contour-container {
    overflow: hidden;
    position: relative;
  }
  
  .contour-container canvas {
    cursor: pointer;
  }
  
  .controls, .info {
    padding: 10px;
    background-color: white;
    border-radius: 4px;
    border: 1px solid #ddd;
  }
  
  .slider-container {
    margin-bottom: 15px;
  }
  
  label {
    display: block;
    margin-bottom: 5px;
  }
  
  input[type="range"] {
    width: 100%;
  }
  
  .button-group {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  
  button {
    background-color: #4CAF50;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    margin-top: 10px;
  }
  
  button:hover {
    background-color: #45a049;
  }
  
  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .info-button {
    background-color: #2196F3;
  }
  
  .info-button:hover {
    background-color: #0b7dda;
  }
  
  .energy-function {
    margin-top: 15px;
    padding: 10px;
    background-color: #f8f8f8;
    border-radius: 4px;
    border-left: 4px solid #2196F3;
  }
  
  .instruction {
    margin: 10px 0;
    padding: 10px;
    background-color: #fffde7;
    border-radius: 4px;
    border-left: 4px solid #ffc107;
  }
  
  .highlight {
    font-weight: bold;
    margin: 0;
  }
  
  pre {
    background-color: #f1f1f1;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.4;
  }
</style>
