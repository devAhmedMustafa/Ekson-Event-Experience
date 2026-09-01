<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as THREE from "three";
    import { brand } from "$lib/brand.svelte";

    interface Props {
        onClose?: () => void;
        initialAR?: boolean;
    }

    let { onClose, initialAR = false }: Props = $props();

    let containerEl = $state<HTMLElement | null>(null);
    let canvasEl = $state<HTMLCanvasElement | null>(null);
    let videoEl = $state<HTMLVideoElement | null>(null);

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let mugGroup: THREE.Group | null = null;
    let animationFrameId: number | null = null;

    // AR State
    let isARActive = $state(false);
    let hasCamera = $state(false);
    let cameraStream: MediaStream | null = null;
    let arScale = 1.0;
    let arRotationY = 0;

    // Customization state
    let selectedFinish = $state<"white" | "black" | "brand">("white");
    let selectedLiquid = $state<"coffee" | "matcha" | "empty">("coffee");
    let autoRotate = $state(true);

    // Camera interaction state
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let cameraTheta = 0.4;
    let cameraPhi = 0.5;
    let cameraDistance = 2.4;

    // Touch interaction for AR placement
    let initialTouchDistance = 0;
    let initialTouchAngle = 0;

    // Materials
    let mugBodyMat: THREE.MeshPhysicalMaterial | null = null;
    let mugInsideMat: THREE.MeshPhysicalMaterial | null = null;
    let mugHandleMat: THREE.MeshPhysicalMaterial | null = null;
    let liquidMat: THREE.MeshStandardMaterial | null = null;
    let decalMat: THREE.MeshStandardMaterial | null = null;
    let shadowMesh: THREE.Mesh | null = null;
    let arReticleMesh: THREE.Mesh | null = null;

    function createMugDecalTexture(brandName: string, brandColor: string, logoUrl: string | null, finish: "white" | "black" | "brand"): Promise<THREE.CanvasTexture> {
        return new Promise((resolve) => {
            const canvas = document.createElement("canvas");
            canvas.width = 1024;
            canvas.height = 512;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                const tex = new THREE.CanvasTexture(canvas);
                resolve(tex);
                return;
            }

            // Fill background matching finish
            if (finish === "white") {
                ctx.fillStyle = "#f8fafc";
            } else if (finish === "black") {
                ctx.fillStyle = "#18181b";
            } else {
                ctx.fillStyle = brandColor || "#4abbff";
            }
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const textColor = finish === "black" ? "#ffffff" : finish === "brand" ? "#ffffff" : (brandColor || "#0f172a");

            const drawTextAndResolve = () => {
                // Brand Name
                ctx.fillStyle = textColor;
                ctx.font = "bold 52px 'Montserrat', sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(brandName.toUpperCase(), canvas.width / 2, canvas.height / 2 + 100);

                // Subtitle / Est tag
                ctx.fillStyle = finish === "black" ? brandColor || "#38bdf8" : finish === "brand" ? "#ffffffdd" : "#64748b";
                ctx.font = "bold 20px monospace";
                ctx.fillText("OFFICIAL EVENT MERCHANDISE", canvas.width / 2, canvas.height / 2 + 155);

                const texture = new THREE.CanvasTexture(canvas);
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.anisotropy = 8;
                resolve(texture);
            };

            if (logoUrl) {
                const img = new Image();
                if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
                    img.crossOrigin = "anonymous";
                }
                img.onload = () => {
                    // Draw Logo Centered above brand name
                    const logoSize = 160;
                    const logoX = (canvas.width - logoSize) / 2;
                    const logoY = canvas.height / 2 - 100;
                    ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
                    drawTextAndResolve();
                };
                img.onerror = () => {
                    // Draw geometric crest fallback
                    drawFallbackCrest(ctx, canvas.width / 2, canvas.height / 2 - 40, brandColor, finish);
                    drawTextAndResolve();
                };
                img.src = logoUrl;
            } else {
                drawFallbackCrest(ctx, canvas.width / 2, canvas.height / 2 - 40, brandColor, finish);
                drawTextAndResolve();
            }
        });
    }

    function drawFallbackCrest(ctx: CanvasRenderingContext2D, cx: number, cy: number, brandColor: string, finish: string) {
        ctx.fillStyle = finish === "brand" ? "#ffffff" : brandColor || "#4abbff";
        ctx.beginPath();
        ctx.arc(cx, cy, 45, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = finish === "brand" ? brandColor : "#ffffff";
        ctx.beginPath();
        ctx.moveTo(cx, cy - 25);
        ctx.lineTo(cx + 25, cy + 20);
        ctx.lineTo(cx - 25, cy + 20);
        ctx.closePath();
        ctx.fill();
    }

    async function buildMug(root: THREE.Group) {
        root.clear();

        const finishColor = selectedFinish === "white" ? "#f8fafc" : selectedFinish === "black" ? "#18181b" : (brand.primaryColor || "#4abbff");
        const roughness = selectedFinish === "black" ? 0.35 : 0.12;

        mugBodyMat = new THREE.MeshPhysicalMaterial({
            color: finishColor,
            roughness,
            metalness: 0.05,
            clearcoat: selectedFinish === "black" ? 0.2 : 1.0,
            clearcoatRoughness: 0.1
        });

        mugInsideMat = new THREE.MeshPhysicalMaterial({
            color: selectedFinish === "black" ? "#27272a" : "#ffffff",
            roughness: 0.15,
            metalness: 0.02,
            clearcoat: 0.8
        });

        mugHandleMat = new THREE.MeshPhysicalMaterial({
            color: finishColor,
            roughness,
            metalness: 0.05,
            clearcoat: 0.9
        });

        // 1. MUG MAIN CYLINDER BODY
        const outerGeo = new THREE.CylinderGeometry(0.42, 0.38, 0.95, 48, 1, true);
        const outerMesh = new THREE.Mesh(outerGeo, mugBodyMat);
        outerMesh.position.y = 0.475;
        outerMesh.castShadow = true;
        outerMesh.receiveShadow = true;
        root.add(outerMesh);

        // 2. MUG INSIDE CAVITY
        const innerGeo = new THREE.CylinderGeometry(0.38, 0.35, 0.90, 48, 1, false);
        const innerMesh = new THREE.Mesh(innerGeo, mugInsideMat);
        innerMesh.position.y = 0.50;
        root.add(innerMesh);

        // 3. MUG TOP RIM LIP
        const rimGeo = new THREE.RingGeometry(0.38, 0.42, 48);
        const rimMesh = new THREE.Mesh(rimGeo, mugBodyMat);
        rimMesh.rotation.x = -Math.PI / 2;
        rimMesh.position.y = 0.95;
        root.add(rimMesh);

        // 4. MUG BOTTOM BASE
        const baseGeo = new THREE.CircleGeometry(0.38, 48);
        const baseMesh = new THREE.Mesh(baseGeo, mugBodyMat);
        baseMesh.rotation.x = Math.PI / 2;
        baseMesh.position.y = 0.002;
        root.add(baseMesh);

        // Foot Ring
        const footRingGeo = new THREE.TorusGeometry(0.32, 0.015, 16, 48);
        const footRing = new THREE.Mesh(footRingGeo, mugBodyMat);
        footRing.rotation.x = Math.PI / 2;
        footRing.position.y = 0.01;
        root.add(footRing);

        // 5. MUG HANDLE (Smooth Curved Torus Arc)
        const handleCurve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(-0.40, 0.78, 0),
            new THREE.Vector3(-0.82, 0.50, 0),
            new THREE.Vector3(-0.38, 0.22, 0)
        );
        const handleGeo = new THREE.TubeGeometry(handleCurve, 32, 0.052, 16, false);
        const handleMesh = new THREE.Mesh(handleGeo, mugHandleMat);
        handleMesh.castShadow = true;
        root.add(handleMesh);

        // 6. BRAND PRINT DECAL (Curved overlay on front of mug)
        const decalTex = await createMugDecalTexture(brand.name, brand.primaryColor || "#4abbff", brand.logo, selectedFinish);
        const decalGeo = new THREE.CylinderGeometry(0.422, 0.382, 0.75, 36, 1, true, -Math.PI * 0.35, Math.PI * 0.70);
        decalMat = new THREE.MeshStandardMaterial({
            map: decalTex,
            roughness: 0.18,
            metalness: 0.05,
            transparent: false
        });
        const decalMesh = new THREE.Mesh(decalGeo, decalMat);
        decalMesh.position.y = 0.50;
        root.add(decalMesh);

        // 7. LIQUID BEVERAGE SURFACE
        if (selectedLiquid !== "empty") {
            const liquidColor = selectedLiquid === "coffee" ? "#3b2219" : "#4d7c0f";
            liquidMat = new THREE.MeshStandardMaterial({
                color: liquidColor,
                roughness: 0.1,
                metalness: 0.1
            });
            const liquidGeo = new THREE.CircleGeometry(0.365, 36);
            const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
            liquidMesh.rotation.x = -Math.PI / 2;
            liquidMesh.position.y = 0.82;
            root.add(liquidMesh);
        }

        // 8. STUDIO DROP SHADOW DISC
        const shadowGeo = new THREE.PlaneGeometry(1.6, 1.6);
        const shadowTex = createTextureFromCanvas((ctx, w, h) => {
            const grad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2 - 5);
            grad.addColorStop(0, "rgba(0, 0, 0, 0.45)");
            grad.addColorStop(0.5, "rgba(0, 0, 0, 0.18)");
            grad.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        }, 256, 256);
        const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.85, depthWrite: false });
        shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
        shadowMesh.rotation.x = -Math.PI / 2;
        shadowMesh.position.y = 0.001;
        root.add(shadowMesh);

        // 9. AR PLACEMENT RETICLE RING (Visible in AR mode)
        const reticleGeo = new THREE.RingGeometry(0.48, 0.52, 48);
        const reticleMat = new THREE.MeshBasicMaterial({
            color: brand.primaryColor || "#4abbff",
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.75
        });
        arReticleMesh = new THREE.Mesh(reticleGeo, reticleMat);
        arReticleMesh.rotation.x = -Math.PI / 2;
        arReticleMesh.position.y = 0.003;
        arReticleMesh.visible = isARActive;
        root.add(arReticleMesh);
    }

    function updateCameraPosition() {
        if (!camera) return;
        camera.position.x = cameraDistance * Math.sin(cameraPhi) * Math.sin(cameraTheta);
        camera.position.y = cameraDistance * Math.cos(cameraPhi) + 0.45;
        camera.position.z = cameraDistance * Math.sin(cameraPhi) * Math.cos(cameraTheta);
        camera.lookAt(0, 0.48, 0);
    }

    // Toggle AR Camera Feed
    async function startARCamera() {
        try {
            if (cameraStream) {
                cameraStream.getTracks().forEach((t) => t.stop());
            }
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });

            if (videoEl) {
                videoEl.srcObject = cameraStream;
                await videoEl.play();
                hasCamera = true;
                isARActive = true;
                if (scene) scene.background = null;
                if (renderer) renderer.setClearColor(0x000000, 0);
                if (arReticleMesh) arReticleMesh.visible = true;
                autoRotate = false;
            }
        } catch (e) {
            console.warn("Unable to access environment camera:", e);
            alert("Camera access is needed for AR Passthrough. Please check browser camera permissions.");
        }
    }

    function stopARCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach((t) => t.stop());
            cameraStream = null;
        }
        hasCamera = false;
        isARActive = false;
        if (scene) scene.background = new THREE.Color("#090d16");
        if (renderer) renderer.setClearColor(0x090d16, 1);
        if (arReticleMesh) arReticleMesh.visible = false;
    }

    function toggleARMode() {
        if (isARActive) {
            stopARCamera();
        } else {
            startARCamera();
        }
    }

    // Pointer event handlers for 3D Orbiting
    function handlePointerDown(e: MouseEvent | TouchEvent) {
        if ("touches" in e) {
            if (e.touches.length === 1) {
                isDragging = true;
                prevMouseX = e.touches[0].clientX;
                prevMouseY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                // 2-finger pinch/scale or rotate in AR
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                initialTouchDistance = Math.sqrt(dx * dx + dy * dy);
                initialTouchAngle = Math.atan2(dy, dx);
            }
        } else {
            isDragging = true;
            prevMouseX = e.clientX;
            prevMouseY = e.clientY;
        }
    }

    function handlePointerMove(e: MouseEvent | TouchEvent) {
        if ("touches" in e) {
            if (e.touches.length === 1 && isDragging) {
                const clientX = e.touches[0].clientX;
                const clientY = e.touches[0].clientY;
                const deltaX = clientX - prevMouseX;
                const deltaY = clientY - prevMouseY;

                cameraTheta -= deltaX * 0.008;
                cameraPhi = Math.max(0.1, Math.min(Math.PI * 0.48, cameraPhi - deltaY * 0.008));
                updateCameraPosition();

                prevMouseX = clientX;
                prevMouseY = clientY;
                autoRotate = false;
            } else if (e.touches.length === 2 && isARActive) {
                // Pinch zoom in AR
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (initialTouchDistance > 0) {
                    const factor = dist / initialTouchDistance;
                    arScale = Math.max(0.4, Math.min(2.5, arScale * factor));
                    if (mugGroup) mugGroup.scale.set(arScale, arScale, arScale);
                    initialTouchDistance = dist;
                }
            }
        } else if (isDragging) {
            const deltaX = e.clientX - prevMouseX;
            const deltaY = e.clientY - prevMouseY;

            cameraTheta -= deltaX * 0.008;
            cameraPhi = Math.max(0.1, Math.min(Math.PI * 0.48, cameraPhi - deltaY * 0.008));
            updateCameraPosition();

            prevMouseX = e.clientX;
            prevMouseY = e.clientY;
            autoRotate = false;
        }
    }

    function handlePointerUp() {
        isDragging = false;
        initialTouchDistance = 0;
    }

    function handleWheel(e: WheelEvent) {
        e.preventDefault();
        cameraDistance = Math.max(1.2, Math.min(4.5, cameraDistance + e.deltaY * 0.002));
        updateCameraPosition();
        autoRotate = false;
    }

    function setFinish(finish: "white" | "black" | "brand") {
        selectedFinish = finish;
        if (mugGroup) {
            buildMug(mugGroup);
        }
    }

    function setLiquid(liq: "coffee" | "matcha" | "empty") {
        selectedLiquid = liq;
        if (mugGroup) {
            buildMug(mugGroup);
        }
    }

    function resetView() {
        cameraTheta = 0.4;
        cameraPhi = 0.5;
        cameraDistance = 2.4;
        arScale = 1.0;
        if (mugGroup) mugGroup.scale.set(1, 1, 1);
        updateCameraPosition();
        autoRotate = true;
    }

    function createTextureFromCanvas(drawFn: (ctx: CanvasRenderingContext2D, width: number, height: number) => void, width = 512, height = 512): THREE.CanvasTexture {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            drawFn(ctx, width, height);
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    onMount(() => {
        if (!containerEl || !canvasEl) return;

        let onBrandUpdated: (() => void) | null = null;
        let handleResize: (() => void) | null = null;

        const init = async () => {
            if (!containerEl || !canvasEl) return;

            scene = new THREE.Scene();
            scene.background = new THREE.Color("#090d16");

            const w = containerEl.clientWidth;
            const h = containerEl.clientHeight;

            camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 50);
            updateCameraPosition();

            renderer = new THREE.WebGLRenderer({
                canvas: canvasEl,
                alpha: true,
                antialias: true,
                powerPreference: "high-performance"
            });
            renderer.setSize(w, h);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.25;

            // Lighting Rig
            const ambientLight = new THREE.AmbientLight("#ffffff", 1.2);
            scene.add(ambientLight);

            const keyLight = new THREE.DirectionalLight("#ffffff", 2.5);
            keyLight.position.set(3, 5, 4);
            keyLight.castShadow = true;
            keyLight.shadow.mapSize.width = 1024;
            keyLight.shadow.mapSize.height = 1024;
            keyLight.shadow.bias = -0.001;
            scene.add(keyLight);

            const fillLight = new THREE.DirectionalLight(brand.primaryColor || "#38bdf8", 1.2);
            fillLight.position.set(-4, 3, -2);
            scene.add(fillLight);

            const rimLight = new THREE.PointLight("#ffffff", 2.0, 10);
            rimLight.position.set(0, 4, -3);
            scene.add(rimLight);

            // Build Mug
            mugGroup = new THREE.Group();
            await buildMug(mugGroup);
            scene.add(mugGroup);

            handleResize = () => {
                if (!containerEl || !camera || !renderer) return;
                const nw = containerEl.clientWidth;
                const nh = containerEl.clientHeight;
                camera.aspect = nw / nh;
                camera.updateProjectionMatrix();
                renderer.setSize(nw, nh);
            };
            window.addEventListener("resize", handleResize);

            // Game Loop
            let clock = new THREE.Clock();
            const animate = () => {
                animationFrameId = requestAnimationFrame(animate);
                const delta = clock.getDelta();

                if (autoRotate && !isARActive && mugGroup) {
                    mugGroup.rotation.y += delta * 0.45;
                }

                if (arReticleMesh && isARActive) {
                    const t = clock.getElapsedTime();
                    const s = 1.0 + Math.sin(t * 4.0) * 0.05;
                    arReticleMesh.scale.set(s, s, s);
                }

                if (renderer && scene && camera) {
                    renderer.render(scene, camera);
                }
            };

            animate();

            if (initialAR) {
                startARCamera();
            }

            onBrandUpdated = () => {
                if (mugGroup) {
                    buildMug(mugGroup);
                }
            };
            window.addEventListener("ekson_brand_updated", onBrandUpdated);
        };

        init();

        return () => {
            if (handleResize) window.removeEventListener("resize", handleResize);
            if (onBrandUpdated) window.removeEventListener("ekson_brand_updated", onBrandUpdated);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            stopARCamera();
            renderer?.dispose();
        };
    });

    onDestroy(() => {
        stopARCamera();
    });
</script>

<div
    bind:this={containerEl}
    class="relative w-full h-full min-h-[460px] flex flex-col justify-between select-none font-sans overflow-hidden bg-slate-950 rounded-2xl border border-white/15 shadow-2xl"
>
    <!-- Background Camera Stream for AR Mode -->
    <!-- svelte-ignore a11y_media_has_caption -->
    <video
        bind:this={videoEl}
        class="absolute inset-0 w-full h-full object-cover z-0 {isARActive ? 'block' : 'hidden'}"
        playsinline
        muted
        autoplay
    ></video>

    <!-- Top Overlay Control Bar -->
    <div class="relative z-20 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div class="flex items-center gap-2 pointer-events-auto">
            <div class="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-md flex items-center gap-2">
                <span class="size-2 rounded-full {isARActive ? 'bg-emerald-400 animate-ping' : 'bg-primary'}"></span>
                <span class="text-[10px] sm:text-xs font-mono font-bold uppercase text-white tracking-wider">
                    {isARActive ? "LIVE CAMERA AR" : "3D MERCHANDISE LENS"}
                </span>
            </div>

            <!-- Auto Rotate Toggle -->
            <button
                onclick={() => (autoRotate = !autoRotate)}
                class="px-3 py-1.5 bg-black/80 hover:bg-white/20 text-white border border-white/20 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider transition cursor-pointer backdrop-blur-md hidden sm:flex items-center gap-1"
                title="Toggle Auto Rotation"
            >
                <span class="material-symbols-rounded text-[14px]">rotate_right</span>
                <span>{autoRotate ? "SPIN ON" : "SPIN OFF"}</span>
            </button>
        </div>

        <div class="flex items-center gap-2 pointer-events-auto">
            <!-- Launch AR Passthrough Button -->
            <button
                onclick={toggleARMode}
                class="px-3.5 py-1.5 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full shadow-lg transition flex items-center gap-1.5 cursor-pointer border {isARActive ? 'bg-amber-500 hover:bg-amber-400 text-black border-amber-300' : 'bg-primary text-white border-white/30'}"
                title={isARActive ? "Exit Camera AR" : "Preview in Physical Room"}
            >
                <span class="material-symbols-rounded text-[16px]">
                    {isARActive ? "videocam_off" : "view_in_ar"}
                </span>
                <span>{isARActive ? "Exit AR" : "View in AR"}</span>
            </button>

            {#if onClose}
                <button
                    onclick={onClose}
                    class="size-8 rounded-full bg-black/80 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition cursor-pointer shadow-md"
                    aria-label="Close Preview"
                >
                    <span class="material-symbols-rounded text-[18px]">close</span>
                </button>
            {/if}
        </div>
    </div>

    <!-- 3D Interactive Canvas -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="absolute inset-0 w-full h-full z-10 cursor-grab active:cursor-grabbing"
        onmousedown={handlePointerDown}
        onmousemove={handlePointerMove}
        onmouseup={handlePointerUp}
        ontouchstart={handlePointerDown}
        ontouchmove={handlePointerMove}
        ontouchend={handlePointerUp}
        onwheel={handleWheel}
        role="region"
        aria-label="3D Model Viewer"
    >
        <canvas bind:this={canvasEl} class="w-full h-full block"></canvas>
    </div>

    <!-- AR Surface Prompt / Pinch Hint Overlay -->
    {#if isARActive}
        <div class="absolute inset-x-0 top-16 z-20 flex justify-center pointer-events-none animate-bounce">
            <div class="bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-emerald-400/40 shadow-xl flex items-center gap-2 text-white font-mono text-[10px] uppercase tracking-wider">
                <span class="material-symbols-rounded text-[16px] text-emerald-400">pinch</span>
                <span>Pinch to scale • Drag to orbit around mug</span>
            </div>
        </div>
    {/if}

    <!-- Bottom Customizer Control Bar -->
    <div class="relative z-20 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pointer-events-none">
        <!-- Finish Material Picker -->
        <div class="pointer-events-auto flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-lg">
            <span class="font-mono text-[9px] text-white/60 uppercase px-1.5 font-bold">FINISH:</span>
            <button
                onclick={() => setFinish("white")}
                class="px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded-xl transition cursor-pointer border {selectedFinish === 'white' ? 'bg-white text-black border-white shadow-xs' : 'text-white/80 bg-white/10 border-transparent hover:bg-white/20'}"
            >
                Ceramic White
            </button>
            <button
                onclick={() => setFinish("black")}
                class="px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded-xl transition cursor-pointer border {selectedFinish === 'black' ? 'bg-zinc-800 text-white border-zinc-500 shadow-xs' : 'text-white/80 bg-white/10 border-transparent hover:bg-white/20'}"
            >
                Matte Black
            </button>
            <button
                onclick={() => setFinish("brand")}
                class="px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded-xl transition cursor-pointer border {selectedFinish === 'brand' ? 'text-white border-white shadow-xs' : 'text-white/80 bg-white/10 border-transparent hover:bg-white/20'}"
                style="{selectedFinish === 'brand' ? `background-color: ${brand.primaryColor};` : ''}"
            >
                Brand Glaze
            </button>
        </div>

        <!-- Beverage & Reset Controls -->
        <div class="pointer-events-auto flex items-center justify-between sm:justify-end gap-1.5">
            <!-- Liquid Selector -->
            <div class="flex items-center gap-1 bg-black/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-lg">
                <button
                    onclick={() => setLiquid("coffee")}
                    class="px-2 py-1 text-[9px] font-mono font-bold uppercase rounded-xl transition cursor-pointer {selectedLiquid === 'coffee' ? 'bg-amber-900/80 text-amber-200 border border-amber-600/50' : 'text-white/60 hover:text-white'}"
                    title="Fill with Espresso"
                >
                    ☕ Coffee
                </button>
                <button
                    onclick={() => setLiquid("matcha")}
                    class="px-2 py-1 text-[9px] font-mono font-bold uppercase rounded-xl transition cursor-pointer {selectedLiquid === 'matcha' ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-600/50' : 'text-white/60 hover:text-white'}"
                    title="Fill with Matcha"
                >
                    🍵 Matcha
                </button>
                <button
                    onclick={() => setLiquid("empty")}
                    class="px-2 py-1 text-[9px] font-mono font-bold uppercase rounded-xl transition cursor-pointer {selectedLiquid === 'empty' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}"
                    title="Empty Mug"
                >
                    Empty
                </button>
            </div>

            <!-- Reset Camera -->
            <button
                onclick={resetView}
                class="size-8 rounded-xl bg-black/80 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition cursor-pointer shadow-lg"
                title="Reset View Angle"
                aria-label="Reset View Angle"
            >
                <span class="material-symbols-rounded text-[16px]">restart_alt</span>
            </button>
        </div>
    </div>
</div>
