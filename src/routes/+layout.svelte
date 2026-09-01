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
			root.style.setProperty('--brand-primary', '#ffa349');
			root.style.setProperty('--brand-secondary', '#f06f42');
			root.style.setProperty('--brand-light-tint', 'rgba(255, 163, 73, 0.12)');
			root.style.setProperty('--brand-contrast-text', '#ffffff');
			root.style.setProperty('--color-primary', '#ffa349');
			root.style.setProperty('--color-secondary', '#f06f42');
			if (brand.primaryColor) {
				root.style.setProperty('--user-brand-primary', brand.primaryColor);
			}
			if (brand.darkColor) {
				root.style.setProperty('--user-brand-secondary', brand.darkColor);
			}
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
