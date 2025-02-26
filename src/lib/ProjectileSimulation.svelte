<script lang="ts">
    import { onMount } from 'svelte';
    import { Physics } from './Physics';
    
    // Parameters controlled by sliders
    let angle = 45; // Initial angle in degrees
    let speed = 5;  // Initial speed
    
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
      ctx.rotate(angle * Math.PI / 180);
      
      // Rocket body
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.moveTo(-physics.rocket.size/2, physics.rocket.size/2);
      ctx.lineTo(physics.rocket.size/2, 0);
      ctx.lineTo(-physics.rocket.size/2, -physics.rocket.size/2);
      ctx.lineTo(-physics.rocket.size/2, physics.rocket.size/2);
      ctx.fill();
      
      // Rocket fins
      ctx.fillStyle = '#cc2222';
      ctx.beginPath();
      ctx.moveTo(-physics.rocket.size/2, physics.rocket.size/3);
      ctx.lineTo(-physics.rocket.size, physics.rocket.size/2);
      ctx.lineTo(-physics.rocket.size/2, -physics.rocket.size/3);
      ctx.fill();
      
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
        <input type="range" min="1" max="10" step="0.5" bind:value={speed} disabled={isRunning}>
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