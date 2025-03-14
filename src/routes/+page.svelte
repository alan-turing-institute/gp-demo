<script>
  // You can add any necessary imports or logic here
  
  // Navigation links
  // const navLinks = [
  //   { name: 'Home', url: '#home' },
  //   { name: 'About', url: '#about' },
  //   { name: 'Contact', url: '#contact' }
  // ];
  
  // Footer links
  // const footerLinks = [
  //   { name: 'Terms', url: '#terms' },
  //   { name: 'Privacy', url: '#privacy' },
  //   { name: 'Contact', url: '#contact' }
  // ];
  import { writable } from 'svelte/store';

  // Create a store to track the toggled state of each image
  const toggled = writable([false, false, false, false, false, false]);

  // Toggle function
  function toggleFeature(index) {
      toggled.update(state => {
      const newState = [...state];
      newState[index] = !newState[index];
      return newState;
      });
  }
</script>

<main>
  <!-- <header>
    <div class="container">
      <div class="header-content">
        <div class="logo-container">
          <div class="logo">
            <img src="https://raw.githubusercontent.com/alan-turing-institute/autoemulate/refs/heads/main/misc/AE_logo_final.png" alt="AutoEmulate Logo" class="logo-image">
          </div>
          <h1 class="site-title">AutoEmulate</h1>
        </div>
         <nav>
          <ul>
            {#each navLinks as link}
              <li><a href={link.url}>{link.name}</a></li>
            {/each}
          </ul>
        </nav> -->
      <!-- </div>
    </div>
  </header> -->
  
  <div class="main-content">
    <div class="container">
      <div class="hero">
        <h2>Accelerating large-scale simulations with AI</h2>

        <p>Click on each image to learn about the typical workflow.</p>
        <div class="feature-images">
          {#each [
            { src: 'https://t4.ftcdn.net/jpg/02/66/38/15/360_F_266381525_alVrbw15u5EjhIpoqqa1eI5ghSf7hpz7.jpg', alt: 'Real world', title: 'Reality', text: 'To understand complex real-world systems, researchers and engineers often construct computer simulations.' },
            { src: 'https://users.flatironinstitute.org/~polymathic/data/the_well/datasets/planetswe/gif/planetswe.gif', alt: 'Simulation', title: 'Simulator', text: 'Simulations are computationally expensive and can take hours, days or even weeks to run.' },
            { src: 'https://www.cs.toronto.edu/~duvenaud/cookbook/symmetry/symmetry_2d.png', alt: 'Emulator', title: 'Emulator', text: 'Emulators are fast, accurate models trained to replace simulations in real world applications.' }
          ] as feature, i}
            <div class="feature-image-container" on:click={() => toggleFeature(i)}>
              <h3 class="feature-title">{feature.title}</h3>
              <div class="feature-content">
                {#if $toggled[i]}
                  <p class="feature-text">{feature.text}</p>
                {:else}
                  <img src={feature.src} alt={feature.alt} class="feature-image" />
                {/if}
              </div>
            </div>
          {/each}
        </div>

    </div>

      <div class="hero">
          <h2>Train your own emulator</h2>
          <p>Adjust parameters, observe results, and test how well your emulator performs.</p>
          <div class="cards">
          <div class="card">
              <div class="card-img asteroid-img"></div>
              <div class="card-content">
              <a href="https://alan-turing-institute.github.io/gp-demo/asteroid" class="btn">Launch Asteroid App</a>
              </div>
          </div>
          
          <div class="card">
              <div class="card-img molecule-img"></div>
              <div class="card-content">
              <a href="https://alan-turing-institute.github.io/gp-demo/molecule" class="btn">Launch Molecule App</a>
              </div>
          </div>          
          </div>
      </div>
      
      <div class="hero">
        <h2>AutoEmulate</h2>          
        <div class="cards">
          <div class="card card-horizontal">
            <div class="card-img-side autoemulate-img-container">
              <img src="https://raw.githubusercontent.com/alan-turing-institute/gp-demo/refs/heads/main/static/logogaussian-2.png" alt="AutoEmulate Logo" class="autoemulate-logo">
            </div>
            <div class="card-content">
              <p>We are developing a cross-domain toolkit to automatically build AI-powered emulators for accelerating complex simulations.</p>
              <a href="https://alan-turing-institute.github.io/autoemulate/" class="btn">Website</a>
            </div>
          </div>
        </div>
      </div>
      

  </div>

  
  
  <footer>
    <div class="container">
      <div class="footer-content">
        <p>&copy; 2025 AutoEmulate. All rights reserved.</p>
        <!-- <div class="footer-links">
          {#each footerLinks as link}
            <a href={link.url}>{link.name}</a>
          {/each}
        </div> -->
      </div>
    </div>
  </footer>
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
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }
  
  header {
    padding: 20px 0;
  }
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .logo-container {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .logo {
    width: 70px;
    height: 80px;
    /* border-radius: 50%; */
    display: flex;
    align-items: center;
    justify-content: center;
    /* box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); */
    /* overflow: hidden; */
    /* background: white; */
  }
  
  .logo-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .site-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(to right, var(--primary), var(--accent));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    letter-spacing: 0.5px;
  }
  
  .feature-images {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin: 30px 0;
  }
  .feature-image-container {
    width: 30%;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    background: white;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    text-align: center;
    padding-bottom: 20px;
  }
  .feature-image {
    width: 100%;
    height: auto;
    display: block;
    transition: transform 0.3s ease;
  }
  .feature-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px 20px;
    margin-top: 10px; /* Added spacing between title and content */
  }
  .feature-text {
    font-size: 1rem;
    color: #333;
  }
  .feature-title {
    margin: 0;
    padding: 15px;
    color: white;
    font-size: 1.2rem;
    background-color: var(--primary);
    width: 100%;
    text-align: center;
  }

  .feature-image:hover {
    transform: scale(1.05);
  }
  
  .additional-text {
    margin-bottom: 30px;
  }
  
  nav ul {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 20px;
  }
  
  nav a {
    color: var(--text);
    text-decoration: none;
    font-weight: 500;
    padding: 8px 12px;
    border-radius: 6px;
    transition: all 0.2s ease;
  }
  
  nav a:hover {
    background-color: rgba(60, 99, 130, 0.1);
    color: var(--primary);
  }
  
  .main-content {
    flex: 1;
    padding: 60px 0;
  }
  
  .hero {
    text-align: center;
    padding: 40px 20px;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .hero h2 {
    font-size: 2rem;
    margin-bottom: 20px;
    color: var(--primary);
  }
  
  .hero p {
    font-size: 1.2rem;
    line-height: 1.6;
    margin-bottom: 30px;
    color: var(--text);
  }
  
  .cards {
    display: flex;
    justify-content: center;
    gap: 30px;
    margin-top: 50px;
    flex-wrap: wrap;
  }
  
  .card {
    background: white;
    border-radius: 15px;
    overflow: hidden;
    width: 350px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    display: flex;
    flex-direction: column;
  }
  
  .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
  }
  
  .card-img {
    height: 180px;
    background-size: cover;
    background-position: center;
  }
  
  .asteroid-img {
    background: linear-gradient(rgba(60, 99, 130, 0.8), rgba(60, 99, 130, 0.4)), url(/api/placeholder/350/180);
    position: relative;
  }
  
  .asteroid-img::before {
    content: "";
    position: absolute;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: radial-gradient(#eaeaea, #bbb);
    top: 50px;
    left: 135px;
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
  }
  
  .molecule-img {
  background: linear-gradient(rgba(56, 173, 169, 0.8), rgba(56, 173, 169, 0.4)), 
              url('https://raw.githubusercontent.com/alan-turing-institute/gp-demo/refs/heads/firstpagepics/static/mol.png');
  background-size: cover; /* Ensures the image covers the container */
  background-position: center; /* Centers the image */
  height: 180px; /* Sets a fixed height for the container */
  position: relative; /* Required for positioning child elements */
}
  
  .card-content {
    padding: 25px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .card h3 {
    margin-top: 0;
    font-size: 1.6rem;
    color: var(--primary);
    margin-bottom: 15px;
  }
  
  .card p {
    margin-bottom: 20px;
    flex: 1;
    line-height: 1.5;
  }
  
  .btn {
    display: inline-block;
    background: linear-gradient(to right, var(--primary), var(--accent));
    color: white;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-align: center;
    transition: all 0.2s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .btn:hover {
    background: linear-gradient(to right, var(--accent), var(--primary));
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
  
  footer {
    background: var(--primary);
    color: white;
    padding: 30px 0;
    text-align: center;
    margin-top: auto;
  }
  
  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .footer-links {
    display: flex;
    gap: 20px;
  }
  
  .footer-links a {
    color: white;
    text-decoration: none;
    transition: color 0.2s ease;
  }
  
  .footer-links a:hover {
    color: var(--secondary);
  }
  
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 20px;
    }
    
    nav ul {
      justify-content: center;
    }
    
    .footer-content {
      flex-direction: column;
      gap: 20px;
    }
    
    .site-title {
      font-size: 2rem;
    }
    
    .feature-images {
      flex-direction: column;
      align-items: center;
    }
    
    .feature-image-container {
      width: 80%;
      margin-bottom: 15px;
    }
  }

  .card-horizontal {
    display: flex;
    flex-direction: row;
    width: 100%;
    max-width: 800px;
  }
  
  /* Update these styles in your existing CSS */

.card-img-side {
  width: 30%;
  min-width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  padding: 20px;
  overflow: hidden; /* Prevent image overflow */
}

.autoemulate-img-container {
  background: linear-gradient(rgba(60, 99, 130, 0.6), rgba(60, 99, 130, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
}

.autoemulate-logo {
  width: 100%; /* Change from 90% to 100% */
  max-width: 100%; /* Ensure image doesn't exceed container */
  height: auto;
  object-fit: contain;
  z-index: 1;
  transition: all 0.3s ease; /* Smooth transition when resizing */
}

@media (max-width: 768px) {
  .card-horizontal {
    flex-direction: column;
  }
  
  .card-img-side {
    width: 100%;
    min-height: 180px; /* Use min-height instead of fixed height */
    padding: 15px; /* Slightly reduce padding on mobile */
  }
  
  .autoemulate-logo {
    max-width: 80%; /* Slightly smaller on mobile for better appearance */
  }
}

/* Add this for even smaller screens */
@media (max-width: 480px) {
  .card-img-side {
    min-height: 150px;
  }
}
</style>