<script module lang="ts">
	import type { Snippet } from 'svelte';
	export type CardSwapItem = { content: Snippet; class?: string; style?: string };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { brand } from '$lib/brand.svelte';

	type Props = {
		cards: CardSwapItem[];
		width?: number | string;
		height?: number | string;
		cardDistance?: number;
		verticalDistance?: number;
		delay?: number;
		pauseOnHover?: boolean;
		onCardClick?: (idx: number) => void;
		skewAmount?: number;
		easing?: 'linear' | 'elastic';
	};

	let {
		cards,
		width = 500,
		height = 400,
		cardDistance = 60,
		verticalDistance = 70,
		delay = 5000,
		pauseOnHover = false,
		onCardClick,
		skewAmount = 6,
		easing = 'elastic'
	}: Props = $props();

	const config = $derived(
		easing === 'elastic'
			? { ease: 'elastic.out(0.6,0.9)', durDrop: 2, durMove: 2, durReturn: 2, promoteOverlap: 0.9, returnDelay: 0.05 }
			: { ease: 'power1.inOut', durDrop: 0.8, durMove: 0.8, durReturn: 0.8, promoteOverlap: 0.45, returnDelay: 0.2 }
	);

	const cardEls: HTMLDivElement[] = [];
	let containerRef: HTMLDivElement;

	type Slot = { x: number; y: number; z: number; zIndex: number };
	function makeSlot(i: number, distX: number, distY: number, total: number): Slot {
		return { x: i * distX, y: -i * distY, z: -i * distX * 1.5, zIndex: total - i };
	}
	function placeNow(el: HTMLElement, slot: Slot, skew: number) {
		gsap.set(el, {
			x: slot.x, y: slot.y, z: slot.z,
			xPercent: -50, yPercent: -50,
			skewY: skew, transformOrigin: 'center center',
			zIndex: slot.zIndex, force3D: true
		});
	}

	const wStyle = $derived(typeof width === 'number' ? `${width}px` : width);
	const hStyle = $derived(typeof height === 'number' ? `${height}px` : height);

	let isAutoPlaying = $state(true);
	let activeCardIndex = $state(0);
	let swapFn = $state<(() => void) | null>(null);
	let prevFn = $state<(() => void) | null>(null);
	let toggleAutoFn = $state<(() => void) | null>(null);

	onMount(() => {
		const total = cards.length;
		const order: number[] = Array.from({ length: total }, (_, i) => i);
		let tlRef: gsap.core.Timeline | null = null;
		let intervalId = 0;
		let isAnimating = false;

		cardEls.forEach((el, i) => placeNow(el, makeSlot(i, cardDistance, verticalDistance, total), skewAmount));

		function swapNext(isManual = false) {
			if (isAnimating || order.length < 2) return;
			isAnimating = true;

			const dur = isManual ? 0.45 : config.durDrop;
			const ease = isManual ? 'power2.out' : config.ease;

			const front = order[0];
			const rest = order.slice(1);
			const elFront = cardEls[front];
			const tl = gsap.timeline({
				onComplete: () => {
					order.splice(0, order.length, ...rest, front);
					activeCardIndex = order[0];
					isAnimating = false;
				}
			});
			tlRef = tl;

			// 1. Drop front card down
			tl.to(elFront, { y: '+=350', opacity: 0.8, duration: dur * 0.5, ease: ease });

			// 2. Promote rest of cards up 1 slot concurrently
			rest.forEach((idx, i) => {
				const el = cardEls[idx];
				const slot = makeSlot(i, cardDistance, verticalDistance, total);
				tl.to(el, {
					x: slot.x,
					y: slot.y,
					z: slot.z,
					skewY: skewAmount,
					zIndex: slot.zIndex,
					duration: dur * 0.5,
					ease: ease
				}, 0.05);
			});

			// 3. Move front card to back slot
			const backSlot = makeSlot(total - 1, cardDistance, verticalDistance, total);
			tl.set(elFront, { zIndex: backSlot.zIndex });
			tl.to(elFront, {
				x: backSlot.x,
				y: backSlot.y,
				z: backSlot.z,
				opacity: 1,
				duration: dur * 0.45,
				ease: ease
			});
		}

		function swapPrev(isManual = false) {
			if (isAnimating || order.length < 2) return;
			isAnimating = true;

			const dur = isManual ? 0.45 : config.durDrop;
			const ease = isManual ? 'power2.out' : config.ease;

			const back = order[order.length - 1];
			const rest = order.slice(0, order.length - 1);
			const elBack = cardEls[back];
			const tl = gsap.timeline({
				onComplete: () => {
					order.splice(0, order.length, back, ...rest);
					activeCardIndex = order[0];
					isAnimating = false;
				}
			});
			tlRef = tl;

			// 1. Shift rest of cards back 1 slot concurrently
			rest.forEach((idx, i) => {
				const el = cardEls[idx];
				const slot = makeSlot(i + 1, cardDistance, verticalDistance, total);
				tl.to(el, {
					x: slot.x,
					y: slot.y,
					z: slot.z,
					skewY: skewAmount,
					zIndex: slot.zIndex,
					duration: dur * 0.5,
					ease: ease
				}, 0);
			});

			// 2. Slide back card out and bring it straight to front slot
			const frontSlot = makeSlot(0, cardDistance, verticalDistance, total);
			tl.to(elBack, { y: '+=350', opacity: 0.8, duration: dur * 0.45, ease: ease }, 0);
			tl.set(elBack, { zIndex: total + 2 });
			tl.to(elBack, {
				x: frontSlot.x,
				y: frontSlot.y,
				z: frontSlot.z,
				opacity: 1,
				duration: dur * 0.5,
				ease: ease
			});
		}

		function startAutoTimer() {
			clearInterval(intervalId);
			if (isAutoPlaying) {
				intervalId = window.setInterval(() => swapNext(false), delay);
			}
		}

		swapFn = () => {
			swapNext(true);
			startAutoTimer();
		};

		prevFn = () => {
			swapPrev(true);
			startAutoTimer();
		};

		toggleAutoFn = () => {
			isAutoPlaying = !isAutoPlaying;
			if (isAutoPlaying) {
				startAutoTimer();
			} else {
				clearInterval(intervalId);
			}
		};

		swapNext();
		startAutoTimer();

		const node = containerRef;
		const pause = () => { tlRef?.pause(); clearInterval(intervalId); };
		const resume = () => { if (isAutoPlaying) { tlRef?.play(); startAutoTimer(); } };
		if (pauseOnHover && node) {
			node.addEventListener('mouseenter', pause);
			node.addEventListener('mouseleave', resume);
		}
		return () => {
			clearInterval(intervalId);
			if (pauseOnHover && node) {
				node.removeEventListener('mouseenter', pause);
				node.removeEventListener('mouseleave', resume);
			}
		};
	});
</script>

<div class="relative w-full h-full flex flex-col items-center ">
	<div
		bind:this={containerRef}
		class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-center overflow-visible pointer-events-auto"
		style="width:{wStyle};height:{hStyle};perspective:900px;"
	>
		{#each cards as card, i (i)}
			<div
				bind:this={cardEls[i]}
				class="absolute top-1/2 left-1/2 rounded-3xl border border-white/20 shadow-2xl overflow-hidden transform-3d will-change-transform backface-hidden cursor-pointer {card.class ?? ''}"
				style="width:{wStyle};height:{hStyle};{card.style ?? ''}"
				onclick={() => onCardClick?.(i)}
				role="button"
				tabindex="0"
				onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCardClick?.(i); } }}
			>
				{@render card.content()}
			</div>
		{/each}
	</div>

	<!-- Floating Glass Control Toolbar for Manual Swiping -->
	<div class="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/65 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-black/10 shadow-lg z-30 pointer-events-auto select-none">
		<!-- Previous Card Button -->
		<button
			onclick={() => prevFn?.()}
			class="size-8 rounded-full bg-black/10 hover:bg-black/10 flex items-center justify-center transition cursor-pointer text-text hover:scale-105 active:scale-95"
			title="Previous VR Game Card"
			aria-label="Previous Card"
		>
			<span class="material-symbols-rounded text-lg">chevron_left</span>
		</button>

		<!-- Toggle Auto-Rotate Button -->
		<button
			onclick={() => toggleAutoFn?.()}
			class="size-8 rounded-full flex items-center justify-center transition cursor-pointer shadow-xs hover:scale-105 active:scale-95"
			style="background-color: {brand.primaryColor};"
			title={isAutoPlaying ? "Pause Auto-Rotation" : "Start Auto-Rotation"}
			aria-label="Toggle Auto-Rotation"
		>
			<span class="material-symbols-rounded text-base">
				{isAutoPlaying ? 'pause' : 'play_arrow'}
			</span>
		</button>

		<!-- Next Card Button -->
		<button
			onclick={() => swapFn?.()}
			class="size-8 rounded-full bg-black/10 hover:bg-black/10 flex items-center justify-center transition cursor-pointer text-text hover:scale-105 active:scale-95"
			title="Next VR Game Card"
			aria-label="Next Card"
		>
			<span class="material-symbols-rounded text-lg">chevron_right</span>
		</button>

		<!-- Card Indicator Dots -->
		<div class="flex items-center gap-1.5 pl-1.5 ml-1 border-l border-black/10">
			{#each cards as _, idx}
				<button
					onclick={() => {
						if (idx !== activeCardIndex) swapFn?.();
					}}
					class="size-2 rounded-full transition-all duration-300 cursor-pointer {idx === activeCardIndex ? 'w-4 bg-primary' : 'bg-black/20 hover:bg-black/40'}"
					style={idx === activeCardIndex ? `background-color: ${brand.primaryColor};` : ''}
					title="Jump to Card {idx + 1}"
					aria-label="Jump to Card {idx + 1}"
				></button>
			{/each}
		</div>
	</div>
</div>
