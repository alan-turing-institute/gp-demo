<script>
    import { onMount, createEventDispatcher } from 'svelte';
    
    // Props with runes syntax
    let { asteroids = [], squareSize = 800 } = $props();
  
    // State variables with $state rune
    let selectedAsteroidId = $state(null);
    
    // Reactive value with $derived rune
    let selectedAsteroid = $derived(selectedAsteroidId !== null 
        ? asteroids.find(a => a.id === selectedAsteroidId) 
        : null);
    
    // Initialize asteroids if empty
    $effect(() => {
      if (asteroids.length === 0) {
        asteroids = generateSampleAsteroids(15);
      }
    });
    
    const dispatch = createEventDispatcher();
  
    // Handle asteroid selection
    function selectAsteroid(id) {
      selectedAsteroidId = id;
      const asteroid = asteroids.find(a => a.id === id);
      
      // Dispatch the selected asteroid data
      dispatch('select', asteroid);
    }
  
    // Generate random asteroid data
    function generateSampleAsteroids(count) {
      const result = [];
      const center = squareSize / 2;
      
      for (let i = 0; i < count; i++) {
        // Random position (exclude center area for Earth)
        let x, y, distanceFromCenter;
        
        do {
          x = Math.random() * (squareSize - 100) + 50;
          y = Math.random() * (squareSize - 100) + 50;
          distanceFromCenter = Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - center, 2));
        } while (distanceFromCenter < 50); // Keep away from Earth
        
        // Calculate angle from center
        const angle = Math.atan2(y - center, x - center) * (180 / Math.PI);
        
        // Generate asteroid data
        result.push({
          id: i,
          x,
          y,
          velocity: Math.random() * 50 + 10, // 10-60 km/s
          angle, // Angle from Earth
          distance: distanceFromCenter * 10, // Scaled distance in km
          hitsEarth: Math.random() > 0.7, // 30% chance of hitting Earth
          size: Math.random() * 25 + 15, // 15-40 size units
          features: Math.floor(Math.random() * 5), // 0-4 unique features
          type: Math.floor(Math.random() * 3) // 0-2 asteroid types
        });
      }
      
      return result;
    }
  
    // Generate asteroid path based on properties
    function getAsteroidPath(asteroid) {
      const points = [];
      const numPoints = 10 + asteroid.features;
      
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        const jitter = asteroid.size * (0.8 + Math.random() * 0.4);
        const x = Math.cos(angle) * jitter;
        const y = Math.sin(angle) * jitter;
        points.push(`${x},${y}`);
      }
      
      return 'M' + points.join('L') + 'Z';
    }
    
    // Generate smaller features on the asteroid
    function getAsteroidFeatures(asteroid) {
      const features = [];
      const featureCount = asteroid.features;
      
      for (let i = 0; i < featureCount; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * (asteroid.size * 0.5);
        const size = asteroid.size * (0.1 + Math.random() * 0.15);
        
        features.push({
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          r: size
        });
      }
      
      return features;
    }
    
    // Determine asteroid base color based on type
    function getAsteroidBaseColor(asteroid) {
      const colors = [
        { base: "#8B7D6B", dark: "#6B5D4B" }, // Brown/rocky
        { base: "#A0A0A0", dark: "#707070" }, // Gray/metallic
        { base: "#B08C60", dark: "#907050" }  // Tan/dusty
      ];
      
      return colors[asteroid.type];
    }
  </script>
  
  <div class="asteroid-field" style="width: {squareSize}px; height: {squareSize}px;">
    <svg viewBox="0 0 {squareSize} {squareSize}">
      <!-- Background stars -->
      {#each Array(100) as _, i}
        <circle 
          cx={Math.random() * squareSize} 
          cy={Math.random() * squareSize} 
          r={Math.random() * 1.5} 
          fill="white" 
          opacity={Math.random() * 0.8 + 0.2}
        />
      {/each}
      
      <!-- Earth at center -->
      <g class="earth" transform="translate({squareSize/2}, {squareSize/2})">
        <circle r="30" fill="#1a66ff" />
        <!-- Continental patterns -->
        <path d="M-15,-5 Q0,10 15,-5 M-20,5 Q-5,15 10,8 M5,-15 Q15,-5 10,10" 
              fill="none" stroke="#5c9e31" stroke-width="3" />
        <circle r="30" fill="none" stroke="#fff" stroke-width="1" opacity="0.4" />
        <circle r="35" fill="none" stroke="rgba(100,200,255,0.4)" stroke-width="5" />
      </g>
      
      <!-- Asteroids -->
      {#each asteroids as asteroid (asteroid.id)}
        {@const baseColor = getAsteroidBaseColor(asteroid)}
        <g 
          class="asteroid"
          class:selected={selectedAsteroidId === asteroid.id}
          class:hits={selectedAsteroidId === asteroid.id && asteroid.hitsEarth}
          class:misses={selectedAsteroidId === asteroid.id && !asteroid.hitsEarth}
          transform="translate({asteroid.x}, {asteroid.y})"
          on:click={() => selectAsteroid(asteroid.id)}
        >
          <!-- Main asteroid body -->
          <path 
            d={getAsteroidPath(asteroid)}
            fill={selectedAsteroidId === asteroid.id 
                  ? (asteroid.hitsEarth ? '#ff3333' : '#33cc33') 
                  : baseColor.base}
            stroke={selectedAsteroidId === asteroid.id 
                   ? (asteroid.hitsEarth ? '#ff6666' : '#66ff66') 
                   : baseColor.dark}
            stroke-width="2"
          />
          
          <!-- Craters/features -->
          {#each getAsteroidFeatures(asteroid) as feature}
            <circle 
              cx={feature.x} 
              cy={feature.y} 
              r={feature.r}
              fill={selectedAsteroidId === asteroid.id 
                  ? "rgba(255,255,255,0.2)" 
                  : baseColor.dark}
            />
          {/each}
          
          <!-- Trajectory line -->
          <line 
            x1="0" 
            y1="0" 
            x2={Math.cos(asteroid.angle * Math.PI / 180) * -asteroid.velocity / 2} 
            y2={Math.sin(asteroid.angle * Math.PI / 180) * -asteroid.velocity / 2}
            stroke={selectedAsteroidId === asteroid.id ? "#fff" : "rgba(255,255,255,0.3)"}
            stroke-width={selectedAsteroidId === asteroid.id ? "2" : "1"}
            stroke-dasharray="4,2"
          />
        </g>
      {/each}
    </svg>
    
    <!-- Info panel for selected asteroid -->
    {#if selectedAsteroid}
      <div class="info-panel">
        <h3>Asteroid #{selectedAsteroid.id + 1}</h3>
        <div class="asteroid-stats">
          <div><span>Velocity:</span> {selectedAsteroid.velocity.toFixed(1)} km/s</div>
          <div><span>Angle:</span> {selectedAsteroid.angle.toFixed(1)}°</div>
          <div><span>Distance:</span> {selectedAsteroid.distance.toFixed(0)} km</div>
          <div class={selectedAsteroid.hitsEarth ? "danger" : "safe"}>
            <span>Impact:</span> {selectedAsteroid.hitsEarth ? "YES - DANGER!" : "No - Safe"}
          </div>
        </div>
      </div>
    {/if}
  </div>
  
  <style>
    .asteroid-field {
      position: relative;
      max-width: 100%;
      margin: 0 auto;
      background-color: #070723;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      overflow: hidden;
    }
    
    svg {
      width: 100%;
      height: 100%;
    }
    
    .asteroid {
      cursor: pointer;
      transition: filter 0.3s ease;
    }
    
    .asteroid:hover {
      filter: brightness(1.2);
    }
    
    .asteroid.selected {
      filter: brightness(1.3);
    }
    
    .asteroid.hits {
      filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.8));
      animation: danger-pulse 1.5s infinite;
    }
    
    .asteroid.misses {
      filter: drop-shadow(0 0 10px rgba(0, 255, 0, 0.6));
    }
    
    .earth {
      filter: drop-shadow(0 0 8px rgba(100, 180, 255, 0.5));
    }
    
    .info-panel {
      position: absolute;
      bottom: 20px;
      right: 20px;
      background-color: rgba(15, 25, 50, 0.85);
      border: 1px solid #445;
      border-radius: 8px;
      padding: 12px;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
      backdrop-filter: blur(5px);
      width: 180px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .info-panel h3 {
      margin-top: 0;
      margin-bottom: 10px;
      border-bottom: 1px solid #557;
      padding-bottom: 5px;
      text-align: center;
    }
    
    .asteroid-stats {
      display: grid;
      gap: 8px;
      font-size: 14px;
    }
    
    .asteroid-stats span {
      font-weight: bold;
      color: #aac;
    }
    
    .danger {
      color: #ff5555;
      font-weight: bold;
    }
    
    .safe {
      color: #55ff55;
      font-weight: bold;
    }
    
    @keyframes danger-pulse {
      0% { filter: drop-shadow(0 0 5px rgba(255, 50, 50, 0.5)); }
      50% { filter: drop-shadow(0 0 12px rgba(255, 50, 50, 0.9)); }
      100% { filter: drop-shadow(0 0 5px rgba(255, 50, 50, 0.5)); }
    }
  </style>