<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { brand } from '$lib/brand.svelte';
	import BrandCustomizerModal from '$lib/components/BrandCustomizerModal.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();
	let isBrandModalOpen = $state(false);

	onMount(() => {
		const handleOpenModal = () => {
			isBrandModalOpen = true;
		};
		window.addEventListener('ekson_open_brand_modal', handleOpenModal);
		return () => {
			window.removeEventListener('ekson_open_brand_modal', handleOpenModal);
		};
	});

	$effect(() => {
		if (typeof document !== 'undefined') {
			const root = document.documentElement;
			root.style.setProperty('--brand-primary', '#009dd6');
			root.style.setProperty('--brand-secondary', '#04547c');
			root.style.setProperty('--brand-light-tint', 'rgba(0, 157, 214, 0.12)');
			root.style.setProperty('--brand-contrast-text', '#ffffff');
			root.style.setProperty('--color-primary', '#009dd6');
			root.style.setProperty('--color-secondary', '#04547c');
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<BrandCustomizerModal
	isOpen={isBrandModalOpen}
	onClose={() => (isBrandModalOpen = false)}
/>
