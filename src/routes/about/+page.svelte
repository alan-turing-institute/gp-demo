<script lang="ts">
	import type { Point } from "$lib/types";
  import PlotMarginalsNoSamples from '$lib/PlotMarginalsNoSamples.svelte';
	import { linspace, matrixSqrt } from "$lib/mymath";
  import { instantiateKernel, sumKernel, white } from "$lib/kernels";
  import { makeSqexp } from "$lib/kernels";
  import { posterior, prior } from '$lib/gpposterior';
  import {x1, x2} from "$lib/store";
	import type Matrix from "ml-matrix";
	import { type IndicesAndFrac, getIndicesAndFrac } from "$lib/binarysearch";
  // import { addPoint } from "$lib/PlotMarginals.svelte";

  let points: Point[] = [];

  // Copied from PlotMarginals
  function addPoint(newX: number, newY: number) {
    points = points.concat({ x: newX, y: newY });
    console.log(points);
  }

  let plotProps = {
		mean: true,
		confidence: true,
		samples: true,
		marginals: true,
		withNoise: false
	};

  let num_grid = 150;
  $: xs = linspace(0, 6, num_grid);
  let kernelSelection = makeSqexp();
  $: kernel = instantiateKernel(kernelSelection);
  let noiseScale = 0.0;
  $: kernelWithJitter = sumKernel([kernel, white(1e-6)]);
  $: gp =
		points.length > 0
			? posterior(
					kernelWithJitter,
					points.map((p) => p.x),
					points.map((p) => p.y),
					noiseScale * noiseScale
				)
			: prior(kernelWithJitter);

	$: k1s = xs.map((x) => gp.kernel($x1, x));
	$: k2s = xs.map((x) => gp.kernel($x2, x));
	$: means = gp.mean(xs);
	$: covMat = gp.cov(xs);
	$: marginalVariances = covMat.diag();
	$: covSqrt = matrixSqrt(covMat);

  // let samples: Matrix; // bound to Animation component; will be undefined until it was mounted
  
  // $: getDataAt = (dat: IndicesAndFrac) => {
	// 	// Computes linear interpolation of all properties for point between two indices
	// 	// TODO improve using d3-interpolate?
	// 	const samples1 = !samples ? [] : samples.getRow(dat.idx1);
	// 	const samples2 = !samples ? [] : samples.getRow(dat.idx2);
	// 	const ys = samples1.map((y1: number, i: number) => dat.w1 * y1 + dat.w2 * samples2[i]);
	// 	const mean = dat.w1 * means[dat.idx1] + dat.w2 * means[dat.idx2];
	// 	const variance = dat.w1 * marginalVariances[dat.idx1] + dat.w2 * marginalVariances[dat.idx2];
	// 	const k1 = dat.w1 * k1s[dat.idx1] + dat.w2 * k1s[dat.idx2];
	// 	const k2 = dat.w1 * k2s[dat.idx1] + dat.w2 * k2s[dat.idx2];
	// 	return { ys, mean, variance, k1, k2 };
	// };
  // $: atX1 = getDataAt(getIndicesAndFrac(xs, $x1));
	// $: atX2 = getDataAt(getIndicesAndFrac(xs, $x2));

	// $: covY1Y2 = gp.cov([$x1, $x2]);
	// $: covProps = covEllipse(covY1Y2);

</script>

<!-- Make container with left panel and right panel -->
<style>
	.panel {
	  display: flex;
	  gap: 20px;
	  margin-bottom: 20px;
	}
	.panel-left {
	  border: 1px solid #ccc;
	  padding: 10px;
	}
	.panel-right {
	  border: 1px solid #ccc;
	  padding: 10px;
	}
</style>


<div class="panel">
  <div class="panel-left">
	<h2>Left Panel</h2>
	<!-- <button on:click={() => addPoint(Math.random(), Math.random())}>Add point</button> -->
	<button on:click={() => addPoint(Math.random()*6, Math.random())}>Add point</button>
	<!-- <ul>
	  {#each points as point}
		<li>{point.x}, {point.y}</li>
	  {/each}
	</ul> -->
  </div>
  <div class="panel-right">
	<h2>Right Panel</h2>
		<!-- GP visualisation (change style later)-->
		<PlotMarginalsNoSamples
		{xs}
		{means}
		{marginalVariances}
		bind:points
		{plotProps}
		{noiseScale}
    />
  </div>
</div>

<!-- Add button for left panel to push data -->



<!-- Add plot marginals for right panel to shwo emulator after data pushed -->



