<script>
	import { onMount } from 'svelte';
  
	let pdbData = `
  ATOM      1  CH3 ACE     1       2.000   2.090   0.000
  ATOM      2  C   ACE     1       3.427   2.641  -0.000
  ATOM      3  O   ACE     1       4.391   1.877  -0.000
  ATOM      5  N   ALA     2       3.555   3.970  -0.000
  ATOM      6  CA  ALA     2       4.853   4.614  -0.000
  ATOM      7  HA  ALA     2       5.408   4.316   0.890
  ATOM      8  CB  ALA     2       5.661   4.221  -1.232
  ATOM      9  C   ALA     2       4.713   6.129   0.000
  ATOM      10  O   ALA     2       3.601   6.653   0.000
  ATOM      11  N   NME     3       5.846   6.835   0.000
  ATOM      12  H   NME     3       6.737   6.359  -0.000
  ATOM      13  CH3 NME     3       5.846   8.284   0.000
  TER   
  END`;


  function applyTorsion(viewer, atomIndices, angle, axisStart, axisEnd) {
  // Clear the viewer first to prevent duplicate models
  viewer.clear();
  
  // Re-add the model with current data
  viewer.addModel(pdbData, 'pdb');
  viewer.setStyle({}, {
    stick: { radius: 0.2 },
    sphere: { scale: 0.3 }
  });
  
  let models = viewer.getModel();
  if (!models) {
    console.error('No model loaded.');
    return;
  }

  // Get all atoms
  let atoms = models.selectedAtoms({});
  
  // Log the atoms to see what's available
  console.log("Available atoms:", atoms.map(a => a.serial));
  
  // Find the atoms by index - check if serial numbers match
  let axisStartAtom = atoms.find(atom => atom.serial == axisStart);
  let axisEndAtom = atoms.find(atom => atom.serial == axisEnd);
  
  if (!axisStartAtom || !axisEndAtom) {
    console.error('Axis atoms not found:', axisStart, axisEnd);
    return;
  }
  
  // Get atoms to rotate
  let atomsToRotate = [];
  for (let i = 0; i < atomIndices.length; i++) {
    let atom = atoms.find(a => a.serial == atomIndices[i]);
    if (atom) atomsToRotate.push(atom);
    else console.warn(`Atom with serial ${atomIndices[i]} not found`);
  }
  
  if (atomsToRotate.length === 0) {
    console.error('No atoms to rotate found.');
    return;
  }
  
  // Compute rotation axis
  let axis = [
    axisEndAtom.x - axisStartAtom.x,
    axisEndAtom.y - axisStartAtom.y,
    axisEndAtom.z - axisStartAtom.z
  ];
  
  // Normalize axis
  let length = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
  axis = [axis[0] / length, axis[1] / length, axis[2] / length];
  
  // Convert angle to radians
  let theta = (angle * Math.PI) / 180;
  
  // Rotation function
  function rotatePoint(p, origin, axis, theta) {
    let ux = axis[0], uy = axis[1], uz = axis[2];
    let x = p.x - origin.x, y = p.y - origin.y, z = p.z - origin.z;
    let cosT = Math.cos(theta), sinT = Math.sin(theta);
    
    return {
      x: origin.x + 
         (cosT + (1 - cosT) * ux * ux) * x +
         ((1 - cosT) * ux * uy - uz * sinT) * y +
         ((1 - cosT) * ux * uz + uy * sinT) * z,
      y: origin.y +
         ((1 - cosT) * uy * ux + uz * sinT) * x +
         (cosT + (1 - cosT) * uy * uy) * y +
         ((1 - cosT) * uy * uz - ux * sinT) * z,
      z: origin.z +
         ((1 - cosT) * uz * ux - uy * sinT) * x +
         ((1 - cosT) * uz * uy + ux * sinT) * y +
         (cosT + (1 - cosT) * uz * uz) * z
    };
  }
  
  // Apply rotation to atoms
  atomsToRotate.forEach(atom => {
    let newPos = rotatePoint(atom, axisStartAtom, axis, theta);
    atom.x = newPos.x;
    atom.y = newPos.y;
    atom.z = newPos.z;
  });
  
  // Update the model
  viewer.render();
  
  // Now update the pdbData string with new coordinates
  let lines = pdbData.split('\n');
  let newLines = [];
  
  for (let line of lines) {
    if (line.trim().startsWith('ATOM')) {
      // Extract the serial number considering your specific format
      let parts = line.trim().split(/\s+/);
      let serial = parseInt(parts[1]);
      
      let rotatedAtom = atomsToRotate.find(a => a.serial == serial);
      
      if (rotatedAtom) {
        // Reconstruct the line with updated coordinates
        // Maintain the same format as your original PDB
        let newLine = ` ATOM ${serial} ${parts[2]} ${parts[3]} ${parts[4]} ${rotatedAtom.x.toFixed(3)} ${rotatedAtom.y.toFixed(3)} ${rotatedAtom.z.toFixed(3)}`;
        newLines.push(newLine);
      } else {
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }
  
  pdbData = newLines.join('\n');
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
  
		// Example: Rotate atoms with indices [2, 3, 4, 6, 5, 1] by 80 degrees around the axis between ATOM 5 and ATOM 9
		applyTorsion(viewer, [7,8,9], 0, 1, 3);
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
  