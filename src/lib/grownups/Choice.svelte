<script lang="ts" generics="T">
	// One setting as a row of big, labelled options (a radio group).
	interface Props {
		label: string;
		options: { label: string; value: T }[];
		value: T;
		onchange: (value: T) => void;
	}

	let { label, options, value, onchange }: Props = $props();
</script>

<fieldset>
	<legend>{label}</legend>
	{#each options as option (option.label)}
		<label class:chosen={option.value === value}>
			<input
				type="radio"
				name={label}
				checked={option.value === value}
				onchange={() => onchange(option.value)}
			/>
			{option.label}
		</label>
	{/each}
</fieldset>

<style>
	fieldset {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		margin: 0;
		padding: 12px 0;
		border: none;
		border-bottom: 1px solid rgb(0 0 0 / 0.1);
	}

	legend {
		float: left;
		width: 9em;
		font-weight: 700;
	}

	label {
		padding: 8px 18px;
		border-radius: 999px;
		background: var(--paper);
		box-shadow: var(--shadow);
		cursor: pointer;
	}

	label.chosen {
		background: #ffe082;
	}

	label:has(:focus-visible) {
		outline: 4px solid #1565c0;
	}

	input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
</style>
