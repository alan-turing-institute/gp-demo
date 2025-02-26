<script>
    import { onMount } from 'svelte';
    
    // Parameters controlled by sliders
    let angle = 45; // Initial angle in degrees
    let speed = 5;  // Initial speed
    
    // Canvas dimensions
    let width = 400;
    let height = 300;
    let canvas;
    let ctx;
    
    // Game objects
    let rocket = {
      x: 50,
      y: height - 50,
      size: 20
    };
    
    let target = {
      x: width - 50,
      y: 50,
      radius: 15,
      angle: 0,        // Current angle for circular motion
      speed: 0.02,     // Speed of rotation
      radius_orbit: 50 // Radius of circular path
    };
    
    // Animation control
    let animationId;
    let isRunning = false;
    
    onMount(() => {
      ctx = canvas.getContext('2d');
      draw();
    });
    
    function start() {
      if (!isRunning) {
        isRunning = true;
        animate();
      }
    }
    
    function reset() {
      rocket.x = width / 2;
      rocket.y = height - 20;
      target.angle = 0;
      isRunning = false;
      if (animationId) cancelAnimationFrame(animationId);
      draw();
    }
    
    function animate() {
      const radians = angle * Math.PI / 180;
      rocket.x += Math.cos(radians) * speed;
      rocket.y -= Math.sin(radians) * speed;
      
      // Update target position
      target.angle += target.speed;
      target.x = width - 100 + Math.cos(target.angle) * target.radius_orbit;
      target.y = 100 + Math.sin(target.angle) * target.radius_orbit;
      
      if (rocket.x > width || rocket.x < 0 || rocket.y > height || rocket.y < 0) {
        reset();
      }
      
      draw();
      if (isRunning) animationId = requestAnimationFrame(animate);
    }
    
    function draw() {
      ctx.clearRect(0, 0, width, height);
      
      // Draw Earth
      let gradient = ctx.createLinearGradient(0, height - 40, 0, height);
      gradient.addColorStop(0, '#4CAF50');  // Green surface
      gradient.addColorStop(1, '#2E7D32');  // Darker green
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.rect(0, height - 40, width, 40);
      ctx.fill();
      
      // Draw rocket
      ctx.save();
      ctx.translate(rocket.x, rocket.y);
      ctx.rotate(angle * Math.PI / 180);
      
      // Rocket body
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.moveTo(-rocket.size/2, rocket.size/2);
      ctx.lineTo(rocket.size/2, 0);
      ctx.lineTo(-rocket.size/2, -rocket.size/2);
      ctx.lineTo(-rocket.size/2, rocket.size/2);
      ctx.fill();
      
      // Rocket fins
      ctx.fillStyle = '#cc2222';
      ctx.beginPath();
      ctx.moveTo(-rocket.size/2, rocket.size/3);
      ctx.lineTo(-rocket.size, rocket.size/2);
      ctx.lineTo(-rocket.size/2, -rocket.size/3);
      ctx.fill();
      
      ctx.restore();
      
      // Draw target
      ctx.fillStyle = 'gray';
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
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