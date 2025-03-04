<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import * as math from 'mathjs';

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

  // State variables (Note: 'angle' represents the impact parameter in km)
  let angle = 5000; // initial impact parameter (km)
  let velocity = 3; // initial velocity (km/s)
  let samples = [];
  let gpPredictions = [];
  let canvas;
  let contourCanvas;
  let isLoading = false;
  let showEnergyFunction = false;

  // Constants for the flyby function
  const mu = 398600.4418; // km^3/s^2
  const R_e = 6371;       // km

  // Flyby distance function (maps velocity and impact parameter to flyby distance)
  function flyby_distance(v, b, mu = 398600.4418, R_e = 6371) {
    const e = Math.sqrt(1 + (Math.pow(b, 2) * Math.pow(v, 4)) / Math.pow(mu, 2));
    const rp = mu * (e - 1) / Math.pow(v, 2);
    return rp >= R_e ? rp : 0;
  }

  // Energy function using flyby_distance.
  function calculateEnergy(b, v) {
    return flyby_distance(v, b);
  }

  // Scales: impact parameter from 5000 to 5·R_e (km), velocity from 3 to 20 km/s.
  const WIDTH = 400;
  const HEIGHT = 400;
  const MARGIN = 40;
  const PLOT_SIZE = WIDTH - 2 * MARGIN;
  
  const xScale = d3.scaleLinear().domain([5000, 5 * R_e]).range([MARGIN, WIDTH - MARGIN]);
  const yScale = d3.scaleLinear().domain([3, 20]).range([HEIGHT - MARGIN, MARGIN]);

  // Energy range for color scaling
  let energyMin = Infinity;
  let energyMax = -Infinity;
  function calculateEnergyRange() {
    const gridSize = 50;
    const impactVals = math.range(5000, 5 * R_e, (5 * R_e - 5000) / gridSize).toArray();
    const velocityVals = math.range(3, 20, (20 - 3) / gridSize).toArray();
    for (const b of impactVals) {
      for (const gridVelocity of velocityVals) {
        const energy = calculateEnergy(b, gridVelocity);
        energyMin = Math.min(energyMin, energy);
        energyMax = Math.max(energyMax, energy);
      }
    }
    energyMin = Math.floor(energyMin * 10) / 10;
    energyMax = Math.ceil(energyMax * 10) / 10;
    console.log(`Energy range: ${energyMin} to ${energyMax}`);
  }

  function addSample() {
    const energy = calculateEnergy(angle, velocity);
    samples = [...samples, { angle, velocity, energy }];
    updateGP();
  }

  function clearSamples() {
    samples = [];
    gpPredictions = [];
    drawContourPlot();
  }

  function handleContourClick(event) {
    if (isLoading) return;
    const rect = contourCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x >= MARGIN && x <= WIDTH - MARGIN && y >= MARGIN && y <= HEIGHT - MARGIN) {
      const clickedB = xScale.invert(x);
      const clickedVelocity = yScale.invert(y);
      angle = clickedB;
      velocity = clickedVelocity;
      const energy = calculateEnergy(angle, velocity);
      samples = [...samples, { angle, velocity, energy }];
      updateGP();
      drawAstroid();
    }
  }

  // GP regression using an RBF kernel
  function updateGP() {
    isLoading = true;
    if (samples.length === 0) {
      isLoading = false;
      return;
    }
    setTimeout(() => {
      const X = samples.map(s => [s.angle, s.velocity]);
      const y = samples.map(s => s.energy);
      const rbf = (x1, x2) => {
        const d0 = (x1[0] - x2[0]) / 10000;
        const d1 = (x1[1] - x2[1]) / 5;
        return Math.exp(-0.5 * (d0 * d0 + d1 * d1));
      };
      const n = X.length;
      const K = math.zeros(n, n);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          K.set([i, j], rbf(X[i], X[j]));
        }
      }
      const noise = 0.01;
      for (let i = 0; i < n; i++) {
        K.set([i, i], K.get([i, i]) + noise);
      }
      const gridSize = 40;
      const bVals = math.range(5000, 5 * R_e, (5 * R_e - 5000) / gridSize).toArray();
      const velocityVals = math.range(3, 20, (20 - 3) / gridSize).toArray();
      gpPredictions = [];
      for (const gridB of bVals) {
        for (const gridVelocity of velocityVals) {
          const x_star = [gridB, gridVelocity];
          const k_star = math.zeros(1, n);
          for (let i = 0; i < n; i++) {
            k_star.set([0, i], rbf(x_star, X[i]));
          }
          try {
            const K_inv_y = math.lusolve(K, y);
            const mean = math.multiply(k_star, K_inv_y).get([0, 0]);
            gpPredictions.push({ angle: gridB, velocity: gridVelocity, predicted: mean });
          } catch (e) {
            console.error("Error in GP calculation:", e);
          }
        }
      }
      drawContourPlot();
      isLoading = false;
    }, 50);
  }

  // Draw the energy landscape with improved axis labels and colorbar
  function drawContourPlot() {
    if (!contourCanvas) return;
    const ctx = contourCanvas.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const colorScale = d3.scaleSequential(d3.interpolateViridis)
                      .domain([energyMax, energyMin])
                      .interpolator(d3.interpolateViridis);
    if (showEnergyFunction || gpPredictions.length === 0) {
      const gridSize = 80;
      const cellSize = PLOT_SIZE / gridSize;
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const bVal = 5000 + ((5 * R_e - 5000) * i) / gridSize;
          const velocityVal = 3 + ((20 - 3) * j) / gridSize;
          const energy = calculateEnergy(bVal, velocityVal);
          const x = xScale(bVal);
          const y = yScale(velocityVal);
          ctx.fillStyle = colorScale(energy);
          ctx.fillRect(x - cellSize / 2, y - cellSize / 2, cellSize, cellSize);
        }
      }
    } else {
      const cellSize = PLOT_SIZE / Math.sqrt(gpPredictions.length);
      gpPredictions.forEach(p => {
        const x = xScale(p.angle);
        const y = yScale(p.velocity);
        ctx.fillStyle = colorScale(p.predicted);
        ctx.fillRect(x - cellSize / 2, y - cellSize / 2, cellSize, cellSize);
      });
    }
    
    // Draw colorbar with tick marks and labels on the right
    drawColorbar(ctx, colorScale);
    
    // Draw axes (simplified labels)
    ctx.strokeStyle = COLORS.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MARGIN, HEIGHT - MARGIN);
    ctx.lineTo(WIDTH - MARGIN, HEIGHT - MARGIN);
    ctx.moveTo(MARGIN, MARGIN);
    ctx.lineTo(MARGIN, HEIGHT - MARGIN);
    ctx.stroke();
    
    // X-axis labels (impact parameter)
    ctx.fillStyle = COLORS.text;
    ctx.font = "12px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("5000", MARGIN, HEIGHT - MARGIN + 15);
    ctx.fillText(String(5 * R_e), WIDTH - MARGIN, HEIGHT - MARGIN + 15);
    ctx.fillText("Impact parameter (km)", WIDTH / 2, HEIGHT - MARGIN + 30);
    
    // Y-axis labels (velocity)
    ctx.textAlign = "right";
    ctx.fillText("3", MARGIN - 10, HEIGHT - MARGIN);
    ctx.fillText("20", MARGIN - 10, MARGIN);
    ctx.save();
    ctx.translate(MARGIN - 30, HEIGHT / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Velocity (km/s)", 0, 0);
    ctx.restore();
    
    // Draw GP sample markers on top
    samples.forEach(s => {
      const x = xScale(s.angle);
      const y = yScale(s.velocity);
      const glow = 10;
      const gradient = ctx.createRadialGradient(x, y, 2, x, y, glow);
      gradient.addColorStop(0, COLORS.highlight);
      gradient.addColorStop(1, "rgba(106, 137, 204, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, glow, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = COLORS.accent;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = COLORS.primary;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  // Draw colorbar with tick marks and labels placed on the right side of the bar
  function drawColorbar(ctx, colorScale) {
    const barWidth = 20;
    const barHeight = HEIGHT - 2 * MARGIN;
    const barX = WIDTH - MARGIN + 20;
    const barY = MARGIN;
    const steps = 100;
    const stepHeight = barHeight / steps;
    
    for (let i = 0; i < steps; i++) {
      const value = energyMin + (energyMax - energyMin) * (steps - i - 1) / steps;
      ctx.fillStyle = colorScale(value);
      ctx.fillRect(barX, barY + i * stepHeight, barWidth, stepHeight + 1);
    }
    
    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    ctx.fillStyle = COLORS.text;
    ctx.font = "14px Arial, sans-serif";
    ctx.textAlign = "left";
    
    // Place tick labels to the right of the colorbar.
    const offset = 5;
    // Minimum tick
    const minY = barY + barHeight;
    ctx.beginPath();
    ctx.moveTo(barX, minY);
    ctx.lineTo(barX + barWidth, minY);
    ctx.stroke();
    ctx.fillText(energyMin.toFixed(1), barX + barWidth + offset, minY + 5);
    
    // Maximum tick
    const maxY = barY;
    ctx.beginPath();
    ctx.moveTo(barX, maxY);
    ctx.lineTo(barX + barWidth, maxY);
    ctx.stroke();
    ctx.fillText(energyMax.toFixed(1), barX + barWidth + offset, maxY + 5);
    
    // Middle tick
    const midY = barY + barHeight / 2;
    ctx.beginPath();
    ctx.moveTo(barX, midY);
    ctx.lineTo(barX + barWidth, midY);
    ctx.stroke();
    ctx.fillText(((energyMin + energyMax) / 2).toFixed(1), barX + barWidth + offset, midY + 5);
    
    // Rotated label for the colorbar remains on the left side of the bar.
    ctx.save();
    ctx.translate(barX - 25, barY + barHeight / 2);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("Flyby Distance (km)", 0, 0);
    ctx.restore();
  }

  // Draw the asteroid visualization including:
  // - Asteroid as an irregular polygon (with an offset so it’s never flush with Earth)
  // - A full-panel horizontal dashed line running behind the velocity vector
  // - The velocity vector with its arrowhead and a "velocity" label
  // - A full-panel horizontal solid line through Earth's center
  // - A vertical double-arrow measuring the distance between the asteroid's dashed line and Earth's line, labeled "impact parameter"
  // - A small text label "Earth" by the Earth marker.
  function drawAstroid() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Offset so the asteroid is always slightly elevated above Earth.
    const asteroidOffset = 30;
    const impactScale = d3.scaleLinear()
                          .domain([5000, 5 * R_e])
                          .range([HEIGHT - MARGIN - asteroidOffset, MARGIN]);
    const yPos = impactScale(angle);
    const xPos = MARGIN * 2;
    
    // Draw a horizontal dashed line (across entire canvas) at the asteroid's y position.
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, yPos);
    ctx.lineTo(WIDTH, yPos);
    ctx.strokeStyle = COLORS.error;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    
    // Draw asteroid as an irregular polygon.
    const asteroidRadius = 20;
    const numVertices = 12;
    const angleStep = (2 * Math.PI) / numVertices;
    ctx.beginPath();
    for (let i = 0; i < numVertices; i++) {
      const currentAngle = i * angleStep;
      const noise = 0.8 + Math.random() * 0.4; // random factor between 0.8 and 1.2
      const r = asteroidRadius * noise;
      const x = xPos + r * Math.cos(currentAngle);
      const y = yPos + r * Math.sin(currentAngle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = COLORS.surface;
    ctx.fill();
    ctx.strokeStyle = COLORS.primary;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw the horizontal velocity vector (scaled by 10).
    const velocityScale = 10;
    const vectorLength = velocity * velocityScale;
    ctx.beginPath();
    ctx.moveTo(xPos, yPos);
    ctx.lineTo(xPos + vectorLength, yPos);
    ctx.strokeStyle = COLORS.error;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw arrowhead at the end of the velocity vector.
    const arrowSize = 8;
    ctx.beginPath();
    ctx.moveTo(xPos + vectorLength, yPos);
    ctx.lineTo(xPos + vectorLength - arrowSize, yPos - arrowSize / 2);
    ctx.lineTo(xPos + vectorLength - arrowSize, yPos + arrowSize / 2);
    ctx.closePath();
    ctx.fillStyle = COLORS.error;
    ctx.fill();
    
    // Label the velocity vector.
    const velMidX = xPos + vectorLength / 2;
    const velMidY = yPos;
    ctx.fillStyle = COLORS.text;
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("velocity", velMidX, velMidY - 10);
    
    // Draw a contextual Earth with a radial gradient.
    const earthRadius = 20;
    const earthX = WIDTH - MARGIN - earthRadius;
    const earthY = HEIGHT - MARGIN - earthRadius;
    const earthGradient = ctx.createRadialGradient(earthX, earthY, earthRadius * 0.3, earthX, earthY, earthRadius);
    earthGradient.addColorStop(0, "#66ccff");
    earthGradient.addColorStop(1, "#003366");
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthRadius, 0, 2 * Math.PI);
    ctx.fillStyle = earthGradient;
    ctx.fill();
    ctx.strokeStyle = "#002244";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw a full-panel horizontal solid line through Earth's center.
    ctx.beginPath();
    ctx.moveTo(0, earthY);
    ctx.lineTo(WIDTH, earthY);
    ctx.strokeStyle = COLORS.primary;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw a vertical double-arrow measuring the distance between the asteroid's dashed line (yPos) and Earth's horizontal line (earthY).
    const midX = (xPos + earthX) / 2;
    ctx.beginPath();
    ctx.moveTo(midX, yPos);
    ctx.lineTo(midX, earthY);
    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Define arrowhead size for the measurement arrow.
    const measArrowSize = 5;
    // Top arrowhead (points upward)
    ctx.beginPath();
    ctx.moveTo(midX, yPos);
    ctx.lineTo(midX - measArrowSize, yPos + measArrowSize);
    ctx.lineTo(midX + measArrowSize, yPos + measArrowSize);
    ctx.closePath();
    ctx.fillStyle = COLORS.text;
    ctx.fill();
    // Bottom arrowhead (points downward)
    ctx.beginPath();
    ctx.moveTo(midX, earthY);
    ctx.lineTo(midX - measArrowSize, earthY - measArrowSize);
    ctx.lineTo(midX + measArrowSize, earthY - measArrowSize);
    ctx.closePath();
    ctx.fillStyle = COLORS.text;
    ctx.fill();
    
    // Label the vertical measurement line with "impact parameter".
    ctx.save();
    ctx.fillStyle = COLORS.text;
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.fillText("impact parameter", midX + 5, (yPos + earthY) / 2);
    ctx.restore();
    
    // Label the Earth with a small text.
    ctx.fillStyle = COLORS.text;
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Earth", earthX, earthY - earthRadius - 5);
    
    // Display current impact parameter and velocity.
    ctx.fillStyle = COLORS.text;
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Impact Parameter: ${angle.toFixed(0)} km`, 20, 30);
    ctx.fillText(`Velocity: ${velocity.toFixed(2)} km/s`, 20, 50);
  }

  function toggleEnergyFunction() {
    showEnergyFunction = !showEnergyFunction;
    drawContourPlot();
  }

  onMount(() => {
    console.log("Astroid canvas:", canvas);
    console.log("Contour canvas:", contourCanvas);
    calculateEnergyRange();
    drawAstroid();
    drawContourPlot();
  });

  $: if (canvas && (angle !== undefined || velocity !== undefined)) {
    drawAstroid();
  }
</script>

<main>
  <h1>Astroid with Velocity Vector Explorer</h1>
  <div class="container">
    <div class="panel">
      <h2>Astroid Visualization</h2>
      <canvas bind:this={canvas} width={WIDTH} height={HEIGHT}></canvas>
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
        <p>Current energy: {calculateEnergy(angle, velocity).toFixed(2)}</p>
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
          <p>The energy function (flyby distance) represents the closest approach distance given an object’s hyperbolic speed and impact parameter. A value of 0 indicates a collision with Earth.</p>
          <p>Click directly on the plot to add sample points and build a GP model that learns this landscape.</p>
        </div>
      </div>
    </div>
  </div>
</main>

<style>
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
    font-family: 'Helvetica Neue', sans-serif;
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
    font-family: 'Helvetica Neue', sans-serif;
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
