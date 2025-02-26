<script lang="ts">
    import { onMount } from 'svelte';
    import { Physics } from './Physics';
    
    // Parameters controlled by sliders
    let angle = 360; // Changed to 90 degrees to point straight up initially
    let speed = 100;  // Initial speed
    
    // Canvas dimensions
    let width = 400;
    let height = 300;
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    
    // Physics engine
    let physics: Physics;
    
    // Animation control
    let animationId: number;
    let isRunning = false;
    
    onMount(() => {
      ctx = canvas.getContext('2d')!;
      physics = new Physics(width, height);
      draw();
    });
    
    function start() {
      if (!isRunning) {
        isRunning = true;
        animate();
      }
    }
    
    function reset() {
      physics.reset();
      isRunning = false;
      if (animationId) cancelAnimationFrame(animationId);
      draw();
    }
    
    function animate() {
      if (physics.update(angle, speed)) {
        reset();
      }
      
      draw();
      if (isRunning) animationId = requestAnimationFrame(animate);
    }
    
    function draw() {
      ctx.clearRect(0, 0, width, height);
      
      // Draw Earth
      let gradient = ctx.createLinearGradient(0, height - 40, 0, height);
      gradient.addColorStop(0, '#4CAF50');
      gradient.addColorStop(1, '#2E7D32');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.rect(0, height - 40, width, 40);
      ctx.fill();
      
      // Draw rocket
      ctx.save();
      ctx.translate(physics.rocket.x, physics.rocket.y);
      
      // Calculate flight angle from velocity
      let flightAngle = isRunning ? angle : 90; // Always start at 90 degrees when not running
      
      if (isRunning) {
        const vx = physics.rocket.vx;
        const vy = physics.rocket.vy;
        
        // Only calculate angle if we have meaningful velocity
        if (Math.abs(vx) > 0.001 || Math.abs(vy) > 0.001) {
          flightAngle = Math.atan2(vy, vx) * 180 / Math.PI;
        }
      }
      
      // Rotate the context according to the flight angle
      ctx.rotate(flightAngle * Math.PI / 180);
      
      const rocketSize = physics.rocket.size;
      const rocketLength = rocketSize * 2.5;
      
      // Rocket body - reposition so tip aligns with direction of travel
      ctx.fillStyle = '#f5f5f5'; // White/silver rocket body
      ctx.beginPath();
      ctx.rect(-rocketLength, -rocketSize/3, rocketLength * 0.75, rocketSize * 2/3);
      ctx.fill();
      
      // Nose cone - pointing in direction of travel (right)
      ctx.fillStyle = '#ff4444'; // Red nose cone
      ctx.beginPath();
      ctx.moveTo(0, 0); // Tip at origin, pointing right (direction of rotation)
      ctx.lineTo(-rocketSize/2, -rocketSize/3);
      ctx.lineTo(-rocketSize/2, rocketSize/3);
      ctx.closePath();
      ctx.fill();
      
      // Rocket fins
      ctx.fillStyle = '#cc2222'; // Darker red fins
      
      // Top fin
      ctx.beginPath();
      ctx.moveTo(-rocketLength, -rocketSize/3);
      ctx.lineTo(-rocketLength - rocketSize/2, -rocketSize/2);
      ctx.lineTo(-rocketLength + rocketSize/2, -rocketSize/3);
      ctx.closePath();
      ctx.fill();
      
      // Bottom fin
      ctx.beginPath();
      ctx.moveTo(-rocketLength, rocketSize/3);
      ctx.lineTo(-rocketLength - rocketSize/2, rocketSize/2);
      ctx.lineTo(-rocketLength + rocketSize/2, rocketSize/3);
      ctx.closePath();
      ctx.fill();
      
      // Windows
      ctx.fillStyle = '#a0d8ef'; // Light blue windows
      ctx.beginPath();
      ctx.arc(-rocketLength/2, 0, rocketSize/6, 0, Math.PI * 2);
      ctx.fill();
      
      // Rocket engine
      ctx.fillStyle = '#666666'; // Dark gray engine
      ctx.beginPath();
      ctx.rect(-rocketLength - rocketSize/4, -rocketSize/4, rocketSize/4, rocketSize/2);
      ctx.fill();
      
      // Rocket exhaust (when moving)
      if (isRunning) {
        // Create flame gradient
        const exhaustGradient = ctx.createLinearGradient(
          -rocketLength - rocketSize/4 - rocketSize, 0,
          -rocketLength - rocketSize/4, 0
        );
        exhaustGradient.addColorStop(0, 'rgba(255, 165, 0, 0)');
        exhaustGradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.5)');
        exhaustGradient.addColorStop(1, 'rgba(255, 69, 0, 0.8)');
        
        ctx.fillStyle = exhaustGradient;
        ctx.beginPath();
        ctx.moveTo(-rocketLength - rocketSize/4, -rocketSize/4);
        ctx.lineTo(-rocketLength - rocketSize/4 - rocketSize, 0);
        ctx.lineTo(-rocketLength - rocketSize/4, rocketSize/4);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();
      
      // Draw target
      ctx.fillStyle = 'gray';
      ctx.beginPath();
      ctx.arc(physics.target.x, physics.target.y, physics.target.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  </script>
  
  <div class="container">
    <div class="controls">
      <label>
        Angle: {angle}°
        <input type="range" min="0" max="90" bind:value={angle} disabled={isRunning}>
      </label>
      
      <label>
        Speed: {speed}
        <input type="range" min="500" max="1000" step="5" bind:value={speed} disabled={isRunning}>
      </label>
      
      <button on:click={start} disabled={isRunning}>Launch</button>
      <button on:click={reset}>Reset</button>
    </div>
    
    <canvas bind:this={canvas} {width} {height}></canvas>
  </div>
  
  <style>
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    
    .controls {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    
    canvas {
      border: 1px solid #ccc;
    }
    
    button {
      padding: 0.5rem 1rem;
    }
  </style>