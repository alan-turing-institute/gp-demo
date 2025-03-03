<script>
	import { onMount } from 'svelte';

	// Initial PDB data
	let pdbData = `
ATOM      1  CH3 ACE     1       2.000   2.090   0.000
ATOM      2  C   ACE     1       3.427   2.641  -0.000
ATOM      3  O   ACE     1       4.391   1.877  -0.000
ATOM      4  N   ALA     2       3.555   3.970  -0.000
ATOM      5  CA  ALA     2       4.853   4.614  -0.000
ATOM     6  HA  ALA     2       5.408   4.316   0.890
ATOM     7  CB  ALA     2       5.661   4.221  -1.232
ATOM     8  C   ALA     2       4.713   6.129   0.000
ATOM     9  O   ALA     2       3.601   6.653   0.000
ATOM     10  N   NME     3       5.846   6.835   0.000
ATOM     11  H   NME     3       6.737   6.359  -0.000
ATOM     12  CH3 NME     3       5.846   8.284   0.000
TER   
END`;

	// Configuration
	let indices = [6,7,8,9,10,11,12]; // Indices of atoms to rotate (1-based index)
	let axisStartAtomIndex = 4; // Index of the first atom defining the axis
	let axisEndAtomIndex = 5; // Index of the second atom defining the axis
	let angle = 50; // Rotation angle in degrees

	// Function to rotate atoms around an axis
	function rotateAtoms(pdbData, indices, axisStartAtomIndex, axisEndAtomIndex, angle) {
		// Parse PDB data
		let lines = pdbData.split('\n').filter(line => line.startsWith('ATOM'));
		let atoms = lines.map(line => {
			let x = parseFloat(line.substring(30, 38).trim());
			let y = parseFloat(line.substring(38, 46).trim());
			let z = parseFloat(line.substring(46, 54).trim());
			return { x, y, z, line };
		});

		// Get the axis start and end points
		let axisStart = atoms[axisStartAtomIndex - 1];
		let axisEnd = atoms[axisEndAtomIndex - 1];

		// Calculate the axis vector
		let axisVector = {
			x: axisEnd.x - axisStart.x,
			y: axisEnd.y - axisStart.y,
			z: axisEnd.z - axisStart.z
		};

		// Normalize the axis vector
		let length = Math.sqrt(axisVector.x ** 2 + axisVector.y ** 2 + axisVector.z ** 2);
		axisVector.x /= length;
		axisVector.y /= length;
		axisVector.z /= length;

		// Convert angle to radians
		let rad = (angle * Math.PI) / 180;

		// Rotation matrix components
		let cos = Math.cos(rad);
		let sin = Math.sin(rad);
		let t = 1 - cos;

		// Rotation matrix
		let rotationMatrix = [
			[
				cos + axisVector.x ** 2 * t,
				axisVector.x * axisVector.y * t - axisVector.z * sin,
				axisVector.x * axisVector.z * t + axisVector.y * sin
			],
			[
				axisVector.y * axisVector.x * t + axisVector.z * sin,
				cos + axisVector.y ** 2 * t,
				axisVector.y * axisVector.z * t - axisVector.x * sin
			],
			[
				axisVector.z * axisVector.x * t - axisVector.y * sin,
				axisVector.z * axisVector.y * t + axisVector.x * sin,
				cos + axisVector.z ** 2 * t
			]
		];

		// Rotate the specified atoms
		indices.forEach(index => {
			let atom = atoms[index - 1];
			let x = atom.x - axisStart.x;
			let y = atom.y - axisStart.y;
			let z = atom.z - axisStart.z;

			// Apply rotation
			let newX = rotationMatrix[0][0] * x + rotationMatrix[0][1] * y + rotationMatrix[0][2] * z;
			let newY = rotationMatrix[1][0] * x + rotationMatrix[1][1] * y + rotationMatrix[1][2] * z;
			let newZ = rotationMatrix[2][0] * x + rotationMatrix[2][1] * y + rotationMatrix[2][2] * z;

			// Update atom coordinates
			atom.x = newX + axisStart.x;
			atom.y = newY + axisStart.y;
			atom.z = newZ + axisStart.z;

			// Update the PDB line
			let newLine = atom.line.substring(0, 30) +
				atom.x.toFixed(3).padStart(8) +
				atom.y.toFixed(3).padStart(8) +
				atom.z.toFixed(3).padStart(8) +
				atom.line.substring(54);
			atom.line = newLine;
		});

		// Reconstruct the PDB data
		let newPdbData = atoms.map(atom => atom.line).join('\n') + '\nTER\nEND';
		return newPdbData;
	}

	// Reactive statement to update the molecule when the angle changes
	let rotatedPdbData;
	$: rotatedPdbData = rotateAtoms(pdbData, indices, axisStartAtomIndex, axisEndAtomIndex, angle);

	// Viewer initialization
	let viewer;
	let viewerContainer;

	onMount(async () => {
		if (typeof window !== 'undefined') {
			try {
				// Dynamically import 3Dmol.js in the browser
				const { createViewer } = await import('3dmol');
				console.log("3Dmol.js loaded successfully");
				
				// Create the viewer
				viewer = createViewer(viewerContainer, {
					backgroundColor: 'white'
				});
				
				// Add the molecule to the viewer
				updateViewer();
				
				// Ensure the viewer is responsive to container size
				window.addEventListener('resize', () => {
					if (viewer) {
						viewer.resize();
						viewer.render();
					}
				});
			} catch (error) {
				console.error("Failed to load 3Dmol.js:", error);
			}
		}
	});

	// Function to update the viewer with the rotated molecule
	function updateViewer() {
		if (viewer) {
			console.log("Updating viewer with angle:", angle);
			viewer.clear();
			viewer.addModel(rotatedPdbData, 'pdb');
			viewer.setStyle({}, { stick: { radius: 0.2 }, sphere: { scale: 0.3 } });
			viewer.zoomTo();
			viewer.render();
		}
	}

	// Update the viewer whenever the angle changes
	$: if (viewer && rotatedPdbData) {
		console.log("Angle changed to:", angle);
		updateViewer();
	}
</script>

<main>
	<!-- Control Panel -->
	<div class="control-panel">
		<label for="angle">Rotation Angle (degrees):</label>
		<input type="range" id="angle" bind:value={angle} min="0" max="360" step="1" />
		<span>{angle}°</span>
	</div>

	<!-- 3Dmol Viewer -->
	<div class="viewer-container">
		<div id="viewer" bind:this={viewerContainer}></div>
	</div>
</main>

<style>
	main {
		width: 100%;
		max-width: 1000px;
		margin: 0 auto;
		padding: 20px;
		box-sizing: border-box;
	}

	.viewer-container {
		width: 100%;
		aspect-ratio: 4/3;
		border: 1px solid #ccc;
		margin-top: 20px;
		overflow: hidden;
		position: relative;
	}

	#viewer {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
	}

	.control-panel {
		width: 100%;
		padding: 15px;
		background-color: #f5f5f5;
		border-radius: 5px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.control-panel label {
		font-weight: bold;
		min-width: 170px;
	}

	.control-panel input {
		flex-grow: 1;
		max-width: 400px;
	}

	.control-panel span {
		min-width: 50px;
		text-align: right;
		font-weight: bold;
	}
</style>