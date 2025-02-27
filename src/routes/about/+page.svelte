<script>
	// Disable SSR because we rely on browser APIs.
	export const ssr = false;
	import { onMount } from 'svelte';
	import * as math from 'mathjs';
  
	// -----------------------
	// CANVAS & DOMAIN SETTINGS
	// -----------------------
	const fullWidth = 500;
	const fullHeight = 500;
	// GP predictions are computed on a lower-resolution grid.
	const gridRes = 150;
  
	// Domain for our asteroid parameters:
	const minV = 1;
	const maxV = 3;
	const minTheta = Math.PI / 4;
	const maxTheta = (3 * Math.PI) / 4;
	const earthRadius = 1; // collision threshold
  
	// Margins for panels:
	// Asteroid field gets generous margins for labels.
	const marginAst = { left: 50, right: 10, top: 10, bottom: 50 };
	// For GP panels we reserve margins (for drawing the plot area inside)…
	const marginGP = { left: 30, right: 80, top: 10, bottom: 50 };
	// …and an additional inset so that axes are drawn completely outside the shaded area.
	const plotPadding = 10; 
  
	// -----------------------
	// UNDERLYING "TRUE" FUNCTION
	// -----------------------
	// Physically motivated flyby (periapsis) distance function.
	// Using orbital mechanics with μ=1 and R=10.
	function flybyDistance(v, theta) {
	  const mu = 1;
	  const R = 10;
	  const b = R * Math.abs(Math.sin(theta));
	  return (mu / (v * v)) * (Math.sqrt(1 + (b * b * v * v * v * v) / (mu * mu)) - 1);
	}
  
	// -----------------------
	// GAUSSIAN PROCESS FUNCTIONS
	// -----------------------
	function kernel(x1, x2, lengthScale = 0.5, variance = 1) {
	  const diff = math.subtract(x1, x2);
	  const sqDist = math.sum(math.dotMultiply(diff, diff));
	  return variance * Math.exp(-0.5 * sqDist / (lengthScale * lengthScale));
	}
  
	// GP training data: inputs [velocity, angle] and output periapsis.
	let trainingX = [];
	let trainingY = [];
  
	function gpPredictAt(xStar, K_inv, lengthScale = 0.5, variance = 1, noise = 1e-6) {
	  const n = trainingX.length;
	  let k = [];
	  for (let i = 0; i < n; i++) {
		k.push(kernel(trainingX[i], xStar, lengthScale, variance));
	  }
	  const kStar = kernel(xStar, xStar, lengthScale, variance);
	  const y_vec = math.reshape(trainingY, [n, 1]);
	  const predVec = math.flatten(math.multiply(K_inv, y_vec));
	  const mean = math.dot(k, predVec);
	  const k_matrix = math.matrix([k]);
	  const varPart = math.multiply(math.multiply(k_matrix, K_inv), math.transpose(k_matrix));
	  const variancePred = kStar - varPart._data[0][0];
	  return { mean, variance: variancePred };
	}
  
	// -----------------------
	// CANVAS REFERENCES
	// -----------------------
	let asteroidCanvas;
	let meanCanvas;
	let varianceCanvas;
	let meanColorBar;
	let varColorBar;
  
	// -----------------------
	// ASTEROID FIELD SETUP
	// -----------------------
	let asteroids = [];
	const numAsteroids = 50;
	function generateAsteroids() {
	  asteroids = [];
	  for (let i = 0; i < numAsteroids; i++) {
		const v = minV + Math.random() * (maxV - minV);
		const theta = minTheta + Math.random() * (maxTheta - minTheta);
		asteroids.push({ v, theta, sampled: false });
	  }
	}
  
	// -----------------------
	// COORDINATE TRANSFORMATION & AXES DRAWING
	// -----------------------
	// Transform a point from parameter space to canvas coordinates given margins.
	function transformPoint(x, y, xMin, xMax, yMin, yMax, canvasW, canvasH, margin) {
	  const plotW = canvasW - margin.left - margin.right;
	  const plotH = canvasH - margin.top - margin.bottom;
	  const canvasX = margin.left + ((x - xMin) / (xMax - xMin)) * plotW;
	  const canvasY = canvasH - margin.bottom - ((y - yMin) / (yMax - yMin)) * plotH;
	  return { x: canvasX, y: canvasY };
	}
  
	// Draw axes (grid lines, tick marks, labels, and axis titles) outside the plot area.
	function drawAxesOutside(ctx, plotRect, xMin, xMax, yMin, yMax, xAxisLabel, yAxisLabel) {
	  ctx.save();
	  const numXTicks = 7;
	  const numYTicks = 7;
	  const offset = 5; // gap from plot area
  
	  // Draw dashed grid lines inside the plot area.
	  ctx.strokeStyle = "#ddd";
	  ctx.lineWidth = 1;
	  ctx.setLineDash([4, 4]);
	  for (let i = 0; i < numXTicks; i++) {
		const t = i / (numXTicks - 1);
		const x = plotRect.left + t * plotRect.width;
		ctx.beginPath();
		ctx.moveTo(x, plotRect.top);
		ctx.lineTo(x, plotRect.top + plotRect.height);
		ctx.stroke();
	  }
	  for (let i = 0; i < numYTicks; i++) {
		const t = i / (numYTicks - 1);
		const y = plotRect.top + t * plotRect.height;
		ctx.beginPath();
		ctx.moveTo(plotRect.left, y);
		ctx.lineTo(plotRect.left + plotRect.width, y);
		ctx.stroke();
	  }
	  ctx.setLineDash([]);
  
	  // Draw thick axes outside the plot area.
	  ctx.strokeStyle = "#333";
	  ctx.lineWidth = 2;
	  // x-axis.
	  ctx.beginPath();
	  ctx.moveTo(plotRect.left, plotRect.top + plotRect.height + offset);
	  ctx.lineTo(plotRect.left + plotRect.width, plotRect.top + plotRect.height + offset);
	  ctx.stroke();
	  // y-axis.
	  ctx.beginPath();
	  ctx.moveTo(plotRect.left - offset, plotRect.top);
	  ctx.lineTo(plotRect.left - offset, plotRect.top + plotRect.height);
	  ctx.stroke();
  
	  // Draw tick marks and tick labels.
	  ctx.fillStyle = "#333";
	  ctx.font = "14px 'Roboto', sans-serif";
	  // x-axis ticks.
	  ctx.textAlign = "center";
	  ctx.textBaseline = "top";
	  for (let i = 0; i < numXTicks; i++) {
		const t = i / (numXTicks - 1);
		const x = plotRect.left + t * plotRect.width;
		const value = xMin + t * (xMax - xMin);
		ctx.beginPath();
		ctx.moveTo(x, plotRect.top + plotRect.height + offset);
		ctx.lineTo(x, plotRect.top + plotRect.height + offset + 8);
		ctx.stroke();
		ctx.fillText(value.toFixed(2), x, plotRect.top + plotRect.height + offset + 10);
	  }
	  // y-axis ticks.
	  ctx.textAlign = "right";
	  ctx.textBaseline = "middle";
	  for (let i = 0; i < numYTicks; i++) {
		const t = i / (numYTicks - 1);
		const y = plotRect.top + (1 - t) * plotRect.height;
		const value = yMin + t * (yMax - yMin);
		ctx.beginPath();
		ctx.moveTo(plotRect.left - offset, y);
		ctx.lineTo(plotRect.left - offset - 8, y);
		ctx.stroke();
		ctx.fillText(value.toFixed(2), plotRect.left - offset - 12, y);
	  }
  
	  // Draw axis titles.
	  ctx.fillStyle = "#333";
	  ctx.font = "16px 'Roboto', sans-serif";
	  // x-axis title.
	  const xLabelX = plotRect.left + plotRect.width / 2;
	  const xLabelY = plotRect.top + plotRect.height + offset + 30;
	  ctx.textAlign = "center";
	  ctx.fillText(xAxisLabel, xLabelX, xLabelY);
	  // y-axis title.
	  ctx.save();
	  ctx.translate(plotRect.left - offset - 40, plotRect.top + plotRect.height / 2);
	  ctx.rotate(-Math.PI / 2);
	  ctx.textAlign = "center";
	  ctx.fillText(yAxisLabel, 0, 0);
	  ctx.restore();
	  ctx.restore();
	}
  
	// Draw a vertical color bar with enhanced tick labeling.
	function drawColorBar(ctx, x, y, w, h, minVal, maxVal, colormap, label) {
	  const grad = ctx.createLinearGradient(0, y + h, 0, y);
	  for (let i = 0; i <= 1; i += 0.05) {
		const [r, g, b] = colormap(i);
		grad.addColorStop(i, `rgb(${r},${g},${b})`);
	  }
	  ctx.fillStyle = grad;
	  ctx.fillRect(x, y, w, h);
  
	  ctx.strokeStyle = "#333";
	  ctx.lineWidth = 1;
	  ctx.strokeRect(x, y, w, h);
  
	  ctx.fillStyle = "#333";
	  ctx.font = "14px 'Roboto', sans-serif";
	  ctx.textAlign = "left";
	  ctx.textBaseline = "middle";
	  const numTicks = 7;
	  for (let i = 0; i < numTicks; i++) {
		const t = i / (numTicks - 1);
		const value = minVal + t * (maxVal - minVal);
		const tickY = y + h - t * h;
		ctx.beginPath();
		ctx.moveTo(x + w, tickY);
		ctx.lineTo(x + w + 8, tickY);
		ctx.stroke();
		ctx.fillText(value.toFixed(1), x + w + 12, tickY);
	  }
	  ctx.textAlign = "center";
	  ctx.fillText(label, x + w / 2, y - 15);
	}
  
	// -----------------------
	// DRAWING FUNCTIONS
	// -----------------------
	// Draw the asteroid field panel.
	function drawAsteroidField() {
	  const ctx = asteroidCanvas.getContext('2d');
	  ctx.clearRect(0, 0, fullWidth, fullHeight);
	  ctx.fillStyle = 'white';
	  ctx.fillRect(0, 0, fullWidth, fullHeight);
  
	  asteroids.forEach(ast => {
		const { x, y } = transformPoint(ast.v, ast.theta, minV, maxV, minTheta, maxTheta, fullWidth, fullHeight, marginAst);
		ctx.beginPath();
		ctx.arc(x, y, 4, 0, 2 * Math.PI);
		ctx.fillStyle = ast.sampled ? '#e74c3c' : '#34495e';
		ctx.fill();
		ctx.font = "12px 'Roboto', sans-serif";
		ctx.fillStyle = '#2980b9';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'bottom';
		ctx.fillText(`v:${ast.v.toFixed(2)}, θ:${ast.theta.toFixed(2)}`, x + 6, y - 6);
	  });
	  drawAxesOutside(
		asteroidCanvas.getContext('2d'),
		{ left: marginAst.left, top: marginAst.top, width: fullWidth - marginAst.left - marginAst.right, height: fullHeight - marginAst.top - marginAst.bottom },
		minV, maxV, minTheta, maxTheta,
		"Velocity", "Angle (radians)"
	  );
	}
  
	// Update the GP panels (Mean and Variance).
	function updateGP() {
	  if (trainingX.length === 0) return;
	  const n = trainingX.length;
	  let K = math.zeros(n, n)._data;
	  for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) {
		  K[i][j] = kernel(trainingX[i], trainingX[j]);
		}
		K[i][i] += 1e-6;
	  }
	  let K_inv;
	  try {
		K_inv = math.inv(K);
	  } catch (e) {
		console.error("Matrix inversion error:", e);
		return;
	  }
  
	  // Define the "plot area" for GP panels.
	  const dataLeft = marginGP.left + plotPadding;
	  const dataTop = marginGP.top + plotPadding;
	  const dataWidth = fullWidth - marginGP.left - marginGP.right - 2 * plotPadding;
	  const dataHeight = fullHeight - marginGP.top - marginGP.bottom - 2 * plotPadding;
	  const plotRect = { left: dataLeft, top: dataTop, width: dataWidth, height: dataHeight };
  
	  // Offscreen canvases for GP predictions.
	  const offscreenMean = document.createElement('canvas');
	  offscreenMean.width = gridRes;
	  offscreenMean.height = gridRes;
	  const offMeanCtx = offscreenMean.getContext('2d');
	  const meanImgData = offMeanCtx.createImageData(gridRes, gridRes);
  
	  const offscreenVar = document.createElement('canvas');
	  offscreenVar.width = gridRes;
	  offscreenVar.height = gridRes;
	  const offVarCtx = offscreenVar.getContext('2d');
	  const varImgData = offVarCtx.createImageData(gridRes, gridRes);
  
	  const meanValues = new Array(gridRes * gridRes);
	  const varValues = new Array(gridRes * gridRes);
	  let maxVar = 0;
	  for (let i = 0; i < gridRes; i++) {
		for (let j = 0; j < gridRes; j++) {
		  const v = minV + (i / gridRes) * (maxV - minV);
		  const theta = minTheta + (j / gridRes) * (maxTheta - minTheta);
		  const { mean, variance } = gpPredictAt([v, theta], K_inv);
		  meanValues[j * gridRes + i] = mean;
		  varValues[j * gridRes + i] = variance;
		  if (variance > maxVar) maxVar = variance;
		}
	  }
  
	  // For the mean panel, adjust the colormap range to [0, 12].
	  function getMeanColor(val) {
		let clamped = Math.min(12, Math.max(0, val));
		let t = clamped / 12;
		const r = Math.round(255 * t);
		const g = 0;
		const b = Math.round(255 * (1 - t));
		return [r, g, b];
	  }
	  // For the variance panel, use grayscale.
	  function getVarColor(v, maxV) {
		let t = Math.min(1, v / maxV);
		let intensity = Math.round(255 * t);
		return [intensity, intensity, intensity];
	  }
  
	  for (let i = 0; i < gridRes; i++) {
		for (let j = 0; j < gridRes; j++) {
		  const index = j * gridRes + i;
		  const pixelIndex = index * 4;
		  const [rMean, gMean, bMean] = getMeanColor(meanValues[index]);
		  meanImgData.data[pixelIndex] = rMean;
		  meanImgData.data[pixelIndex + 1] = gMean;
		  meanImgData.data[pixelIndex + 2] = bMean;
		  meanImgData.data[pixelIndex + 3] = 255;
		  const [rVar, gVar, bVar] = getVarColor(varValues[index], maxVar);
		  varImgData.data[pixelIndex] = rVar;
		  varImgData.data[pixelIndex + 1] = gVar;
		  varImgData.data[pixelIndex + 2] = bVar;
		  varImgData.data[pixelIndex + 3] = 255;
		}
	  }
	  offMeanCtx.putImageData(meanImgData, 0, 0);
	  offVarCtx.putImageData(varImgData, 0, 0);
  
	  const meanCtx = meanCanvas.getContext('2d');
	  const varCtx = varianceCanvas.getContext('2d');
	  meanCtx.imageSmoothingEnabled = false;
	  varCtx.imageSmoothingEnabled = false;
	  meanCtx.clearRect(0, 0, fullWidth, fullHeight);
	  varCtx.clearRect(0, 0, fullWidth, fullHeight);
	  meanCtx.drawImage(offscreenMean, 0, 0, gridRes, gridRes, plotRect.left, plotRect.top, plotRect.width, plotRect.height);
	  varCtx.drawImage(offscreenVar, 0, 0, gridRes, gridRes, plotRect.left, plotRect.top, plotRect.width, plotRect.height);
  
	  // Overlay training points on the GP panels.
	  meanCtx.fillStyle = '#2c3e50';
	  varCtx.fillStyle = '#2c3e50';
	  trainingX.forEach(pt => {
		const { x: ix, y: iy } = transformPoint(pt[0], pt[1], minV, maxV, minTheta, maxTheta, fullWidth, fullHeight, marginGP);
		meanCtx.beginPath();
		meanCtx.arc(ix, iy, 4, 0, 2 * Math.PI);
		meanCtx.fill();
		varCtx.beginPath();
		varCtx.arc(ix, iy, 4, 0, 2 * Math.PI);
		varCtx.fill();
	  });
  
	  drawAxesOutside(meanCtx, plotRect, minV, maxV, minTheta, maxTheta, "Velocity", "Angle (radians)");
	  drawAxesOutside(varCtx, plotRect, minV, maxV, minTheta, maxTheta, "Velocity", "Angle (radians)");
  
	  // Draw color bars.
	  const cbWidth = 40, cbHeight = fullHeight - marginGP.top - marginGP.bottom;
	  const meanCBCtx = meanColorBar.getContext('2d');
	  meanCBCtx.clearRect(0, 0, meanColorBar.width, meanColorBar.height);
	  drawColorBar(meanCBCtx, 0, marginGP.top, cbWidth, cbHeight, 0, 12,
		t => {
		  const r = Math.round(255 * t);
		  const g = 0;
		  const b = Math.round(255 * (1 - t));
		  return [r, g, b];
		},
		"Periapsis"
	  );
	  const varCBCtx = varColorBar.getContext('2d');
	  varCBCtx.clearRect(0, 0, varColorBar.width, varColorBar.height);
	  drawColorBar(varCBCtx, 0, marginGP.top, cbWidth, cbHeight, 0, maxVar,
		t => {
		  const intensity = Math.round(255 * t);
		  return [intensity, intensity, intensity];
		},
		"Variance"
	  );
	}
  
	// -----------------------
	// EVENT HANDLING
	// -----------------------
	function handleAsteroidClick(event) {
	  const rect = asteroidCanvas.getBoundingClientRect();
	  const clickX = event.clientX - rect.left;
	  const clickY = event.clientY - rect.top;
	  const threshold = 10;
	  let selected = null;
	  for (let ast of asteroids) {
		const { x, y } = transformPoint(ast.v, ast.theta, minV, maxV, minTheta, maxTheta, fullWidth, fullHeight, marginAst);
		const dx = clickX - x;
		const dy = clickY - y;
		if (Math.sqrt(dx * dx + dy * dy) < threshold) {
		  selected = ast;
		  break;
		}
	  }
	  if (selected && !selected.sampled) {
		selected.sampled = true;
		const v = selected.v;
		const theta = selected.theta;
		const periapsis = flybyDistance(v, theta);
		trainingX = [...trainingX, [v, theta]];
		trainingY = [...trainingY, periapsis];
		updateGP();
		drawAsteroidField();
	  }
	}
  
	// -----------------------
	// INITIALIZATION
	// -----------------------
	onMount(() => {
	  generateAsteroids();
	  drawAsteroidField();
	});
  </script>
  
  <style>
	@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
  
	* {
	  box-sizing: border-box;
	}
  
	body {
	  margin: 0;
	  padding: 0;
	  background-color: #f7f9fc;
	  font-family: 'Roboto', sans-serif;
	  color: #333;
	}
  
	.page-title {
	  text-align: center;
	  font-size: 32px;
	  margin: 30px 0;
	  font-weight: 500;
	}
  
	.container {
	  display: flex;
	  flex-wrap: wrap;
	  gap: 30px;
	  justify-content: center;
	  padding: 0 20px 40px;
	}
  
	.panel {
	  background: #fff;
	  border-radius: 8px;
	  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
	  padding: 20px;
	  display: flex;
	  flex-direction: column;
	  align-items: center;
	}
  
	.panel-title {
	  font-size: 20px;
	  margin-bottom: 15px;
	  font-weight: 500;
	}
  
	.canvas-container {
	  display: flex;
	  align-items: center;
	}
  
	canvas {
	  border-radius: 4px;
	  background-color: #fff;
	}
  
	.gp-canvas {
	  width: 500px;
	  height: 500px;
	}
  
	.color-bar {
	  width: 40px;
	  height: 500px;
	  margin-left: 15px;
	  border-radius: 4px;
	}
  </style>
  
  <div class="page-title">
	Asteroid Flyby Prediction with Gaussian Processes
  </div>
  
  <div class="container">
	<!-- Asteroid Field Panel -->
	<div class="panel">
	  <div class="panel-title">Asteroid Field (Click an asteroid)</div>
	  <canvas bind:this={asteroidCanvas} width={fullWidth} height={fullHeight} on:click={handleAsteroidClick}></canvas>
	</div>
  
	<!-- GP Predicted Periapsis (Mean) Panel -->
	<div class="panel">
	  <div class="panel-title">GP Predicted Periapsis (Mean)</div>
	  <div class="canvas-container">
		<canvas bind:this={meanCanvas} class="gp-canvas" width={fullWidth} height={fullHeight}></canvas>
		<canvas bind:this={meanColorBar} class="color-bar" width="40" height={fullHeight}></canvas>
	  </div>
	</div>
  
	<!-- GP Predictive Variance Panel -->
	<div class="panel">
	  <div class="panel-title">GP Predictive Variance</div>
	  <div class="canvas-container">
		<canvas bind:this={varianceCanvas} class="gp-canvas" width={fullWidth} height={fullHeight}></canvas>
		<canvas bind:this={varColorBar} class="color-bar" width="40" height={fullHeight}></canvas>
	  </div>
	</div>
  </div>
  