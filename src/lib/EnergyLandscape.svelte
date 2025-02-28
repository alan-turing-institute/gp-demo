<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	export let WIDTH: number;
	export let HEIGHT: number;
	export let handleContourClick: () => void;
	export let isLoading: boolean;

	let canvas: any;
	const dispatch = createEventDispatcher();

	onMount(() => {
		dispatch('canvasReady', { canvas });
	});
</script>

<canvas
	bind:this={canvas}
	width={WIDTH + 60}
	height={HEIGHT}
	on:click={handleContourClick}
	class={isLoading ? 'loading' : ''}
></canvas>
