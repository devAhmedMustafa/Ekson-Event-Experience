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
			const p = brand.primaryColor || '#009dd6';
			const s = brand.darkColor || '#04547c';
			const t = brand.lightTint || 'rgba(0, 157, 214, 0.12)';
			const c = brand.contrastText || '#ffffff';

			root.style.setProperty('--brand-primary', p);
			root.style.setProperty('--brand-secondary', s);
			root.style.setProperty('--brand-light-tint', t);
			root.style.setProperty('--brand-contrast-text', c);
			root.style.setProperty('--color-primary', p);
			root.style.setProperty('--color-secondary', s);
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
