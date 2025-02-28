<script>
  import * as THREE from 'three';
  import { onMount } from 'svelte';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

  let container;
  let scene, camera, renderer, molecule;
  let phi = 0;
  let psi = 0;
  let bonds = [];

  onMount(() => {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 50);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(400, 400);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    molecule = new THREE.Group();
    scene.add(molecule);

    drawMolecule();

    const light = new THREE.AmbientLight(0x888888);
    scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    animate();
  });

  function drawMolecule() {
    molecule.clear();
    bonds = [];

    const sphereGeometry = new THREE.SphereGeometry(2, 32, 32);
    const bondMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });

    function createAtom(x, y, color) {
      const material = new THREE.MeshBasicMaterial({ color });
      const atom = new THREE.Mesh(sphereGeometry, material);
      atom.position.set(x, y, 0);
      molecule.add(atom);
      return atom.position.clone();
    }

    function createBond(start, end) {
      const bondGeometry = new THREE.CylinderGeometry(0.5, 0.5, start.distanceTo(end), 8);
      const bond = new THREE.Mesh(bondGeometry, bondMaterial);
      
      const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
      bond.position.copy(midPoint);
      
      const direction = new THREE.Vector3().subVectors(end, start).normalize();
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      bond.applyQuaternion(quaternion);
      
      molecule.add(bond);
      bonds.push(bond);
    }

    // Alanine Dipeptide Backbone Atoms
    const phiRad = THREE.MathUtils.degToRad(phi);
    const psiRad = THREE.MathUtils.degToRad(psi);
    
    const c1 = createAtom(-15, 0, 0x333333); // C
    const n1 = createAtom(-5, 0, 0x0000ff); // N
    const c2 = createAtom(5, 0, 0x333333); // C
    const n2 = createAtom(15, 0, 0x0000ff); // N
    const c3 = createAtom(25, 0, 0x333333); // C
    const o1 = createAtom(30, 5, 0xff0000); // O
    const o2 = createAtom(20, -5, 0xff0000); // O
    const o3 = createAtom(-10, 5, 0xff0000); // O
    
    createBond(c1, n1);
    createBond(n1, c2);
    createBond(c2, n2);
    createBond(n2, c3);
    createBond(c3, o1);
    createBond(c3, o2);
    createBond(c1, o3);
    
    // Hydrogen atoms
    let hydrogen_color = 0x2faee5;
    const hAtoms = [
      createAtom(-20, 5, hydrogen_color), createAtom(-20, -5, hydrogen_color),
      createAtom(-5, 5, hydrogen_color), createAtom(-5, -5, hydrogen_color),
      createAtom(5, 5, hydrogen_color), createAtom(5, -5, hydrogen_color),
      createAtom(15, 5, hydrogen_color), createAtom(15, -5, hydrogen_color),
      createAtom(25, 5, hydrogen_color), createAtom(25, -5, hydrogen_color),
      createAtom(30, -5, hydrogen_color), createAtom(-10, -5, hydrogen_color)
    ];

    // Connect hydrogens to backbone
    createBond(c1, hAtoms[0]); createBond(c1, hAtoms[1]);
    createBond(n1, hAtoms[2]); createBond(n1, hAtoms[3]);
    createBond(c2, hAtoms[4]); createBond(c2, hAtoms[5]);
    createBond(n2, hAtoms[6]); createBond(n2, hAtoms[7]);
    createBond(c3, hAtoms[8]); createBond(c3, hAtoms[9]);
    createBond(o1, hAtoms[10]); createBond(o3, hAtoms[11]);
  }

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
</script>

<div bind:this={container} style="width: 400px; height: 400px; margin: auto;"></div>

<label>
  Phi (ϕ): <input type="range" min="-180" max="180" bind:value={phi} on:input={drawMolecule} />
</label>
<label>
  Psi (ψ): <input type="range" min="-180" max="180" bind:value={psi} on:input={drawMolecule} />
</label>
