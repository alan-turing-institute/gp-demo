<script>
    import AsteroidField from '$lib/AsteroidField.svelte';
    
    let selectedAsteroid = $state(null);
    
    function handleAsteroidSelect(event) {
      selectedAsteroid = event.detail;
      console.log("Selected asteroid:", selectedAsteroid);
    }
  </script>
  
  <svelte:head>
    <title>Asteroid Monitor</title>
  </svelte:head>
  
  <main>
    <h1>Asteroid Monitor</h1>
    
    <div class="game-container">
      <AsteroidField on:select={handleAsteroidSelect} />
    </div>
    
    {#if selectedAsteroid}
      <div class="asteroid-details">
        <h2>Selected Asteroid Details</h2>
        <pre>{JSON.stringify(selectedAsteroid, null, 2)}</pre>
      </div>
    {/if}
  </main>
  
  <style>
    main {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    h1 {
      text-align: center;
      color: #334;
    }
    
    .game-container {
      margin: 20px 0;
    }
    
    .asteroid-details {
      background: #f3f4f6;
      border-radius: 8px;
      padding: 15px;
      margin-top: 20px;
    }
    
    pre {
      background: #eee;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
  </style>