<script>
	import { onMount } from 'svelte';
    let indices =[1,2,3,4];
    let angle = 90;
	let pdbData = `
ATOM      2  CH3 ACE     1       2.000   2.090   0.000
ATOM      5  C   ACE     1       3.427   2.641  -0.000
ATOM      6  O   ACE     1       4.391   1.877  -0.000
ATOM      7  N   ALA     2       3.555   3.970  -0.000
ATOM      9  CA  ALA     2       4.853   4.614  -0.000
ATOM     10  HA  ALA     2       5.408   4.316   0.890
ATOM     11  CB  ALA     2       5.661   4.221  -1.232
ATOM     15  C   ALA     2       4.713   6.129   0.000
ATOM     16  O   ALA     2       3.601   6.653   0.000
ATOM     17  N   NME     3       5.846   6.835   0.000
ATOM     18  H   NME     3       6.737   6.359  -0.000
ATOM     19  CH3 NME     3       5.846   8.284   0.000

TER   
END`;

	function rotatePDBSubset(pdbString, indices, angle) {
		let viewer = new $3Dmol.GLViewer(document.createElement('div'));
		viewer.addModel(pdbString, 'pdb');
		let model = viewer.getModel(0);

		// Parse atoms and get the subset to rotate
		let atoms = model.selectedAtoms({});
		let subset = indices.map((i) => atoms[i]).filter((atom) => atom);

		if (subset.length === 0) {
			console.error('No atoms found for the given indices.');
			return pdbString;
		}

		// Compute centroid of the subset to use as rotation center
		let centroid = subset.reduce(
			(acc, atom) => {
				acc.x += atom.x;
				acc.y += atom.y;
				acc.z += atom.z;
				return acc;
			},
			{ x: 0, y: 0, z: 0 }
		);
		centroid.x /= subset.length;
		centroid.y /= subset.length;
		centroid.z /= subset.length;

		// Convert angle to radians
		let rad = (angle * Math.PI) / 180;
		let cosA = Math.cos(rad);
		let sinA = Math.sin(rad);
		let ux = 0,
			uy = 0,
			uz = 1; // Default rotation axis (Z-axis)
		let rotationMatrix = [
			[
				cosA + ux * ux * (1 - cosA),
				ux * uy * (1 - cosA) - uz * sinA,
				ux * uz * (1 - cosA) + uy * sinA
			],
			[
				uy * ux * (1 - cosA) + uz * sinA,
				cosA + uy * uy * (1 - cosA),
				uy * uz * (1 - cosA) - ux * sinA
			],
			[
				uz * ux * (1 - cosA) - uy * sinA,
				uz * uy * (1 - cosA) + ux * sinA,
				cosA + uz * uz * (1 - cosA)
			]
		];

		// Apply rotation
		subset.forEach((atom) => {
			let x = atom.x - centroid.x;
			let y = atom.y - centroid.y;
			let z = atom.z - centroid.z;

			atom.x =
				centroid.x +
				(rotationMatrix[0][0] * x + rotationMatrix[0][1] * y + rotationMatrix[0][2] * z);
			atom.y =
				centroid.y +
				(rotationMatrix[1][0] * x + rotationMatrix[1][1] * y + rotationMatrix[1][2] * z);
			atom.z =
				centroid.z +
				(rotationMatrix[2][0] * x + rotationMatrix[2][1] * y + rotationMatrix[2][2] * z);
		});

		model.setCoordinates(atoms);
		return model.getPDB();
	}

	onMount(async () => {
		if (typeof window !== 'undefined') {
			// Dynamically import 3Dmol.js in the browser
			const { createViewer } = await import('3dmol');

			// Create the viewer
			const viewer = createViewer(document.getElementById('viewer'), {
				backgroundColor: 'white'
			});

			// Add molecular data and set visualization styles
			viewer.addModel(pdbData, 'pdb');
			viewer.setStyle(
				{},
				{
					stick: { radius: 0.2 },
					sphere: { scale: 0.3 }
				}
			);

			// Zoom to fit the model and render it
			viewer.zoomTo();
			viewer.render();
		}
	});
</script>

<div id="viewer"></div>

<style>
	#viewer {
		width: 100%;
		height: 600px;
		border: 1px solid #ccc;
	}
</style>
