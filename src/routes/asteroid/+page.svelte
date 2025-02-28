<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import * as math from 'mathjs';
  
    // State variables
    let angle = 0; // in degrees (0-359)
    let velocity = 1; // velocity magnitude
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
  
    // Updated scales: now angle is 0–360 (degrees) and velocity is 0.1–3.
    const xScale = d3.scaleLinear().domain([0, 360]).range([MARGIN, WIDTH - MARGIN]);
    const yScale = d3.scaleLinear().domain([0.1, 3]).range([HEIGHT - MARGIN, MARGIN]);
  
    // Calculate min and max energy values for consistent color scaling
    let energyMin = Infinity;
    let energyMax = -Infinity;
  
    // Pre-calculate energy values across the domain to find min/max
    function calculateEnergyRange() {
      const gridSize = 50;
      // Angle in degrees from 0 to 360 and velocity from 0.1 to 3
      const angleVals = math.range(0, 360, 360 / gridSize).toArray();
      const velocityVals = math.range(0.1, 3, (3 - 0.1) / gridSize).toArray();
      
      for (const gridAngle of angleVals) {
        for (const gridVelocity of velocityVals) {
          const energy = calculateEnergy(gridAngle, gridVelocity);
          energyMin = Math.min(energyMin, energy);
          energyMax = Math.max(energyMax, energy);
        }
      }
      
      // Add a small buffer to the range
      energyMin = Math.floor(energyMin * 10) / 10;
      energyMax = Math.ceil(energyMax * 10) / 10;
      
      console.log(`Energy range: ${energyMin} to ${energyMax}`);
    }
  
    // Energy function (angle is provided in degrees)
    function calculateEnergy(angle, velocity) {
      // Convert angle from degrees to radians for energy calculation
      const angleRad = (angle * Math.PI) / 180;
      
      // Modified free energy function with multiple peaks along velocity
      const term1 = Math.exp(-((angleRad + Math.PI / 2) ** 2) - ((velocity - Math.PI / 2) ** 2) / 0.5);
      const term2 = Math.exp(-((angleRad + Math.PI / 2) ** 2) - ((velocity + 0.5) ** 2) / 0.3);
      const term3 = Math.exp(-((angleRad - Math.PI / 2) ** 2) - ((velocity + Math.PI / 2) ** 2) / 0.5);
      const term4 = Math.exp(-((angleRad - Math.PI / 2) ** 2) - ((velocity - 0.5) ** 2) / 0.3);
      const term5 = Math.exp(-((angleRad - 0) ** 2) / 0.3 - ((velocity - Math.PI / 4) ** 2) / 0.2);
      
      const F = term1 + term2 + term3 + term4 + term5;
      return -Math.log(F + 1e-6);
    }
  
    // Function to add a new sample (angle stored in radians)
    function addSample() {
      const angleRad = (angle * Math.PI) / 180;
      const energy = calculateEnergy(angle, velocity);
      samples = [...samples, { angle: angleRad, velocity, energy }];
      updateGP();
    }
  
    // Perform Gaussian Process regression using RBF kernel
    function updateGP() {
      isLoading = true;
      
      if (samples.length === 0) {
        isLoading = false;
        return;
      }
    
      setTimeout(() => {
        const X = samples.map(s => [s.angle, s.velocity]);
        const y = samples.map(s => s.energy);
        
        const rbf = (x1, x2, lengthScale = 1.0) => {
          const squaredDist = math.sum(math.dotPow(math.subtract(x1, x2), 2));
          return math.exp(-0.5 * squaredDist / (lengthScale * lengthScale));
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
        // GP grid: training data angle is in radians (0 to 2π) and velocity is 0.1 to 3
        const angleVals = math.range(0, 2 * Math.PI, (2 * Math.PI) / gridSize).toArray();
        const velocityVals = math.range(0.1, 3, (3 - 0.1) / gridSize).toArray();
        
        gpPredictions = [];
        
        for (const gridAngle of angleVals) {
          for (const gridVelocity of velocityVals) {
            const x_star = [gridAngle, gridVelocity];
            
            const k_star = math.zeros(1, n);
            for (let i = 0; i < n; i++) {
              k_star.set([0, i], rbf(x_star, X[i]));
            }
            
            try {
              const K_inv_y = math.lusolve(K, y);
              const mean = math.multiply(k_star, K_inv_y).get([0, 0]);
              
              // Convert gridAngle from radians to degrees for plotting
              gpPredictions.push({
                angle: gridAngle * 180 / Math.PI,
                velocity: gridVelocity,
                predicted: mean
              });
            } catch (e) {
              console.error("Error in GP calculation:", e);
            }
          }
        }
        
        drawContourPlot();
        isLoading = false;
      }, 50);
    }
  
    // Draw the GP contour plot or the actual energy function
    function drawContourPlot() {
      if (!contourCanvas) return;
      
      const ctx = contourCanvas.getContext('2d');
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      
      const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([energyMin, energyMax]);
      
      if (showEnergyFunction || gpPredictions.length === 0) {
        const gridSize = 80;
        const cellSize = PLOT_SIZE / gridSize;
        
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            // Use angle in degrees (0 to 360) and velocity (0.1 to 3)
            const angleVal = (360 * i) / gridSize;
            const velocityVal = 0.1 + ((3 - 0.1) * j) / gridSize;
            
            const energy = calculateEnergy(angleVal, velocityVal);
            const x = xScale(angleVal);
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
      
      // Draw colorbar
      drawColorbar(ctx, colorScale);
      
      // Draw axes
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.beginPath();
      // X-axis (angle)
      ctx.moveTo(MARGIN, HEIGHT - MARGIN);
      ctx.lineTo(WIDTH - MARGIN, HEIGHT - MARGIN);
      // Y-axis (velocity)
      ctx.moveTo(MARGIN, MARGIN);
      ctx.lineTo(MARGIN, HEIGHT - MARGIN);
      ctx.stroke();
      
      // Axis labels
      ctx.fillStyle = "#000";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      
      ctx.fillText("0°", MARGIN, HEIGHT - MARGIN + 15);
      ctx.fillText("180°", WIDTH / 2, HEIGHT - MARGIN + 15);
      ctx.fillText("360°", WIDTH - MARGIN, HEIGHT - MARGIN + 15);
      ctx.fillText("Angle", WIDTH - MARGIN + 15, HEIGHT - MARGIN + 5);
      
      ctx.textAlign = "right";
      ctx.fillText("0.1", MARGIN - 5, HEIGHT - MARGIN);
      ctx.fillText("1.55", MARGIN - 5, HEIGHT / 2);
      ctx.fillText("3", MARGIN - 5, MARGIN);
      ctx.fillText("Velocity", MARGIN - 15, MARGIN - 10);
      
      // Draw sample points (convert stored radian values to degrees for plotting)
      samples.forEach(s => {
        const x = xScale(s.angle * 180 / Math.PI);
        const y = yScale(s.velocity);
        
        ctx.fillStyle = "#ff0000";
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
      
      const steps = 100;
      const stepHeight = barHeight / steps;
      
      for (let i = 0; i < steps; i++) {
        const value = energyMin + (energyMax - energyMin) * (steps - i - 1) / steps;
        ctx.fillStyle = colorScale(value);
        ctx.fillRect(barX, barY + i * stepHeight, barWidth, stepHeight + 1);
      }
      
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
      
      ctx.fillStyle = "#000";
      ctx.font = "12px Arial";
      ctx.textAlign = "left";
      
      ctx.fillText(energyMin.toFixed(1), barX + barWidth + 5, barY + barHeight);
      ctx.fillText(energyMax.toFixed(1), barX + barWidth + 5, barY);
      
      const middle = (energyMin + energyMax) / 2;
      ctx.fillText(middle.toFixed(1), barX + barWidth + 5, barY + barHeight / 2);
      
      ctx.save();
      ctx.translate(barX + barWidth + 25, barY + barHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("Energy", 0, 0);
      ctx.restore();
    }
  
    // Draw the astroid with a velocity vector
    function drawAstroid() {
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      
      const centerX = WIDTH / 2;
      const centerY = HEIGHT / 2;
      const radius = 120;
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((angle * Math.PI) / 180);
      
      // Draw the astroid curve with a fill for a more "solid" look
      ctx.beginPath();
      for (let t = 0; t <= 2 * Math.PI; t += 0.01) {
        const x = radius * Math.pow(Math.cos(t), 3);
        const y = radius * Math.pow(Math.sin(t), 3);
        if (t === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(200,200,200,0.3)";
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw velocity vector from the point at t=0 (which is at (radius, 0))
      const vectorLength = velocity * 50;
      ctx.strokeStyle = "#cc0000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(radius + vectorLength, 0);
      ctx.stroke();
      
      const arrowSize = 8;
      ctx.beginPath();
      ctx.moveTo(radius + vectorLength, 0);
      ctx.lineTo(radius + vectorLength - arrowSize, -arrowSize / 2);
      ctx.lineTo(radius + vectorLength - arrowSize, arrowSize / 2);
      ctx.closePath();
      ctx.fillStyle = "#cc0000";
      ctx.fill();
      
      // Mark the origin and the astroid boundary point
      ctx.fillStyle = "#0066cc";
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = "#00cc00";
      ctx.beginPath();
      ctx.arc(radius, 0, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.restore();
      
      // Display current angle and velocity values
      ctx.fillStyle = "#000";
      ctx.font = "14px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`Angle: ${angle}°`, 20, 30);
      ctx.fillText(`Velocity: ${velocity.toFixed(2)}`, 20, 50);
    }
  
    // Toggle energy function display
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
  
    // Redraw astroid on changes
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
        <div class="controls">
          <div class="slider-container">
            <label for="angle">Rotation Angle: {angle}°</label>
            <input type="range" id="angle" min="0" max="359" bind:value={angle} />
          </div>
          <div class="slider-container">
            <label for="velocity">Velocity: {velocity.toFixed(2)}</label>
            <input type="range" id="velocity" min="0.1" max="3" step="0.05" bind:value={velocity} />
          </div>
          <button on:click={addSample} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Add Sample'}
          </button>
          <button on:click={toggleEnergyFunction} class="info-button">
            {showEnergyFunction ? 'Show GP Prediction' : 'Show Energy Function'}
          </button>
        </div>
      </div>
      <div class="panel">
        <h2>Energy Landscape</h2>
        <div class="contour-container">
          <canvas bind:this={contourCanvas} width={WIDTH + 60} height={HEIGHT}></canvas>
        </div>
        <div class="info">
          <p>Samples: {samples.length}</p>
          <p>Current energy: {calculateEnergy(angle, velocity).toFixed(2)}</p>
          <div class="button-group">
            {#if samples.length > 0}
              <button on:click={() => { samples = []; updateGP(); }}>Clear Samples</button>
            {/if}
          </div>
          <div class="energy-function">
            <h3>About the Visualization:</h3>
            <p>{showEnergyFunction ? 'Showing actual energy function' : 'Showing Gaussian Process prediction'}</p>
            <p>The energy function represents different stable states of the system. Darker blue regions indicate lower energy (more stable states).</p>
            <p>Click "Add Sample" at different points to build a GP model that learns this energy landscape.</p>
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
    
    .contour-container {
      overflow: hidden;
      position: relative;
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
    
    pre {
      background-color: #f1f1f1;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
      line-height: 1.4;
    }
  </style>
  