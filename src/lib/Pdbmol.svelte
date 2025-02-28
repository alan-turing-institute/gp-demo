<script>
    import { onMount } from 'svelte';

    let pdbData = `
ATOM      1  C   ETO     1       0.445  -2.202  -5.280  1.00  0.00
ATOM      2  H1  ETO     1       1.032  -1.394  -5.234  1.00  0.00
ATOM      3  H2  ETO     1      -0.151  -2.228  -4.477  1.00  0.00
ATOM      4  OH  ETO     1       1.295  -3.437  -5.310  1.00  0.00
ATOM      5  HO  ETO     1       1.850  -3.479  -4.479  1.00  0.00
ATOM      6  C1  ETO     1      -0.394  -2.141  -6.522  1.00  0.00
ATOM      7  H3  ETO     1      -0.979  -2.951  -6.569  1.00  0.00
ATOM      8  H4  ETO     1      -0.962  -1.319  -6.501  1.00  0.00
ATOM      9  H5  ETO     1       0.202  -2.114  -7.325  1.00  0.00
TER
END`;

    onMount(async () => {
        if (typeof window !== 'undefined') {
            // Dynamically import 3Dmol.js in the browser
            const { createViewer } = await import('3dmol');

            // Create the viewer
            const viewer = createViewer(document.getElementById('viewer'), {
                backgroundColor: "white"
            });

            // Add molecular data and set visualization styles
            viewer.addModel(pdbData, "pdb");
            viewer.setStyle({}, {
                stick: { radius: 0.2 },
                sphere: { scale: 0.3 }
            });

            // Zoom to fit the model and render it
            viewer.zoomTo();
            viewer.render();
        }
    });
</script>

<style>
    #viewer {
        width: 100%;
        height: 600px;
        border: 1px solid #ccc;
    }
</style>

<div id="viewer"></div>
