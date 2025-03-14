<script>
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import * as math from 'mathjs';

  function goToHomePage() {
    window.location.href = 'https://alan-turing-institute.github.io/gp-demo/'; // Adjust this URL if your home page is at a different path
  }

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
  let lives = 20; // Add lives state
  let gameEnded = false; // Track if the game has ended

  // Constants for the flyby function
  const mu = 398600.4418; // km^3/s^2
  const R_e = 6371;       // km


  // Save state to localStorage
  function saveState() {
    localStorage.setItem('asteroidExplorerState', JSON.stringify({
      samples,
      gpPredictions,
      lives,
      score,
      gameEnded,
      showEnergyFunction,
      phi,
      psi
    }));
  }
    // Load state from localStorage
    function loadState() {
      const savedState = localStorage.getItem('asteroidExplorerState');
      if (savedState) {
        const state = JSON.parse(savedState);
        samples = state.samples;
        gpPredictions = state.gpPredictions;
        lives = state.lives;
        score = state.score;
        gameEnded = state.gameEnded;
        showEnergyFunction = state.showEnergyFunction;
        phi = state.phi;
        psi = state.psi;
      }
    }
    // Add screen orientation detection
    let isVertical = false;
    
    function checkOrientation() {
      // Check if the screen is vertical (height > width)
      isVertical = window.innerHeight > window.innerWidth;
    }
    onMount(() => {
    calculateEnergyRange();
    drawAstroid();
    setTimeout(() => {
      drawContourPlot();
    }, 100);
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
    };
  });

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

  function scoreR2(b, gridVelocity) {
    const energy = calculateEnergy(b, gridVelocity);
    const score = 1 - (energy - energyMin) / (energyMax - energyMin);
    return Math.max(0, score);
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
    lives=20;
    score=0;
  }

  function handleContourClick(event) {
    if (isLoading || lives <= 0) return; // Prevent clicks when out of lives

    const rect = contourCanvas.getBoundingClientRect();

    // Adjust click coordinates to account for canvas position
    const scaleX = contourCanvas.width / rect.width; // Scale for canvas width
    const scaleY = contourCanvas.height / rect.height; // Scale for canvas height
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    if (x >= MARGIN && x <= WIDTH - MARGIN && y >= MARGIN && y <= HEIGHT - MARGIN) {
      const clickedB = xScale.invert(x);
      const clickedVelocity = yScale.invert(y);
      angle = clickedB;
      velocity = clickedVelocity;
      const energy = calculateEnergy(angle, velocity);
      samples = [...samples, { angle, velocity, energy }];

      // Deduct one life
      lives -= 1;
      
      // Check if lives reached 0
      if (lives === 0) {
        gameEnded = true; // Trigger game end
      }

      updateGP();
      drawAstroid();
    }
  }

  function resetGame() {
    lives = 20;
    score = 0;
    samples = [];
    gpPredictions = [];
    gameEnded = false;
    drawContourPlot();
  }
  $: score = 0.0;
  function calculateR2(actual, predicted) {
    if (actual.length !== predicted.length || actual.length === 0) {
        throw new Error("Arrays must be of the same length and non-empty");
    }
    const meanActual = actual.reduce((sum, val) => sum + val, 0) / actual.length;
    const sst = actual.reduce((sum, val) => sum + Math.pow(val - meanActual, 2), 0);
    const ssr = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
    const r2 = 1 - ssr / sst;
    // Make score positive
    return Math.max(0, r2);
  }

  // GP regression using an RBF kernel
  function updateGP() {
    isLoading = true;
    let groundTruth = [];
    let predicted = [];

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

            predicted.push(mean);
            groundTruth.push(calculateEnergy(gridB, gridVelocity));

          } catch (e) {
            console.error("Error in GP calculation:", e);
          }
        }
      }
      drawContourPlot();
      score = calculateR2(groundTruth, predicted);
      isLoading = false;
    }, 50);
  }

  // Draw the energy landscape with improved axis labels and colorbar
  function drawContourPlot() {
    if (!contourCanvas) return;
    const ctx = contourCanvas.getContext('2d');
    // ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.clearRect(0, 0, contourCanvas.width, contourCanvas.height);
    const colorScale = d3.scaleSequential(d3.interpolateViridis)
                      .domain([energyMax, energyMin])
                      .interpolator(d3.interpolateViridis);
    if (showEnergyFunction) {
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
    } else if (gpPredictions.length === 0){
      const gridSize = 80;
      const cellSize = PLOT_SIZE / gridSize;
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const bVal = 5000 + ((5 * R_e - 5000) * i) / gridSize;
          const velocityVal = 3 + ((20 - 3) * j) / gridSize;
          const x = xScale(bVal);
          const y = yScale(velocityVal);
          ctx.fillStyle = colorScale(0);
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
    ctx.fillText("Impact parameter (km)", WIDTH / 2, HEIGHT - MARGIN + 20);
    
    // Y-axis labels (velocity)
    ctx.textAlign = "right";
    ctx.fillText("3", MARGIN - 10, HEIGHT - MARGIN);
    ctx.fillText("20", MARGIN - 10, MARGIN);
    ctx.save();
    ctx.translate(MARGIN - 15, HEIGHT / 2 - 25);
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
    // ctx.lineTo(barX + barWidth, midY);
    ctx.stroke();
    // ctx.fillText(((energyMin + energyMax) / 2).toFixed(1), barX + barWidth + offset, midY + 5);
    
    // Rotated label for the colorbar remains on the left side of the bar.
    ctx.save();
    ctx.translate(barX - 25, barY + barHeight / 2);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("Flyby Distance (km)", 0, -60);
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

    // Label the asteroid with a small text.
    ctx.fillStyle = COLORS.text;
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Asteroid", xPos, yPos + asteroidRadius + 15);


    
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
    ctx.fillText("velocity", velMidX + 25, velMidY - 10);
    
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
    ctx.fillText("Earth", earthX, earthY + earthRadius + 15);
    
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

  <h1 style="display: inline-flex; align-items: center; font-size: 3rem;">
    <img src="https://raw.githubusercontent.com/alan-turing-institute/gp-demo/refs/heads/main/static/asteroid.png" alt="Asteroid Explorer Icon" style="width: 80px; height: 80px; margin-right: 15px; border-radius: 0; box-shadow: none;" />
    Asteroid Explorer
  </h1>



    <div class="instruction">
      <p> Calculating the trajectory of celestial bodies like asteroids or comets approaching Earth is costly and time-consuming due to gravitational interactions, relativistic effects, and observational uncertainties. Training an emulator offers a cheaper and sufficiently accurate alternative. </p>
      <p>💻 Lets train an emulator that can predict if an asteroid will coloide with the Earth.</p>
      <p>💷 You have a budget to run 20 simulations to train your emulator.</p>
      <p>📐 Adjust the velocity and the impact parameter to explore the Flyby distance map.</p>
    </div>
  
  <!-- Container for Lives and Score Bars -->
  <div class="bars-container">
    <!-- Live Bar -->
    <div class="live-bar-container">
        <div class="lives-label">Budget left {lives}/20</div>
        <div class="live-bar">
            <div class="lives-remaining" style="width: {Math.max(0, (lives / 20) * 100)}%"></div>
            <span class="heart" style="left: {Math.max(0, (lives / 20) * 100)}%">💷</span>
        </div>
    </div>
    <div></div>
    <!-- Score Bar -->
    <div class="score-bar-container">
        <div class="score-label">Score: <span id="score-percentage">{(score * 100).toFixed(0)}%</span></div>
        <div class="score-bar">
            <div class="score-value" id="score-bar" style="width: {score * 100}%"></div>
            <span class="star" id="score-star" style="left: {score * 100}%">⭐</span>
        </div>
    </div>
  </div>

  <!-- Game Ended Popup -->
  {#if gameEnded}
    <div class="game-ended-popup">
      <div class="popup-content">
        <h2>Game Ended</h2>
        <p>You have used all your budget!</p>
        <p>Final score: {(score * 100).toFixed(0)}%</p>
        <button on:click={resetGame}>Play Again</button>
      </div>
    </div>
  {/if}


    <!-- Responsive Grid Layout -->
    <div class="responsive-grid {isVertical ? 'vertical' : 'horizontal'}">
      <!-- For horizontal screens, maintain original layout -->
      {#if !isVertical}
      <div class="panel">
        <h2>Asteroid Visualization</h2>
        <canvas bind:this={canvas} width={WIDTH} height={HEIGHT}></canvas>
      </div>

      <div class="panel">
        <h2>Flyby distance past Earth</h2>
        <div class="contour-container">
          <canvas 
            bind:this={contourCanvas} 
            width={WIDTH + 60} 
            height={HEIGHT}
            on:click={handleContourClick}
            class={isLoading ? 'loading' : ''}
          ></canvas>
        </div>

          <div class="button-group">
            {#if samples.length > 0}
              <button on:click={clearSamples}>Clear Samples</button>
            {/if}
            <button on:click={toggleEnergyFunction} class="info-button">
              {showEnergyFunction ? 'Show Emulator Prediction' : 'Show Simulator Function'}
            </button>
          </div>

          <div class="side_instruction">
            <p>Click directly on the plot</p>
            <div class="arrow-down"></div> <!-- Downward arrow -->
            <p>Sample points with velocity and impact factor </p>
            <div class="arrow-down"></div> <!-- Downward arrow -->
            <p>Run the simulation</p>
            <div class="arrow-down"></div> <!-- Downward arrow -->
            <p>Update the emulator model</p>
          </div>
        </div>
      {:else}
        <!-- For vertical screens, use the 2x2 grid layout -->
          <!-- A_11: Energy Plot -->
          <div class="grid-item energy-plot">
            <h2>Flyby distance past Earth</h2>
            <div class="contour-container">
              <canvas 
                bind:this={contourCanvas} 
                width={WIDTH + 60} 
                height={HEIGHT} 
                on:click={handleContourClick}
                class={isLoading ? 'loading' : ''}
              ></canvas>
            </div>
          </div>

      <!-- A_12: Buttons (Show Energy Button and Clear Samples) -->
      <div class="grid-item buttons">
        <!-- Move the instructional text here -->
        <div class="side_instruction">
          <p>Click directly on the plot</p>
          <div class="arrow-down"></div> <!-- Downward arrow -->
          <p>Sample points with velocity and impact factor </p>
          <div class="arrow-down"></div> <!-- Downward arrow -->
          <p>Run the simulation</p>
          <div class="arrow-down"></div> <!-- Downward arrow -->
          <p>Update the emulator model</p>
        </div>
        <!-- Buttons -->
        <div class="vertical-button-group">
          {#if samples.length > 0}
            <button on:click={clearSamples}>Clear Samples</button>
          {/if}
          <button on:click={toggleEnergyFunction} class="info-button">
            {showEnergyFunction ? 'Show Emulator Prediction' : 'Show Simulator Function'}
          </button>
        </div>
      </div>

      <!-- A_21: Asteroid Panel -->
      <div class="grid-item molecule-panel">
        <h2>Asteroid Visualization</h2>
        <canvas bind:this={canvas} width={WIDTH} height={HEIGHT}></canvas>
      </div>

      <!-- A_22: Asteroid instructions -->
      <!-- <div class="grid-item angle-sliders">
        <div class="vertical-control-panel">
          <div class="compact-slider-container">

        </div>
      </div> -->
    <!-- </div> -->

      {/if}
  </div>

    <!-- Go back button moved here -->
    <div class="button-group" style="margin-top: 20px; text-align: center;">
      <button class="info-button" on:click={goToHomePage}>
        <span>Go back</span>
      </button>
    </div>

</main>

<style>
/* Responsive Grid Layout */
.responsive-grid {
    display: grid;
    gap: 20px;
    margin-top: 20px;
  }
  
  /* Horizontal layout (default) */
  .responsive-grid.horizontal {
    grid-template-columns: 1fr 1fr;
  }
  
  /* Vertical layout - 2x2 grid */
  .responsive-grid.vertical {
    grid-template-columns: 2fr 1fr;
    grid-template-rows: auto auto;
    grid-template-areas: 
      "energy-plot buttons"
      "molecule-panel angle-sliders";
  }
  
  /* Grid items */
  .grid-item {
    background: #ffffff;
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    border: 1px solid #e8e8e8;
  }
  
  /* Specific grid item styles for vertical layout */
  .responsive-grid.vertical .energy-plot {
    grid-area: energy-plot;
  }
  
  .responsive-grid.vertical .buttons {
    grid-area: buttons;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .responsive-grid.vertical .molecule-panel {
    grid-area: molecule-panel;
  }
  
  .responsive-grid.vertical .angle-sliders {
    grid-area: angle-sliders;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  /* Vertical orientation styles */
  .vertical-button-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    justify-content: center;
  }
  
  .vertical-button-group button {
    width: 100%;
    margin: 0;
  }
  
  .vertical-control-panel {
    display: flex;
    flex-direction: column;
    gap: 15px;
    height: 100%;
    justify-content: center;
    background-color: #f5f5f5;
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .compact-slider-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  
  .compact-slider-container label {
    font-weight: bold;
    font-size: 12px;
    margin-bottom: 2px;
  }
  
  .compact-slider-container input {
    width: 100%;
    max-width: 120px;
  }
  
  .compact-slider-container span {
    font-weight: bold;
    text-align: center;
  }
  
  /* Responsive adjustments for small screens */
  @media (max-width: 768px) {
    .responsive-grid.vertical {
      grid-template-columns: 1fr;
      grid-template-areas: 
        "energy-plot"
        "buttons"
        "molecule-panel"
        "angle-sliders";
    }
    
    .compact-slider-container input {
      max-width: 100%;
    }
  }
  
  /* Maintain proper sizing for visualizations */
  .responsive-grid.vertical .molecule-visualization {
    width: 100% !important;
    height: auto !important;
    aspect-ratio: 1 / 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .responsive-grid.vertical .contour-container canvas {
    width: 100% !important;
    height: auto !important;
  }
  
  /* Maintain aspect ratio for visualizations */
  .molecule-visualization {
    max-width: 100%;
    height: auto !important;
    aspect-ratio: 1 / 1;
  }
  
  .contour-container canvas {
    max-width: 100%;
    height: auto !important;
  }
  
  /* Bars Container */
  .bars-container {
      display: flex;
      justify-content: space-between;
      gap: 20px; /* Adjust the gap between the bars as needed */
      margin: 20px 0;
  }

  /* Live Bar Container */
  .live-bar-container {
      flex: 1; /* Allow the live bar to take up available space */
  }

  /* Score Bar Container */
  .score-bar-container {
      flex: 1; /* Allow the score bar to take up available space */
  }

  /* Existing styles for live-bar, score-bar, etc. */
  .live-bar, .score-bar {
      position: relative;
      height: 30px;
      background: #eee;
      border-radius: 15px;
      overflow: visible;
      box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1);
  }

  .lives-remaining, .score-value {
      height: 100%;
      transition: width 0.3s ease;
      border-radius: 15px 0 0 15px;
  }

  .lives-remaining {
      background:rgb(23, 181, 23);
  }

  .score-value {
      background: #FFD700;
  }

  .heart, .star {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      font-size: 24px;
      transition: left 0.3s ease;
  }

  .heart {
      color: green;
      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
  }

  .star {
      color: #FFD700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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

  .instruction {
  text-align: left; /* Align text to the left */
  margin: 0 auto;   /* Remove auto margin if it was centering the container */
  max-width: 100%;  /* Ensure the container doesn't exceed its parent's width */
  padding: 10px;    /* Optional: Add padding for better spacing */
}

.instruction p {
  margin: 10px 0;   /* Add spacing between paragraphs */
}

  /* Additional styling for the instructional text */
  .side_instruction p {
    text-align: center; /* Center-align the text */
    margin: 10px 0; /* Add spacing around the text */
  }
 /* Style for the downward arrow */
 .arrow-down {
    width: 0; 
    height: 0; 
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid black; /* Arrow color */
    margin: 10px auto; /* Center the arrow and add spacing */
  }
  h1 img {
  vertical-align: middle;
  width: 40px;
  height: 40px;
  margin-right: 10px;
  border-radius: 50%; /* Optional: Makes the image circular */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Optional: Adds a subtle shadow */
}
</style>
