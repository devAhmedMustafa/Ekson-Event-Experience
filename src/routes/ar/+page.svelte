<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { page } from "$app/state";
    import * as THREE from "three";
    import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";
    import { brand } from "$lib/brand.svelte";
    import { MERCH, createMerchModel, type MerchItem } from "$lib/three/merch";
    import { getLogoImage, logoTexture } from "$lib/three/logo-texture";
    import { envFor, contactShadow, disposeObject } from "$lib/three/env";
    import { QUALITY } from "$lib/three/quality";
    import favicon from "$lib/assets/favicon.svg";

    let containerEl = $state<HTMLElement | null>(null);
    let canvasEl = $state<HTMLCanvasElement | null>(null);
    let videoEl = $state<HTMLVideoElement | null>(null);

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let pivot: THREE.Group | null = null;
    let activeModelGroup: THREE.Group | null = null;
    let shadowMesh: THREE.Mesh | null = null;
    let reticleMesh: THREE.Mesh | null = null;

    // Derived or URL parameters
    let displayName = $derived(page.url.searchParams.get("name") || brand.name || "Ekson");
    let displayColor = $derived(page.url.searchParams.get("color") || brand.primaryColor || "#009dd6");
    let displayDark = $derived(page.url.searchParams.get("dark") || brand.darkColor || "#04547c");

    // Selected Merch Model
    const urlModel = page.url.searchParams.get("m") || page.url.searchParams.get("model") || "mug";
    let selectedModelId = $state(MERCH.some((m) => m.id === urlModel) ? urlModel : "mug");
    let selectedItem = $derived(MERCH.find((m) => m.id === selectedModelId) || MERCH[0]);

    // AR State & Capabilities
    let isWebXRSupported = $state(false);
    let isIOS = $state(false);
    let isQuickLookSupported = $state(false);
    let isARActive = $state(false);
    let isCameraFeedActive = $state(false);
    let isPreparingUSDZ = $state(false);
    let isModelPlaced = $state(false);
    let arStatusHint = $state("Point camera at a flat surface (table or floor)");
    let cameraStream: MediaStream | null = null;
    let hitTestSource: any = null;
    let hitTestRequested = false;
    let xrPlaced = false;

    // In-Camera AR Placement State
    let customARScale = $state(1.0);
    let customARRotationY = $state(0);
    let customARPosX = $state(0);
    let customARPosY = $state(0);

    let autoRotate = $state(true);
    let isLoaded = $state(false);

    // Unified 3D Orbit Interaction State (Smooth, rock-solid camera rotation around fixed origin)
    let spin = -0.5;
    let targetSpin = -0.5;
    let tilt = -0.1;
    let targetTilt = -0.1;
    let zoomLevel = 1.0;
    let targetZoom = 1.0;

    // Pointer Tracking
    const activePointers = new Map<number, { x: number; y: number }>();
    let isDragging = false;
    let lastSingleX = 0;
    let lastSingleY = 0;

    // Pinch tracking
    let pinchStartDist = 0;
    let pinchStartAngle = 0;
    let initialZoomOnPinch = 1.0;
    let initialScaleOnPinch = 1.0;
    let initialRotOnPinch = 0;

    let logoImg: HTMLImageElement | null = null;
    let logoMap: THREE.Texture | null = null;

    async function loadModel(modelId: string) {
        if (!scene || !pivot || !camera) return;

        if (activeModelGroup) {
            pivot.remove(activeModelGroup);
            disposeObject(activeModelGroup);
            activeModelGroup = null;
        }
        if (shadowMesh) {
            pivot.remove(shadowMesh);
            disposeObject(shadowMesh);
            shadowMesh = null;
        }

        selectedModelId = modelId;

        // Build Merch Model with Brand Logo and Accent
        activeModelGroup = createMerchModel(modelId, {
            logoMap,
            logoImage: logoImg,
            accent: displayColor
        });

        const focus = activeModelGroup.userData.focus || {
            center: new THREE.Vector3(0, 0.05, 0),
            radius: 0.12
        };

        activeModelGroup.position.y = -focus.center.y;
        pivot.add(activeModelGroup);

        // Ground Contact Shadow
        shadowMesh = contactShadow(focus.radius * 1.8, 0.38);
        shadowMesh.position.y = -focus.center.y - 0.002;
        pivot.add(shadowMesh);

        targetZoom = 1.0;
        zoomLevel = 1.0;
        targetTilt = -0.1;
        tilt = -0.1;
    }

    function selectModel(modelId: string) {
        selectedModelId = modelId;
        loadModel(modelId);
        if (typeof window !== "undefined" && window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.set("m", modelId);
            window.history.replaceState({}, "", url.toString());
        }
    }

    function resetCamera() {
        targetSpin = -0.5;
        spin = -0.5;
        targetTilt = -0.1;
        tilt = -0.1;
        targetZoom = 1.0;
        zoomLevel = 1.0;
        customARScale = 1.0;
        customARPosX = 0;
        customARPosY = 0;
        customARRotationY = 0;
    }

    async function detectARCapabilities() {
        if (typeof window === "undefined" || typeof navigator === "undefined") return;

        isIOS =
            /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

        try {
            if ((navigator as any).xr) {
                isWebXRSupported = Boolean(await (navigator as any).xr.isSessionSupported("immersive-ar"));
            }
        } catch (e) {
            isWebXRSupported = false;
        }

        isQuickLookSupported = isIOS;
    }

    // 1. Launch WebXR Immersive AR (Android Chrome / WebXR with Surface Hit-Testing)
    async function startWebXR() {
        if (!renderer || !(navigator as any).xr) return;
        try {
            const session = await (navigator as any).xr.requestSession("immersive-ar", {
                requiredFeatures: ["hit-test"],
                optionalFeatures: ["dom-overlay", "light-estimation"],
                domOverlay: { root: containerEl || document.body }
            });

            isARActive = true;
            xrPlaced = false;
            isModelPlaced = false;
            hitTestRequested = false;
            arStatusHint = "Move camera slowly to detect table or floor…";

            session.addEventListener("select", onXRSelect);
            session.addEventListener("end", () => {
                isARActive = false;
                xrPlaced = false;
                isModelPlaced = false;
                hitTestSource = null;
                hitTestRequested = false;
                if (reticleMesh) reticleMesh.visible = false;
                if (pivot) {
                    pivot.visible = true;
                    pivot.position.set(0, 0, 0);
                    pivot.scale.set(1, 1, 1);
                }
            });

            await renderer.xr.setSession(session);
        } catch (err) {
            console.warn("WebXR request failed, falling back to camera stream:", err);
            startInBrowserCameraAR();
        }
    }

    function onXRSelect() {
        if (!renderer?.xr.isPresenting || !reticleMesh?.visible || !pivot) return;
        pivot.position.setFromMatrixPosition(reticleMesh.matrix);
        pivot.rotation.y = 0;
        pivot.visible = true;
        xrPlaced = true;
        isModelPlaced = true;
        reticleMesh.visible = false;
        arStatusHint = "Model placed in 1:1 scale! Walk around to inspect.";
        try {
            if (navigator.vibrate) navigator.vibrate(40);
        } catch (_) {}
    }

    function handleXRFrame(frame: any) {
        if (!frame || !renderer) return;
        const session = renderer.xr.getSession();
        const refSpace = renderer.xr.getReferenceSpace();

        if (!hitTestRequested && session) {
            hitTestRequested = true;
            (session as any)
                .requestReferenceSpace("viewer")
                .then((viewerSpace: any) => (session as any).requestHitTestSource({ space: viewerSpace }))
                .then((source: any) => {
                    hitTestSource = source;
                })
                .catch((e: any) => console.warn("Hit test source error:", e));
        }

        if (hitTestSource && !xrPlaced && reticleMesh && refSpace) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
                const pose = hitTestResults[0].getPose(refSpace);
                reticleMesh.visible = true;
                reticleMesh.matrix.fromArray(pose.transform.matrix);
                arStatusHint = "Surface detected! Tap anywhere to place.";
            } else {
                reticleMesh.visible = false;
                arStatusHint = "Scanning for surfaces… move camera across table/floor";
            }
        }
    }

    // 2. Launch iOS Quick Look (Apple Native ARKit LiDAR & Plane Detection via USDZ)
    async function startQuickLook() {
        if (!activeModelGroup) return;
        isPreparingUSDZ = true;
        try {
            const exporter = new USDZExporter();
            const exportScene = new THREE.Scene();
            const clone = activeModelGroup.clone(true);
            clone.position.set(0, 0, 0);
            exportScene.add(clone);

            const arrayBuffer = await (exporter as any).parseAsync(exportScene);
            const blob = new Blob([arrayBuffer], { type: "model/vnd.usdz+zip" });
            const usdzUrl = URL.createObjectURL(blob);

            const anchor = document.createElement("a");
            anchor.setAttribute("rel", "ar");
            // #allowsContentScaling=0 locks 1:1 physical real-world scale in Apple ARKit Quick Look
            anchor.href = `${usdzUrl}#allowsContentScaling=0`;

            const img = document.createElement("img");
            img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
            img.style.display = "none";
            anchor.append(img);
            document.body.append(anchor);
            anchor.click();
            setTimeout(() => {
                anchor.remove();
                URL.revokeObjectURL(usdzUrl);
            }, 3000);
        } catch (err) {
            console.error("USDZ export failed:", err);
            startInBrowserCameraAR();
        } finally {
            isPreparingUSDZ = false;
        }
    }

    // 3. Launch In-Browser WebAR Camera Passthrough (Universal Mobile & Desktop Fallback)
    async function startInBrowserCameraAR() {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            if (videoEl) {
                videoEl.srcObject = cameraStream;
                await videoEl.play();
            }
            isCameraFeedActive = true;
            isARActive = true;
            isModelPlaced = true;
            if (scene) scene.background = null;
            arStatusHint = "Drag to move · Pinch to scale · 2 fingers to rotate";
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Camera access is needed for live AR placement. Please enable camera permissions in your browser.");
        }
    }

    function stopInBrowserCameraAR() {
        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => track.stop());
            cameraStream = null;
        }
        if (videoEl) {
            videoEl.srcObject = null;
        }
        isCameraFeedActive = false;
        isARActive = false;
        isModelPlaced = false;
        if (scene) scene.background = new THREE.Color("#0b0f17");
        customARScale = 1.0;
        customARRotationY = 0;
        customARPosX = 0;
        customARPosY = 0;
        resetCamera();
    }

    function triggerPrimaryAR() {
        if (isWebXRSupported) {
            startWebXR();
        } else if (isQuickLookSupported) {
            startQuickLook();
        } else {
            startInBrowserCameraAR();
        }
    }

    /* ── Rock-Solid Unified Pointer Controls ────────────────────────── */

    function getPinchMetrics(): { dist: number; angle: number } | null {
        if (activePointers.size < 2) return null;
        const pts = Array.from(activePointers.values());
        const dx = pts[1].x - pts[0].x;
        const dy = pts[1].y - pts[0].y;
        return {
            dist: Math.hypot(dx, dy),
            angle: Math.atan2(dy, dx)
        };
    }

    function onPointerDown(e: PointerEvent) {
        if (!containerEl) return;
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        containerEl.setPointerCapture?.(e.pointerId);

        if (activePointers.size === 1) {
            isDragging = true;
            lastSingleX = e.clientX;
            lastSingleY = e.clientY;
        } else if (activePointers.size === 2) {
            // Cancel 1-finger orbit/move when 2 fingers touch
            isDragging = false;
            const pinch = getPinchMetrics();
            if (pinch) {
                pinchStartDist = pinch.dist;
                pinchStartAngle = pinch.angle;
                initialZoomOnPinch = targetZoom;
                initialScaleOnPinch = customARScale;
                initialRotOnPinch = customARRotationY;
            }
        }
    }

    function onPointerMove(e: PointerEvent) {
        if (!activePointers.has(e.pointerId)) return;
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (activePointers.size === 1 && isDragging) {
            const dx = e.clientX - lastSingleX;
            const dy = e.clientY - lastSingleY;
            lastSingleX = e.clientX;
            lastSingleY = e.clientY;

            if (isCameraFeedActive) {
                // In Camera AR: 1 finger smoothly translates in screen space
                customARPosX += dx * 0.0012;
                customARPosY -= dy * 0.0012;
            } else {
                // In 3D Studio: 1 finger smoothly spins and tilts the view around the fixed model
                targetSpin += dx * 0.012;
                targetTilt = Math.max(-1.1, Math.min(0.9, targetTilt + dy * 0.008));
            }
        } else if (activePointers.size === 2) {
            const pinch = getPinchMetrics();
            if (pinch && pinchStartDist > 0) {
                const scaleRatio = pinch.dist / pinchStartDist;
                if (isCameraFeedActive) {
                    // In Camera AR: 2-finger pinch scales and 2-finger twist rotates
                    customARScale = Math.max(0.2, Math.min(4.0, initialScaleOnPinch * scaleRatio));
                    const angleDiff = pinch.angle - pinchStartAngle;
                    customARRotationY = initialRotOnPinch + angleDiff;
                } else {
                    // In 3D Studio: 2-finger pinch smoothly zooms without moving or glitching object
                    targetZoom = Math.max(0.5, Math.min(2.8, initialZoomOnPinch * (pinchStartDist / pinch.dist)));
                }
            }
        }
    }

    function onPointerUp(e: PointerEvent) {
        activePointers.delete(e.pointerId);
        try {
            containerEl?.releasePointerCapture?.(e.pointerId);
        } catch (_) {}

        if (activePointers.size === 1) {
            // Seamlessly resume 1-finger drag from the remaining finger's position
            isDragging = true;
            const remaining = Array.from(activePointers.values())[0];
            lastSingleX = remaining.x;
            lastSingleY = remaining.y;
        } else if (activePointers.size === 0) {
            isDragging = false;
        }
    }

    function onWheel(e: WheelEvent) {
        e.preventDefault();
        if (isCameraFeedActive) {
            customARScale = Math.max(0.2, Math.min(4.0, customARScale - Math.sign(e.deltaY) * 0.08));
        } else {
            targetZoom = Math.max(0.5, Math.min(2.8, targetZoom + Math.sign(e.deltaY) * 0.08));
        }
    }

    /* ── Scene Initialization ────────────────────────────────────────── */

    async function initScene() {
        if (typeof window === "undefined" || !canvasEl || !containerEl) return;
        cleanupScene();

        const w = containerEl.clientWidth;
        const h = containerEl.clientHeight;

        scene = new THREE.Scene();
        scene.background = new THREE.Color("#0b0f17");

        camera = new THREE.PerspectiveCamera(32, w / h, 0.01, 20);
        camera.position.set(0, 0.2, 0.6);

        renderer = new THREE.WebGLRenderer({
            canvas: canvasEl,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.xr.enabled = true;

        // PMREM Environment Image-Based Lighting
        try {
            const env = await envFor(renderer);
            scene.environment = env;
            scene.environmentIntensity = QUALITY.envMapIntensity * 0.9;
        } catch (e) {
            console.warn("PMREM environment fallback:", e);
        }

        // 3-Point Studio Product Lighting Rig
        const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.0);
        keyLight.position.set(1.2, 2.0, 1.5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.bias = -0.0003;
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xdee8ff, 0.85);
        fillLight.position.set(-1.8, 1.2, -1.0);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(new THREE.Color(displayColor), 1.2);
        rimLight.position.set(0, 1.8, -1.6);
        scene.add(rimLight);

        const hemiLight = new THREE.HemisphereLight(0xf4f7fd, 0x1f242e, 0.55);
        scene.add(hemiLight);

        // Pivot Root
        pivot = new THREE.Group();
        pivot.name = "merch_pivot";
        scene.add(pivot);

        // High-Precision AR Surface Hit-Test Reticle
        const reticleGroup = new THREE.Group();
        const outerRing = new THREE.Mesh(
            new THREE.RingGeometry(0.045, 0.06, 32).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(displayColor), side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
        );
        const innerDot = new THREE.Mesh(
            new THREE.CircleGeometry(0.012, 16).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffffff"), side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
        );
        reticleGroup.add(outerRing, innerDot);
        reticleGroup.matrixAutoUpdate = false;
        reticleGroup.visible = false;
        reticleMesh = reticleGroup as any;
        scene.add(reticleGroup);

        // Logo Texture Generation
        try {
            logoImg = await getLogoImage();
            logoMap = logoTexture(logoImg, { padding: 0.08 });
        } catch (err) {
            console.warn("Logo texture generation fallback:", err);
            logoMap = logoTexture(null, { padding: 0.08 });
        }

        await loadModel(selectedModelId);
        await detectARCapabilities();

        // Event listeners (Pointer and Wheel on container only - zero duplicate touch events)
        window.addEventListener("resize", handleResize);
        containerEl.addEventListener("pointerdown", onPointerDown);
        containerEl.addEventListener("pointermove", onPointerMove);
        containerEl.addEventListener("pointerup", onPointerUp);
        containerEl.addEventListener("pointercancel", onPointerUp);
        containerEl.addEventListener("wheel", onWheel, { passive: false });

        isLoaded = true;

        const clock = new THREE.Clock();

        // Render Loop
        renderer.setAnimationLoop((timestamp, frame) => {
            const dt = Math.min(0.05, clock.getDelta());

            if (renderer?.xr.isPresenting) {
                handleXRFrame(frame);
            } else if (isCameraFeedActive) {
                // In-Camera AR mode: update model position/rotation from touch gestures
                if (pivot) {
                    pivot.position.set(customARPosX, customARPosY, -0.6);
                    pivot.rotation.y = customARRotationY;
                    pivot.scale.setScalar(customARScale);
                }
                if (camera) {
                    camera.position.set(0, 0, 0);
                    camera.lookAt(0, 0, -1);
                }
            } else {
                // Standard 3D Studio mode: smooth orbital camera around firmly anchored model
                if (!isDragging && autoRotate) {
                    targetSpin += dt * 0.4;
                }
                spin += (targetSpin - spin) * Math.min(1, dt * 8);
                tilt += (targetTilt - tilt) * Math.min(1, dt * 8);
                zoomLevel += (targetZoom - zoomLevel) * Math.min(1, dt * 8);

                const focus = activeModelGroup?.userData.focus || { center: new THREE.Vector3(0, 0.05, 0), radius: 0.12 };
                const dist = focus.radius * 4.4;

                if (pivot) {
                    pivot.rotation.y = spin;
                    pivot.position.set(0, 0, 0);
                    pivot.scale.set(1, 1, 1);
                }
                if (camera) {
                    camera.position.set(0, focus.radius * (1.0 - tilt * 1.3) * zoomLevel, dist * zoomLevel);
                    camera.lookAt(0, 0, 0);
                }
            }

            if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }
        });
    }

    function handleResize() {
        if (!containerEl || !renderer || !camera) return;
        const w = containerEl.clientWidth;
        const h = containerEl.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }

    function cleanupScene() {
        if (typeof window === "undefined") return;
        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => track.stop());
            cameraStream = null;
        }
        window.removeEventListener("resize", handleResize);
        if (containerEl) {
            containerEl.removeEventListener("pointerdown", onPointerDown);
            containerEl.removeEventListener("pointermove", onPointerMove);
            containerEl.removeEventListener("pointerup", onPointerUp);
            containerEl.removeEventListener("pointercancel", onPointerUp);
            containerEl.removeEventListener("wheel", onWheel);
        }
        if (scene) disposeObject(scene);
        renderer?.dispose();
    }

    onMount(() => {
        initScene();
    });

    onDestroy(() => {
        cleanupScene();
    });
</script>

<svelte:head>
    <title>{displayName} · {selectedItem.name} AR Experience</title>
    <link rel="icon" href={favicon} />
</svelte:head>

<div class="fixed inset-0 w-full h-full bg-slate-950 text-white flex flex-col justify-between select-none font-sans overflow-hidden">
    <!-- Camera Video Element for Live WebAR Passthrough -->
    <video
        bind:this={videoEl}
        playsinline
        autoplay
        muted
        class="absolute inset-0 w-full h-full object-cover z-0 {isCameraFeedActive ? 'block' : 'hidden'}"
    ></video>

    <!-- Top Header & Model Switcher Bar -->
    <header class="relative z-20 w-full px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-col gap-2 border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5 sm:gap-3">
                <a
                    href="/"
                    class="size-8 sm:size-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/15 cursor-pointer shrink-0"
                    title="Back to Catalog"
                >
                    <span class="material-symbols-rounded text-base sm:text-lg">arrow_back</span>
                </a>

                <div class="flex flex-col">
                    <div class="flex items-center gap-1.5 font-mono text-[8px] sm:text-[9px] uppercase tracking-wider text-white/60 font-bold">
                        <span class="size-1.5 rounded-full" style="background-color: {displayColor};"></span>
                        <span>Augmented Reality · 1:1 Metric Scale</span>
                    </div>
                    <h1 class="text-xs sm:text-sm md:text-base font-black uppercase text-white tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
                        <span>{displayName} {selectedItem.name}</span>
                        {#if isARActive}
                            <span class="px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                                AR ACTIVE
                            </span>
                        {:else}
                            <span class="px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-mono font-bold uppercase border shrink-0" style="background-color: {displayColor}25; border-color: {displayColor}; color: {displayColor};">
                                3D Studio
                            </span>
                        {/if}
                    </h1>
                </div>
            </div>

            <div class="flex items-center gap-1.5 sm:gap-2">
                {#if isCameraFeedActive}
                    <button
                        onclick={stopInBrowserCameraAR}
                        class="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[9px] sm:text-[10px] font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer shadow-md"
                    >
                        <span class="material-symbols-rounded text-xs sm:text-sm">close</span>
                        <span>Exit AR</span>
                    </button>
                {:else}
                    <!-- Auto Rotate Toggle -->
                    <button
                        onclick={() => (autoRotate = !autoRotate)}
                        class="px-2.5 sm:px-3 py-1.5 rounded-xl border text-[9px] sm:text-[10px] font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer {autoRotate ? 'bg-white/15 text-white border-white/30' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}"
                        title="Toggle Auto Rotation"
                    >
                        <span class="material-symbols-rounded text-xs sm:text-sm {autoRotate ? 'animate-spin' : ''}">rotate_right</span>
                        <span class="hidden sm:inline">Rotate</span>
                    </button>

                    <!-- Reset Camera View -->
                    <button
                        onclick={resetCamera}
                        class="px-2.5 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/15 text-[9px] sm:text-[10px] font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                        title="Reset Camera View"
                    >
                        <span class="material-symbols-rounded text-xs sm:text-sm">restart_alt</span>
                        <span class="hidden sm:inline">Reset</span>
                    </button>
                {/if}
            </div>
        </div>

        <!-- 4 Merch Model Selector Tabs -->
        <div class="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {#each MERCH as item}
                <button
                    onclick={() => selectModel(item.id)}
                    class="px-2.5 sm:px-3.5 py-1 rounded-xl text-[9px] sm:text-[10px] font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer shrink-0 border {selectedModelId === item.id ? 'text-white shadow-sm ring-1' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'}"
                    style="{selectedModelId === item.id ? `background-color: ${displayColor}; border-color: ${displayColor}; ring-color: ${displayColor};` : ''}"
                >
                    <span class="material-symbols-rounded text-[13px] sm:text-[14px]">
                        {item.id === 'mug' ? 'coffee' : item.id === 'pen' ? 'edit' : item.id === 'notebook' ? 'menu_book' : 'shopping_bag'}
                    </span>
                    <span>{item.name}</span>
                </button>
            {/each}
        </div>
    </header>

    <!-- Center 3D & AR Interactive Viewport -->
    <main
        bind:this={containerEl}
        class="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden touch-none cursor-grab active:cursor-grabbing z-10 select-none"
    >
        <!-- WebGL Canvas -->
        <canvas bind:this={canvasEl} class="w-full h-full block outline-none"></canvas>

        {#if !isCameraFeedActive}
            <!-- Dynamic Hologram Ambient Ring -->
            <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div class="size-80 sm:size-112 rounded-full border border-dashed border-white/10 animate-spin-slow opacity-40"></div>
            </div>
        {/if}

        <!-- Top Status & Surface Detection Hint Overlay -->
        {#if isLoaded}
            <div class="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-10 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-[9px] sm:text-[10px] font-mono text-white shadow-lg flex items-center gap-1.5 sm:gap-2">
                <span class="material-symbols-rounded text-sm" style="color: {displayColor};">
                    {isARActive ? (isModelPlaced ? 'check_circle' : 'search') : 'touch_app'}
                </span>
                <span>{isARActive ? arStatusHint : 'Drag to rotate · Pinch/scroll to zoom'}</span>
            </div>
        {/if}
    </main>

    <!-- Bottom AR Action Bar & Model Specs -->
    <footer class="relative z-20 w-full px-3 sm:px-6 py-3 bg-slate-900/95 backdrop-blur-md border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
        <!-- Model Info & Physical Metric Scale -->
        <div class="flex items-center gap-2.5 w-full sm:w-auto">
            <div class="flex items-center gap-1.5">
                <span class="size-2 rounded-full" style="background-color: {displayColor};"></span>
                <span class="text-[10px] sm:text-xs font-bold text-white uppercase">{selectedItem.name}</span>
            </div>
            <span class="text-[8px] sm:text-[9px] text-white/60 truncate max-w-[200px] sm:max-w-none">{selectedItem.blurb}</span>
        </div>

        <!-- Big Launch AR Button with Native Surface Detection -->
        <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            {#if isCameraFeedActive}
                <button
                    onclick={() => {
                        customARScale = 1.0;
                        customARPosX = 0;
                        customARPosY = 0;
                        customARRotationY = 0;
                    }}
                    class="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 text-[10px] font-bold uppercase transition flex items-center gap-1.5 cursor-pointer"
                >
                    <span class="material-symbols-rounded text-sm">restart_alt</span>
                    <span>Re-Center</span>
                </button>
            {:else}
                <button
                    onclick={triggerPrimaryAR}
                    disabled={isPreparingUSDZ}
                    class="w-full sm:w-auto px-5 py-2.5 text-white font-bold text-xs uppercase rounded-xl shadow-lg transition hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-white/20"
                    style="background-color: {displayColor};"
                >
                    {#if isPreparingUSDZ}
                        <span class="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Preparing AR Model…</span>
                    {:else}
                        <span class="material-symbols-rounded text-base">view_in_ar</span>
                        <span>
                            {isWebXRSupported ? 'View in your space (WebXR Surface SLAM)' : isQuickLookSupported ? 'View in Quick Look (iOS ARKit)' : 'Launch Live Camera AR'}
                        </span>
                    {/if}
                </button>
            {/if}
        </div>
    </footer>
</div>

<style>
    @keyframes spinSlow {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
    .animate-spin-slow {
        animation: spinSlow 30s linear infinite;
    }
</style>
