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
			const pColor = brand.primaryColor || '#4abbff';
			const sColor = brand.darkColor || '#ba5fff';
			const lTint = brand.lightTint || 'rgba(74, 187, 255, 0.12)';
			const cText = brand.contrastText || '#ffffff';
			root.style.setProperty('--brand-primary', pColor);
			root.style.setProperty('--brand-secondary', sColor);
			root.style.setProperty('--brand-light-tint', lTint);
			root.style.setProperty('--brand-contrast-text', cText);
			root.style.setProperty('--color-primary', pColor);
			root.style.setProperty('--color-secondary', sColor);
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
