<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import * as math from 'mathjs';
  import Pdbmol from '$lib/Pdbmol.svelte';
  
  // State variables
  $: phi = 0;
  $: psi = 0;
  let samples = [];
  let gpPredictions = [];
  let canvas;
  let contourCanvas;
  let isLoading = false;
  let showEnergyFunction = false;
  let lives = 20; // Add lives state
  let gameEnded = false; // Track if the game has ended
  
  // Constants
  const WIDTH = 400;
  const HEIGHT = 400;
  const MARGIN = 40;
  const PLOT_SIZE = WIDTH - 2 * MARGIN;
  
  // Scales for plotting
  const xScale = d3.scaleLinear([0, 360], [MARGIN, WIDTH - MARGIN]);
  const yScale = d3.scaleLinear([0, 360], [HEIGHT - MARGIN, MARGIN]);
  
  // Color palette - elegant muted colors
  const COLORS = {
    primary: "#3c6382",
    secondary: "#82ccdd",
    accent: "#60a3bc",
    highlight: "#6a89cc",
    text: "#2c3e50",
    background: "#f5f6fa",
    surface: "#dcdde1",
    bond1: "#38ada9",
    bond2: "#6a89cc",
    atom1: "#3c6382",
    atom2: "#60a3bc",
    atom3: "#82ccdd",
    atom4: "#38ada9",
    success: "#78e08f",
    error: "#e55039"
  };
  
  // Calculate min and max energy values for consistent color scaling
  let energyMin = Infinity;
  let energyMax = -Infinity;
  
  // Pre-calculate energy values across the domain to find min/max
  function calculateEnergyRange() {
    const gridSize = 50;
    const phiVals = math.range(0, 360, 360 / gridSize).toArray();
    const psiVals = math.range(0, 360, 360 / gridSize).toArray();
    
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

  function degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Energy function (as provided)
  function calculateEnergy(phi, psi) {
    // Convert degrees to radians and translate to -pi, pi
    const phiRad = degToRad(phi) - Math.PI;
    const psiRad = degToRad(psi) - Math.PI;

    // Modified free energy function with multiple peaks along psi
    const term1 = Math.exp(-((phiRad + Math.PI / 2) ** 2) - ((psiRad - Math.PI / 2) ** 2) / 0.5);
    const term2 = Math.exp(-((phiRad + Math.PI / 2) ** 2) - ((psiRad + 0.5) ** 2) / 0.3);
    const term3 = Math.exp(-((phiRad - Math.PI / 2) ** 2) - ((psiRad + Math.PI / 2) ** 2) / 0.5);
    const term4 = Math.exp(-((phiRad - Math.PI / 2) ** 2) - ((psiRad - 0.5) ** 2) / 0.3);
    const term5 = Math.exp(-((phiRad - 0) ** 2) / 0.3 - ((psiRad - Math.PI / 4) ** 2) / 0.2);

    let F = 0;
    if (difficulty == "1") {
      F = term1
    }
    else if(difficulty == "2") {
      F = term1 + term2
    }
    else if (difficulty == "3") {
      F = term1 + term2 + term3 + term4 + term5
    }
    else {
      console.error("Invalid difficulty level: ", difficulty);
    }
    return -Math.log(F + 1e-6);
  }
  
  // Function to add a new sample
  function addSample() {
    const energy = calculateEnergy(phi, psi);
    samples = [...samples, { phi, psi, energy }];
    updateGP();
  }
  
  // Function to clear all samples
  function clearSamples() {
    samples = [];
    gpPredictions = [];
    drawContourPlot();
  }
  
  // Add sample by clicking on contour plot
  function handleContourClick(event) {
    if (isLoading || lives <= 0) return; // Prevent clicks when out of lives
    
    const rect = contourCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert click coordinates to phi/psi values
    const clickedPhi = Math.round(xScale.invert(x));
    const clickedPsi = Math.round(yScale.invert(y));
    
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
      
      // Deduct one life
      lives -= 1;
      
      // Check if lives reached 0
      if (lives === 0) {
        gameEnded = true; // Trigger game end
      }
      
      // Update the GP model
      updateGP();
      
      // Update the molecule visualization
      drawMolecule();
    }
  }
  
  // Reset the game
  function resetGame() {
    lives = 20;
    samples = [];
    gpPredictions = [];
    gameEnded = false;
    drawContourPlot();
  }
  
// Perform Gaussian Process regression using RBF kernel
function updateGP() {
  isLoading = true;
  
  // Need at least one sample for GP
  if (samples.length === 0) {
    isLoading = false;
    drawContourPlot(); // Still need to redraw to show empty plot
    return;
  }
  setTimeout(() => {
    // Prepare training data
    const X = samples.map(s => [s.phi, s.psi]);
    const y = samples.map(s => s.energy);
    
    // RBF kernel function
    // TODO: see if a different lengthscale works better
    const rbf = (x1, x2, lengthScale = 1.0*(180 / Math.PI)) => {
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
    const phiVals = math.range(0, 360, 360 / gridSize).toArray();
    const psiVals = math.range(0, 360, 360 / gridSize).toArray();
    
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
  ctx.clearRect(0, 0, WIDTH + 60, HEIGHT);
  
  // Use a more elegant color scale: viridis (blues to greens to yellows)
  const colorScale = d3.scaleSequential()
    .domain([energyMax, energyMin])  
    .interpolator(d3.interpolateViridis);
  
  // If we should display the energy function instead of GP predictions
  if (showEnergyFunction) {
    // Draw the actual energy function
    const gridSize = 80;
    const cellSize = PLOT_SIZE / gridSize;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const phi = 0 + 360 * i / gridSize;
        const psi = 0 + 360 * j / gridSize;
        
        const energy = calculateEnergy(phi, psi);
        const x = xScale(phi);
        const y = yScale(psi);
        
        ctx.fillStyle = colorScale(energy);
        ctx.fillRect(x - cellSize/2, y - cellSize/2, cellSize, cellSize);
      }
    }
  } else if (gpPredictions.length === 0){  
      const gridSize = 80;
      const cellSize = PLOT_SIZE / gridSize;

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const phi = 0 + 360 * i / gridSize;
        const psi = 0 + 360 * j / gridSize;
        
        const x = xScale(phi);
        const y = yScale(psi);

          ctx.fillStyle = colorScale(0);
          ctx.fillRect(x - cellSize / 2, y - cellSize / 2, cellSize, cellSize);
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
  
  // Draw axes with elegant styling
  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  // X-axis
  ctx.moveTo(MARGIN, HEIGHT - MARGIN);
  ctx.lineTo(WIDTH - MARGIN, HEIGHT - MARGIN);
  
  // Y-axis
  ctx.moveTo(MARGIN, MARGIN);
  ctx.lineTo(MARGIN, HEIGHT - MARGIN);
  ctx.stroke();
  
  // Draw axis labels with elegant font
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 14px Arial, sans-serif";
  ctx.textAlign = "center";
  
  // X-axis labels
  ctx.fillText("0", MARGIN, HEIGHT - MARGIN + 15);
  ctx.fillText("180", (WIDTH) / 2, HEIGHT - MARGIN + 15);
  ctx.fillText("360", WIDTH - MARGIN, HEIGHT - MARGIN + 15);
  ctx.fillText("φ", WIDTH - MARGIN + 10, HEIGHT - MARGIN + 25);
  
  // Y-axis labels
  ctx.textAlign = "right";
  ctx.fillText("0", MARGIN - 5, HEIGHT - MARGIN);
  ctx.fillText("180", MARGIN - 5, (HEIGHT) / 2);
  ctx.fillText("360", MARGIN - 5, MARGIN);
  ctx.fillText("ψ", MARGIN - 20, MARGIN - 20);
  
  // Draw sample points with elegant style
  samples.forEach(s => {
    const x = xScale(s.phi);
    const y = yScale(s.psi);
    
    // Subtle glow
    const glow = 8;
    const gradient = ctx.createRadialGradient(x, y, 2, x, y, glow);
    gradient.addColorStop(0, COLORS.highlight);
    gradient.addColorStop(1, "rgba(106, 137, 204, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, glow, 0, 2 * Math.PI);
    ctx.fill();
    
    // Inner point
    ctx.fillStyle = COLORS.accent;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = COLORS.primary;
    ctx.lineWidth = 1;
    ctx.stroke();
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
  
  // Draw border around colorbar with elegant style
  ctx.strokeStyle = COLORS.text;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  
  // Draw labels for the colorbar with elegant font
  ctx.fillStyle = COLORS.text;
  ctx.font = "12px Arial, sans-serif";
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
  ctx.fillText("Energy", 0, 10);
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
  
  // Draw elegant background
  const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
  bgGradient.addColorStop(0, "rgba(60, 99, 130, 0.1)");
  bgGradient.addColorStop(1, "rgba(245, 246, 250, 0.05)");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Draw backbone with subtle gradient
  const gradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
  gradient.addColorStop(0, COLORS.secondary);
  gradient.addColorStop(0.5, COLORS.primary);
  gradient.addColorStop(1, COLORS.secondary);
  
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX - radius, centerY);
  ctx.lineTo(centerX + radius, centerY);
  ctx.stroke();
  
  // Draw atoms with elegant colors
  const atoms = [
    { x: centerX - radius, y: centerY, color: COLORS.atom1, label: "N", size: 24 },
    { x: centerX - radius/2, y: centerY, color: COLORS.atom2, label: "Cα", size: 26 },
    { x: centerX, y: centerY, color: COLORS.atom3, label: "C", size: 24 },
    { x: centerX + radius/2, y: centerY, color: COLORS.atom4, label: "O", size: 24 },
    { x: centerX + radius, y: centerY, color: COLORS.atom1, label: "N", size: 24 }
  ];
  
  // Draw bonds with phi and psi angles
  ctx.save();
  ctx.translate(centerX - radius/2, centerY);
  ctx.rotate(degToRad(phi));
  
  // Create elegant gradient for phi bond
  const phiGradient = ctx.createLinearGradient(0, 0, 0, -60);
  phiGradient.addColorStop(0, COLORS.bond1);
  phiGradient.addColorStop(1, COLORS.secondary);
  ctx.strokeStyle = phiGradient;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -60);
  ctx.stroke();
  
  // Phi text with elegant styling
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 14px Arial, sans-serif";
  ctx.fillText("φ = " + phi.toFixed(0), 5, -30);
  ctx.restore();
  
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(degToRad(psi));
  
  // Create elegant gradient for psi bond
  const psiGradient = ctx.createLinearGradient(0, 0, 0, -60);
  psiGradient.addColorStop(0, COLORS.bond2);
  psiGradient.addColorStop(1, COLORS.highlight);
  ctx.strokeStyle = psiGradient;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -60);
  ctx.stroke();
  
  // Psi text with elegant styling
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 14px Arial, sans-serif";
  ctx.fillText("ψ = " + psi.toFixed(0), 5, -30);
  ctx.restore();
  
  // Draw atoms with subtle glow effects
  atoms.forEach(atom => {
    // Subtle glow
    const glow = ctx.createRadialGradient(atom.x, atom.y, 0, atom.x, atom.y, atom.size * 1.2);
    glow.addColorStop(0, atom.color);
    glow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(atom.x, atom.y, atom.size * 1.2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Atom
    ctx.fillStyle = atom.color;
    ctx.beginPath();
    ctx.arc(atom.x, atom.y, atom.size, 0, 2 * Math.PI);
    ctx.fill();
    
    // Atom label
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Arial, sans-serif";
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
  calculateEnergyRange();
  drawMolecule();
  drawContourPlot();
});

$: {
  if (canvas && (phi || psi)) {
    drawMolecule();
  }
}

$: difficulty = "3";

function handleChange(event) {
  difficulty = event.target.value;
  if(showEnergyFunction) drawContourPlot();
  console.log("Difficulty level set to: ", difficulty);
}

</script>

<main>
  <h1>Protein Backbone Conformation Explorer</h1>
  
  <!-- Live Bar -->
  <div class="live-bar-container">
    <div class="lives-label">Lives {lives}/20</div>
    <div class="live-bar">
      <div class="lives-remaining" style="width: {Math.max(0, (lives / 20) * 100)}%"></div>
      <span class="heart" style="left: {Math.max(0, (lives / 20) * 100)}%">❤️</span>
    </div>
  </div>

  <!-- Game Ended Popup -->
  {#if gameEnded}
    <div class="game-ended-popup">
      <div class="popup-content">
        <h2>Game Ended</h2>
        <p>You've used all your lives!</p>
        <button on:click={resetGame}>Play Again</button>
      </div>
    </div>
  {/if}

  <div class="level-container">
    <label for="level" class="level-label">Difficulty:</label>
    <select id="level" bind:value={difficulty} on:change={handleChange}>
      <option value="1">Level 1</option>
      <option value="2">Level 2</option>
      <option value="3">Level 3</option>
    </select>
  </div>

  <div class="container">
    <div class="panel">
      <h2>Backbone Angles</h2>
      <canvas bind:this={canvas} width={WIDTH} height={HEIGHT}></canvas>
      
      <div class="Other">
        <div class="control-panel">
          <div class="slider-container">
            <label for="angle">Psi Angle (degrees):</label>
            <input type="range" id="angle" bind:value={psi} min="0" max="360" step="1" />
            <span>{psi}°</span>
          </div>
          
          <div class="slider-container">
            <label for="phiAngle">Phi Angle (degrees):</label>
            <input type="range" id="phiAngle" bind:value={phi} min="0" max="360" step="1" />
            <span>{phi}°</span>
          </div>
        </div>
        <Pdbmol bind:angle={phi} bind:phiAngle={psi}></Pdbmol>
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
            <button on:click={clearSamples}>Clear Samples</button>
          {/if}
          <button on:click={toggleEnergyFunction} class="info-button">
            {showEnergyFunction ? 'Show GP Prediction' : 'Show Energy Function'}
          </button>
        </div>
        
        <div class="energy-function">
          <h3>About the Visualization:</h3>
          <p>{showEnergyFunction ? 'Showing actual energy function' : 'Showing Gaussian Process prediction'}</p>
          <p>The energy function represents different stable conformations of the protein backbone. Lighter regions indicate lower energy (more stable conformations).</p>
          <p>Click directly on the plot to add sample points and build a GP model that learns this energy landscape.</p>
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  /* Live Bar Container */
  .live-bar-container {
    margin: 20px 0;
  }

  .level-container {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 16px;
    font-family: Arial, sans-serif;
  }

  .level-label,
  select {
    display: flex;
    align-items: baseline;
    font-size: 16px;
    font-weight: 500;
  }

  /* Lives Label */
  .lives-label {
    font-size: 18px;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 5px;
    text-align: center;
  }

  /* Live Bar Styles */
  .live-bar {
    position: relative;
    height: 30px;
    background: #eee;
    border-radius: 15px;
    overflow: visible;
  }

  .lives-remaining {
    height: 100%;
    background: #ff4444;
    transition: width 0.3s ease;
    border-radius: 15px 0 0 15px;
  }

  .heart {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
    transition: left 0.3s ease;
    filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
  }

  /* Game Ended Popup Styles */
  .game-ended-popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .popup-content {
    background: white;
    padding: 30px;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }

  .popup-content h2 {
    color: #e55039;
    margin-bottom: 20px;
  }

  .popup-content button {
    background: #3c6382;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
  }

  .popup-content button:hover {
    background: #2d4d62;
  }


    :root {
      --primary: #3c6382;
      --secondary: #82ccdd;
      --accent: #60a3bc;
      --highlight: #6a89cc;
      --text: #2c3e50;
      --background: #f5f6fa;
      --surface: #dcdde1;
      --success: #78e08f;
    }
    
    :global(body) {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, var(--background) 0%, var(--surface) 100%);
      margin: 0;
      padding: 0;
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }   

    main {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      /* background: linear-gradient(135deg, #f5f6fa 0%, #dfe4ea 100%); */
      /* border-radius: 10px; */
      /* box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1); */
    }
  
  h1 {
    text-align: center;
    margin-bottom: 20px;
    color: #3c6382;
    font-size: 2.2em;
    letter-spacing: 0.5px;
  }
  
  h2 {
    margin-top: 0;
    color: #2c3e50;
    font-weight: 500;
  }
  
  h3 {
    margin-top: 15px;
    margin-bottom: 5px;
    color: #3c6382;
    font-weight: 500;
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
    background: #ffffff;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    border: 1px solid #e8e8e8;
  }
  
  canvas {
    background-color: white;
    border: 2px solid #3c6382;
    border-radius: 8px;
    margin-bottom: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  }
  
  canvas.loading {
    cursor: wait;
    opacity: 0.7;
    animation: pulse 1.5s infinite alternate;
  }
  
  @keyframes pulse {
    from { opacity: 0.6; }
    to { opacity: 0.9; }
  }
  
  .contour-container {
    overflow: hidden;
    position: relative;
    border-radius: 8px;
  }
  
  .contour-container canvas {
    cursor: pointer;
  }
  
  .controls, .info {
    padding: 15px;
    background: #f5f6fa;
    border-radius: 8px;
    border: 1px solid #dcdde1;
  }
  
  .slider-container {
    margin-bottom: 15px;
  }
  
  label {
    display: block;
    margin-bottom: 8px;
    color: #2c3e50;
    font-weight: 500;
    font-size: 14px;
  }
  
  input[type="range"] {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(to right, #3c6382, #82ccdd);
    -webkit-appearance: none;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #60a3bc;
    border: 2px solid #fff;
    cursor: pointer;
  }
  
  .button-group {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
  }
  
  button {
    background: linear-gradient(to right, #3c6382, #60a3bc);
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    margin-top: 10px;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-weight: 500;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }
  
  button:hover {
    background: linear-gradient(to right, #2d4d62, #4a8094);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
  
  button:active {
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  button:disabled {
    background: linear-gradient(to right, #bdc3c7, #95a5a6);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  .info-button {
    background: linear-gradient(to right, #38ada9, #78e08f);
  }
  
  .info-button:hover {
    background: linear-gradient(to right, #2d8a85, #60b471);
  }
  
  .energy-function {
    margin-top: 15px;
    padding: 15px;
    background: #f9f9f9;
    border-radius: 8px;
    border-left: 4px solid #3c6382;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .instruction {
    margin: 15px 0;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #38ada9;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .highlight {
    font-weight: 500;
    margin: 0;
    color: #2c3e50;
  }
  
  pre {
    background-color: #f5f6fa;
    padding: 10px;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.4;
    border: 1px solid #dcdde1;
  }
  
  p {
    color: #2c3e50;
    margin: 8px 0;
    line-height: 1.5;
  }
  .control-panel {
		width: 100%;
		padding: 15px;
		background-color: #f5f5f5;
		border-radius: 5px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.slider-container {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.slider-container label {
		font-weight: bold;
		min-width: 170px;
	}

	.slider-container input {
		flex-grow: 1;
		max-width: 400px;
	}

	.slider-container span {
		min-width: 50px;
		text-align: right;
		font-weight: bold;
	}
</style>