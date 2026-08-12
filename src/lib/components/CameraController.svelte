<script lang="ts">
    import { useThrelte, useTask } from "@threlte/core";
    import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
    import * as THREE from "three";
    import { onMount, onDestroy } from "svelte";

    type Props = {
        autoRotate?: boolean;
        targetPos?: [number, number, number] | null;
        targetLookAt?: [number, number, number] | null;
        onUserInteraction?: () => void;
    };

    let {
        autoRotate = true,
        targetPos = null,
        targetLookAt = null,
        onUserInteraction
    }: Props = $props();

    const { camera, renderer } = useThrelte();

    let controls: OrbitControls | null = null;
    let transitionProgress = 1.0;
    const fromPos = new THREE.Vector3();
    const toPos = new THREE.Vector3();
    const fromTarget = new THREE.Vector3();
    const toTarget = new THREE.Vector3();

    $effect(() => {
        if (targetPos && controls && camera.current) {
            fromPos.copy(camera.current.position);
            toPos.set(targetPos[0], targetPos[1], targetPos[2]);
            fromTarget.copy(controls.target);
            if (targetLookAt) {
                toTarget.set(targetLookAt[0], targetLookAt[1], targetLookAt[2]);
            } else {
                toTarget.set(0, 0.7, 0);
            }
            transitionProgress = 0.0;
        }
    });

    onMount(() => {
        if (!camera.current || !renderer) return;
        controls = new OrbitControls(camera.current, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 1.2;
        controls.maxPolarAngle = Math.PI / 2 + 0.05;
        controls.minDistance = 2.0;
        controls.maxDistance = 14.0;
        controls.target.set(0, 0.7, 0);
        controls.update();

        controls.addEventListener("start", () => {
            transitionProgress = 1.0;
            onUserInteraction?.();
        });
    });

    useTask((delta) => {
        if (!controls || !camera.current) return;

        if (transitionProgress < 1.0) {
            transitionProgress = Math.min(1.0, transitionProgress + delta * 2.2);
            const ease = 0.5 - Math.cos(transitionProgress * Math.PI) / 2;
            camera.current.position.lerpVectors(fromPos, toPos, ease);
            controls.target.lerpVectors(fromTarget, toTarget, ease);
        }

        controls.autoRotate = autoRotate && transitionProgress >= 1.0;
        controls.update();
    });

    onDestroy(() => {
        controls?.dispose();
    });
</script>
