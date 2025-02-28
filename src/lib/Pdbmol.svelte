<script>
	import { onMount } from 'svelte';
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

	function applyTorsion(viewer, atom1, atom2, angle) {
		let model = viewer.getModel();
		let atoms = model.selectedAtoms({}); // Get all atoms

		let pos1 = null,
			pos2 = null;
		let rotatingAtoms = new Set();

		// Find the bond atoms
		atoms.forEach((atom) => {
			if (atom.index === atom1) pos1 = atom;
			if (atom.index === atom2) pos2 = atom;
		});

		if (!pos1 || !pos2) {
			console.error('Invalid atom indices.');
			return;
		}

		// Find which atoms should rotate (assume pos2 stays fixed)
		let queue = [pos1];
		while (queue.length > 0) {
			let current = queue.pop();
			if (!rotatingAtoms.has(current.index)) {
				rotatingAtoms.add(current.index);
				queue.push(
					...atoms.filter((a) => a.bonds.includes(current.index) && a.index !== pos2.index)
				);
			}
		}

		// Compute rotation axis and matrix
		let axis = [pos2.x - pos1.x, pos2.y - pos1.y, pos2.z - pos1.z];
		let theta = (angle * Math.PI) / 180; // Convert to radians

		function rotatePoint(p, origin, axis, theta) {
			let ux = axis[0],
				uy = axis[1],
				uz = axis[2];
			let x = p.x - origin.x,
				y = p.y - origin.y,
				z = p.z - origin.z;
			let cosT = Math.cos(theta),
				sinT = Math.sin(theta);

			return {
				x:
					origin.x +
					(cosT + (1 - cosT) * ux * ux) * x +
					((1 - cosT) * ux * uy - uz * sinT) * y +
					((1 - cosT) * ux * uz + uy * sinT) * z,
				y:
					origin.y +
					((1 - cosT) * uy * ux + uz * sinT) * x +
					(cosT + (1 - cosT) * uy * uy) * y +
					((1 - cosT) * uy * uz - ux * sinT) * z,
				z:
					origin.z +
					((1 - cosT) * uz * ux - uy * sinT) * x +
					((1 - cosT) * uz * uy + ux * sinT) * y +
					(cosT + (1 - cosT) * uz * uz) * z
			};
		}

		// Apply rotation to all rotating atoms
		atoms.forEach((atom) => {
			if (rotatingAtoms.has(atom.index)) {
				let newPos = rotatePoint(atom, pos2, axis, theta);
				atom.x = newPos.x;
				atom.y = newPos.y;
				atom.z = newPos.z;
			}
		});

		model.setCoordinates(atoms);
		viewer.render();
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
