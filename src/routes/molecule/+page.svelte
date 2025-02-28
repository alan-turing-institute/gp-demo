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

// Color palette - elegant muted colors
const COLORS = {
  primary: "#3c6382",       // Deep blue
  secondary: "#82ccdd",     // Light blue
  accent: "#60a3bc",        // Medium blue
  highlight: "#6a89cc",     // Periwinkle
  text: "#2c3e50",          // Dark slate
  background: "#f5f6fa",    // Off-white
  surface: "#dcdde1",       // Light gray
  bond1: "#38ada9",         // Teal
  bond2: "#6a89cc",         // Periwinkle
  atom1: "#3c6382",         // Deep blue
  atom2: "#60a3bc",         // Medium blue
  atom3: "#82ccdd",         // Light blue
  atom4: "#38ada9",         // Teal
  success: "#78e08f",       // Soft green
  error: "#e55039"          // Soft red
};

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

// Function to clear all samples
function clearSamples() {
  samples = [];
  gpPredictions = [];
  drawContourPlot();
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
    drawContourPlot(); // Still need to redraw to show empty plot
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
  ctx.clearRect(0, 0, WIDTH + 60, HEIGHT);
  
  // Use a more elegant color scale: viridis (blues to greens to yellows)
  const colorScale = d3.scaleSequential()
    .domain([energyMax, energyMin])  
    .interpolator(d3.interpolateViridis);
  
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
  ctx.rotate(phi);
  
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
  ctx.fillText("φ = " + phi.toFixed(2), 5, -30);
  ctx.restore();
  
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(psi);
  
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
  ctx.fillText("ψ = " + psi.toFixed(2), 5, -30);
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
      
      <div class="Other">

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
          <p>The energy function represents different stable conformations of the protein backbone. Darker regions indicate lower energy (more stable conformations).</p>
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
    font-family: 'Helvetica Neue', Arial, sans-serif;
    background: linear-gradient(135deg, #f5f6fa 0%, #dfe4ea 100%);
    border-radius: 10px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
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
</style>