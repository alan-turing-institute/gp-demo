<script>
	export let trainingX = []
	export let trainingY = []
	$: tableData = trainingX.length > 0 ? trainingX.map(([v, theta], index) => ({
		v: v.toFixed(2),
		theta: theta.toFixed(2),
		pariapsis: trainingY[index].toFixed(2)
	})) : [];
</script>

{#if tableData.length > 0}
	<table class="redTable">
		<thead>
			<tr>
				{#each Object.keys(tableData[0]) as columnHeading}
					<th>{columnHeading}</th>
				{/each}
			<tr/>
		</thead>
		<tbody>
			{#each Object.values(tableData) as row}
				<tr>
					{#each Object.values(row) as cell}
						<td>{cell}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	.redTable {
	  width: 100%;
	  border-collapse: collapse;
	  font-family: Arial, sans-serif;
	  font-size: 14px;
	  margin-top: 10px;
	}
  
	.redTable thead {
	  background-color: #d32f2f;
	  color: white;
	  text-transform: uppercase;
	}
  
	.redTable th, .redTable td {
	  padding: 10px;
	  text-align: center;
	  border: 1px solid #ddd;
	}
  
	.redTable tbody tr:nth-child(even) {
	  background-color: #f9f9f9;
	}
  
	.redTable tbody tr:hover {
	  background-color: #f1c0c0;
	  transition: background 0.3s ease-in-out;
	}
  
	.redTable th {
	  border-bottom: 2px solid #b71c1c;
	}
  </style>
