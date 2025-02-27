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

  let points: Point[] = [];

  // Copied from PlotMarginals
  function addPoint(newX: number, newY: number) {
    points = points.concat({ x: newX, y: newY });
    console.log(points);
  }

  function clearPoints() {
    points = []
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
	$: means = gp.mean(xs);
	$: covMat = gp.cov(xs);
	$: marginalVariances = covMat.diag();
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
  <!-- Add button for left panel to push data -->
  <div class="panel-left">
	<h2>Left Panel</h2>
	<button on:click={() => addPoint(Math.random()*6, Math.random())}>Add point</button>
	<button on:click={() => clearPoints()}>Clear points</button>
  </div>
  <!-- Add plot marginals for right panel to shwo emulator after data pushed -->
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
