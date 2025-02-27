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
        <!-- Ocean base -->
        <circle r="30" fill="#0066cc" />
        
        <!-- Continental patterns - more detailed land masses -->
        <g class="continents">
          <!-- North America -->
          <path d="M-25,-5 C-23,-10 -20,-15 -15,-17 C-13,-20 -10,-22 -7,-20 C-5,-18 -3,-15 -3,-12 C-2,-8 -5,-5 -7,-2 C-10,0 -12,3 -16,5 C-19,7 -22,8 -25,5 C-27,2 -28,-2 -25,-5 Z" 
            fill="#5d8c51" />
          
          <!-- South America -->
          <path d="M-7,5 C-5,8 -4,12 -6,16 C-7,20 -10,22 -11,25 C-12,22 -14,20 -13,17 C-12,14 -10,10 -9,7 C-8,5 -8,3 -7,5 Z" 
            fill="#6b9c5f" />
          
          <!-- Europe -->
          <path d="M0,-10 C3,-12 7,-11 10,-10 C12,-13 15,-15 18,-14 C18,-11 17,-8 15,-6 C12,-5 8,-6 5,-4 C3,-2 0,0 -2,-2 C-3,-5 -2,-8 0,-10 Z" 
            fill="#5a8555" />
          
          <!-- Africa -->
          <path d="M5,0 C8,-2 12,-1 15,1 C17,4 18,8 17,12 C15,16 12,18 8,17 C5,15 3,12 2,8 C1,4 3,1 5,0 Z" 
            fill="#7da065" />
          
          <!-- Asia -->
          <path d="M12,-8 C15,-10 19,-9 22,-7 C24,-4 25,0 24,4 C23,8 20,12 16,14 C12,15 8,13 6,10 C5,6 7,2 9,-1 C10,-4 10,-7 12,-8 Z" 
            fill="#6b9c5f" />
          
          <!-- Australia -->
          <path d="M18,8 C20,7 22,8 23,10 C24,12 23,15 21,16 C19,17 16,16 15,14 C14,12 15,9 18,8 Z" 
            fill="#8fb073" />
        </g>
        
        <!-- Cloud patterns - semi-transparent white swirls -->
        <g class="clouds" opacity="0.5">
          <path d="M-20,-10 C-15,-12 -10,-10 -15,-5 C-20,-2 -25,-5 -20,-10 Z" 
            fill="white" opacity="0.6" />
          <path d="M5,-25 C10,-23 12,-18 8,-15 C3,-14 0,-18 5,-25 Z" 
            fill="white" opacity="0.5" />
          <path d="M15,10 C20,8 25,12 22,16 C18,18 12,15 15,10 Z" 
            fill="white" opacity="0.7" />
          <path d="M-10,15 C-5,18 -2,22 -7,25 C-12,24 -15,20 -10,15 Z" 
            fill="white" opacity="0.4" />
        </g>
        
        <!-- Atmospheric glow -->
        <circle r="30" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
        <circle r="32" fill="none" stroke="rgba(120,200,255,0.3)" stroke-width="2" />
        <circle r="35" fill="none" stroke="rgba(100,200,255,0.2)" stroke-width="3" />
        <circle r="39" fill="none" stroke="rgba(80,180,255,0.1)" stroke-width="4" />
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