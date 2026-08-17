<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as THREE from "three";
    import { brand } from "$lib/brand.svelte";

    interface Waypoint {
        id: string;
        label: string;
        zoneName: string;
        pos: [number, number, number];
        lookAt: [number, number, number];
    }

    interface FloorNavMarker {
        mesh: THREE.Group;
        targetPos: [number, number, number];
        targetLook: [number, number, number];
        zoneName: string;
    }

    const waypoints: Waypoint[] = [
        { id: "lobby", label: "01 Entry Lobby", zoneName: "Grand Atrium", pos: [0, 1.65, 7.5], lookAt: [0, 1.6, 0] },
        { id: "gallery", label: "02 Central Gallery", zoneName: "Exhibition Hall", pos: [0, 1.65, 2.5], lookAt: [0, 1.6, -4] },
        { id: "hologram", label: "03 Hologram Hub", zoneName: "Spatial Plinth", pos: [-3.2, 1.65, 0.5], lookAt: [-3.2, 1.4, -2.5] },
        { id: "mediawall", label: "04 Media Wall", zoneName: "Ultra-HD Display", pos: [3.2, 1.65, -1.0], lookAt: [4.5, 1.8, -1.0] },
        { id: "lounge", label: "05 Executive Pod", zoneName: "Discussion Lounge", pos: [0, 1.65, -5.5], lookAt: [0, 1.3, -7.5] }
    ];

    let is3DActive = $state(false);
    let isPointerLocked = $state(false);
    let activeZone = $state("Grand Atrium");
    let activeWaypointId = $state("lobby");
    let speedMode = $state<"walk" | "run">("walk");
    let isMoving = $state(false);
    let showGestureHint = $state(true);

    let modalContainerEl = $state<HTMLElement | null>(null);
    let canvasEl = $state<HTMLCanvasElement | null>(null);
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let animationFrameId: number | null = null;

    function requestCanvasPointerLock() {
        if (canvasEl && typeof document !== "undefined" && document.pointerLockElement !== canvasEl) {
            canvasEl.requestPointerLock();
        }
    }

    function onPointerLockChange() {
        isPointerLocked = typeof document !== "undefined" && document.pointerLockElement === canvasEl;
    }

    // Movement & Camera State
    let yaw = 0;
    let pitch = 0;
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;

    const keysPressed: Record<string, boolean> = {};
    const playerPos = new THREE.Vector3(0, 1.65, 7.5);
    const moveVelocity = new THREE.Vector3();
    let stepCycle = 0;

    // Waypoint Gliding
    let isGliding = false;
    let glideProgress = 1.0;
    const fromGlidePos = new THREE.Vector3();
    const toGlidePos = new THREE.Vector3();
    let fromGlideYaw = 0;
    let toGlideYaw = 0;
    let fromGlidePitch = 0;
    let toGlidePitch = 0;

    // Minimap Radar
    let radarX = $state(50);
    let radarY = $state(85);
    let radarAngle = $state(0);

    // Floor navigation markers & raycasting
    let floorMarkers: FloorNavMarker[] = [];
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    // Mobile D-Pad
    let dpadForward = false;
    let dpadBackward = false;
    let dpadLeft = false;
    let dpadRight = false;

    // Animated objects
    let hologramCrystal: THREE.Mesh | null = null;
    let animatedLightPillars: THREE.Mesh[] = [];

    function open3DWalkthrough() {
        is3DActive = true;
        setTimeout(() => {
            initThreeScene();
            requestCanvasPointerLock();
        }, 50);
    }

    function close3DWalkthrough() {
        is3DActive = false;
        cleanupThreeScene();
    }

    // Procedural Dynamic Texture Generator
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
        texture.anisotropy = 4;
        return texture;
    }

    function createPolishedGalleryFloorTexture(brandColor: string): THREE.CanvasTexture {
        return createTextureFromCanvas((ctx, w, h) => {
            // Elegant large-format architectural porcelain floor tiles
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(0, 0, w, h);

            // Subtle marble grain
            ctx.fillStyle = "#1e293b";
            for (let i = 0; i < 2000; i++) {
                const x = Math.random() * w;
                const y = Math.random() * h;
                ctx.globalAlpha = 0.06;
                ctx.fillRect(x, y, 4, 4);
            }
            ctx.globalAlpha = 1.0;

            // Thin geometric joint lines
            ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
            ctx.lineWidth = 1.5;
            const step = w / 4;
            for (let x = 0; x <= w; x += step) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }
            for (let y = 0; y <= h; y += step) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }

            // Embedded luminous wayfinding pathway grid
            ctx.fillStyle = brandColor;
            ctx.globalAlpha = 0.2;
            ctx.fillRect(w / 2 - 2, 0, 4, h);
        }, 512, 512);
    }

    function createChevronTexture(brandColor: string): THREE.CanvasTexture {
        return createTextureFromCanvas((ctx, w, h) => {
            ctx.clearRect(0, 0, w, h);

            // Outer glowing circle ring
            ctx.strokeStyle = brandColor;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, w / 2 - 16, 0, Math.PI * 2);
            ctx.stroke();

            // Inner translucent disc
            ctx.fillStyle = brandColor;
            ctx.globalAlpha = 0.25;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, w / 2 - 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Forward double chevron arrow
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.moveTo(w / 2, h * 0.28);
            ctx.lineTo(w * 0.72, h * 0.52);
            ctx.lineTo(w * 0.62, h * 0.60);
            ctx.lineTo(w / 2, h * 0.44);
            ctx.lineTo(w * 0.38, h * 0.60);
            ctx.lineTo(w * 0.28, h * 0.52);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(w / 2, h * 0.48);
            ctx.lineTo(w * 0.72, h * 0.72);
            ctx.lineTo(w * 0.62, h * 0.80);
            ctx.lineTo(w / 2, h * 0.64);
            ctx.lineTo(w * 0.38, h * 0.80);
            ctx.lineTo(w * 0.28, h * 0.72);
            ctx.closePath();
            ctx.fill();
        }, 256, 256);
    }

    function createDisplayPosterTexture(title: string, sub: string, brandColor: string, darkColor: string): THREE.CanvasTexture {
        return createTextureFromCanvas((ctx, w, h) => {
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, darkColor);
            grad.addColorStop(1, "#020617");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // Glowing top accent
            ctx.fillStyle = brandColor;
            ctx.fillRect(0, 0, w, 8);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 26px sans-serif";
            ctx.fillText(title.toUpperCase(), 25, 55);

            ctx.fillStyle = brandColor;
            ctx.font = "bold 13px monospace";
            ctx.fillText(sub.toUpperCase(), 25, 85);

            // Mock Visual Frame
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            ctx.lineWidth = 2;
            ctx.fillRect(25, 110, w - 50, h - 160);
            ctx.strokeRect(25, 110, w - 50, h - 160);

            // Inner icon
            ctx.fillStyle = brandColor;
            ctx.beginPath();
            ctx.arc(w / 2, (110 + h - 50) / 2, 40, 0, Math.PI * 2);
            ctx.fill();
        }, 512, 512);
    }

    // Build Modern Indoor Spatial Venue
    function buildIndoorGalleryVenue(root: THREE.Group, brandName: string, brandColor: string, brandDark: string) {
        const wallMat = new THREE.MeshStandardMaterial({ color: "#0f172a", roughness: 0.85 });
        const ceilingMat = new THREE.MeshStandardMaterial({ color: "#020617", roughness: 0.9 });
        const brandMat = new THREE.MeshStandardMaterial({ color: brandColor, roughness: 0.25, metalness: 0.2 });
        const brandGlowMat = new THREE.MeshStandardMaterial({ color: brandColor, emissive: brandColor, emissiveIntensity: 1.2 });
        const glassMat = new THREE.MeshPhysicalMaterial({ color: "#ffffff", transmission: 0.85, transparent: true, opacity: 0.9, roughness: 0.1 });
        const whitePedestalMat = new THREE.MeshStandardMaterial({ color: "#f8fafc", roughness: 0.2 });

        // 1. MAIN GALLERY FLOOR
        const floorGeo = new THREE.PlaneGeometry(16, 26);
        const floorTex = createPolishedGalleryFloorTexture(brandColor);
        floorTex.wrapS = THREE.RepeatWrapping;
        floorTex.wrapT = THREE.RepeatWrapping;
        floorTex.repeat.set(6, 10);
        const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.35, metalness: 0.25 });
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.y = 0;
        floorMesh.receiveShadow = true;
        root.add(floorMesh);

        // 2. CEILING & OVERHEAD ARCHITECTURAL LIGHTING TROUGHS
        const ceilingGeo = new THREE.PlaneGeometry(16, 26);
        const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceilingMesh.rotation.x = Math.PI / 2;
        ceilingMesh.position.y = 4.8;
        root.add(ceilingMesh);

        // Linear recessed ceiling glow strips
        for (let x of [-5, 0, 5]) {
            const stripGeo = new THREE.BoxGeometry(0.18, 0.04, 24);
            const stripMesh = new THREE.Mesh(stripGeo, brandGlowMat);
            stripMesh.position.set(x, 4.78, 0);
            root.add(stripMesh);
        }

        // 3. PERIMETER WALLS
        // Back Wall
        const backWallGeo = new THREE.BoxGeometry(16, 4.8, 0.4);
        const backWallMesh = new THREE.Mesh(backWallGeo, wallMat);
        backWallMesh.position.set(0, 2.4, -13);
        root.add(backWallMesh);

        // Front Wall with Entrance Arch
        const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(6, 4.8, 0.4), wallMat);
        frontWallLeft.position.set(-5, 2.4, 13);
        root.add(frontWallLeft);

        const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(6, 4.8, 0.4), wallMat);
        frontWallRight.position.set(5, 2.4, 13);
        root.add(frontWallRight);

        // Grand Entrance Header Sign
        const entranceSignGeo = new THREE.BoxGeometry(5.0, 0.9, 0.2);
        const entranceSignMat = new THREE.MeshStandardMaterial({ color: brandDark, emissive: brandColor, emissiveIntensity: 0.6 });
        const entranceSignMesh = new THREE.Mesh(entranceSignGeo, entranceSignMat);
        entranceSignMesh.position.set(0, 4.2, 13);
        root.add(entranceSignMesh);

        // Left & Right Side Walls
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.8, 26), wallMat);
        leftWall.position.set(-8, 2.4, 0);
        root.add(leftWall);

        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.8, 26), wallMat);
        rightWall.position.set(8, 2.4, 0);
        root.add(rightWall);

        // 4. ARCHITECTURAL GALLERY POSTERS & LIGHTBOX PANELS
        const posters = [
            { title: "Spatial WebXR", sub: "Instant 3D Activation", x: -7.7, z: 4.0, ry: Math.PI / 2 },
            { title: "AI Voice Host", sub: "Interactive Concierge", x: -7.7, z: -2.0, ry: Math.PI / 2 },
            { title: "Smart Gamification", sub: "Engaging Trade Booths", x: -7.7, z: -8.0, ry: Math.PI / 2 },
            { title: "Digital Analytics", sub: "Real-Time Telemetry", x: 7.7, z: 4.0, ry: -Math.PI / 2 },
            { title: "True-Scale 3D", sub: "1:1 Architecture", x: 7.7, z: -8.0, ry: -Math.PI / 2 }
        ];

        posters.forEach((p) => {
            const pGeo = new THREE.PlaneGeometry(1.6, 2.2);
            const pTex = createDisplayPosterTexture(p.title, p.sub, brandColor, brandDark);
            const pMat = new THREE.MeshStandardMaterial({ map: pTex, emissive: brandDark, emissiveIntensity: 0.3 });
            const pMesh = new THREE.Mesh(pGeo, pMat);
            pMesh.position.set(p.x, 2.2, p.z);
            pMesh.rotation.y = p.ry;
            root.add(pMesh);
        });

        // 5. EXHIBIT 1: CENTRAL HOLOGRAPHIC SPATIAL DIAMOND PLINTH (Left Wing)
        const plinthGeo = new THREE.CylinderGeometry(1.1, 1.2, 0.85, 32);
        const plinthMesh = new THREE.Mesh(plinthGeo, whitePedestalMat);
        plinthMesh.position.set(-3.2, 0.425, -2.5);
        plinthMesh.castShadow = true;
        root.add(plinthMesh);

        // Ring Glow on Plinth
        const ringGeo = new THREE.TorusGeometry(1.15, 0.04, 16, 32);
        const ringMesh = new THREE.Mesh(ringGeo, brandGlowMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.set(-3.2, 0.86, -2.5);
        root.add(ringMesh);

        // Rotating Holographic Octahedron Crystal
        const crystalGeo = new THREE.OctahedronGeometry(0.55, 0);
        const crystalMat = new THREE.MeshPhysicalMaterial({
            color: brandColor,
            emissive: brandColor,
            emissiveIntensity: 0.8,
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.6,
            transparent: true,
            opacity: 0.9
        });
        hologramCrystal = new THREE.Mesh(crystalGeo, crystalMat);
        hologramCrystal.position.set(-3.2, 1.6, -2.5);
        root.add(hologramCrystal);

        // 6. EXHIBIT 2: ULTRA-WIDE CURVED MEDIA WALL (Right Wing)
        const mediaWallGeo = new THREE.PlaneGeometry(4.6, 2.4);
        const mediaWallMat = new THREE.MeshStandardMaterial({
            color: "#030712",
            emissive: brandColor,
            emissiveIntensity: 0.5,
            roughness: 0.2
        });
        const mediaWallMesh = new THREE.Mesh(mediaWallGeo, mediaWallMat);
        mediaWallMesh.position.set(5.5, 2.0, -1.0);
        mediaWallMesh.rotation.y = -Math.PI / 2;
        root.add(mediaWallMesh);

        // 7. EXHIBIT 3: EXECUTIVE DISCUSSION LOUNGE POD (Deep Hall)
        const loungeTable = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.04, 32), glassMat);
        loungeTable.position.set(0, 0.65, -8.0);
        root.add(loungeTable);

        const tableStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.65, 16), brandMat);
        tableStem.position.set(0, 0.325, -8.0);
        root.add(tableStem);

        // 3 Modern Lounge Chairs around table
        const chairOffsets = [
            [-1.1, -8.0, Math.PI / 2],
            [1.1, -8.0, -Math.PI / 2],
            [0, -9.1, 0]
        ];
        chairOffsets.forEach(([cx, cz, crot]) => {
            const chairGroup = new THREE.Group();
            chairGroup.position.set(cx, 0, cz);
            chairGroup.rotation.y = crot;

            const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), whitePedestalMat);
            seat.position.y = 0.42;
            chairGroup.add(seat);

            const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.08), brandMat);
            back.position.set(0, 0.62, -0.22);
            chairGroup.add(back);

            root.add(chairGroup);
        });

        // 8. INTERACTIVE FLOOR NAVIGATION CHEVRON GESTURES
        floorMarkers = [];
        const navPoints = [
            { pos: [0, 0.04, 5.0], targetPos: [0, 1.65, 2.5] as [number, number, number], look: [0, 1.6, -4] as [number, number, number], name: "Exhibition Hall" },
            { pos: [-2.0, 0.04, 1.8], targetPos: [-3.2, 1.65, 0.5] as [number, number, number], look: [-3.2, 1.4, -2.5] as [number, number, number], name: "Spatial Plinth" },
            { pos: [2.0, 0.04, 0.8], targetPos: [3.2, 1.65, -1.0] as [number, number, number], look: [4.5, 1.8, -1.0] as [number, number, number], name: "Ultra-HD Display" },
            { pos: [0, 0.04, -2.5], targetPos: [0, 1.65, -5.5] as [number, number, number], look: [0, 1.3, -7.5] as [number, number, number], name: "Discussion Lounge" },
            { pos: [0, 0.04, 0.0], targetPos: [0, 1.65, 7.5] as [number, number, number], look: [0, 1.6, 0] as [number, number, number], name: "Grand Atrium" }
        ];

        const chevronTex = createChevronTexture(brandColor);

        navPoints.forEach((np) => {
            const markerGroup = new THREE.Group();
            markerGroup.position.set(np.pos[0], np.pos[1], np.pos[2]);

            const markerGeo = new THREE.PlaneGeometry(1.2, 1.2);
            const markerMat = new THREE.MeshBasicMaterial({
                map: chevronTex,
                transparent: true,
                opacity: 0.88,
                depthWrite: false
            });
            const markerMesh = new THREE.Mesh(markerGeo, markerMat);
            markerMesh.rotation.x = -Math.PI / 2;
            markerGroup.add(markerMesh);

            root.add(markerGroup);

            floorMarkers.push({
                mesh: markerGroup,
                targetPos: np.targetPos,
                targetLook: np.look,
                zoneName: np.name
            });
        });
    }

    function initThreeScene() {
        if (!modalContainerEl || !canvasEl) return;

        scene = new THREE.Scene();
        scene.background = new THREE.Color("#0a0f1d");
        scene.fog = new THREE.FogExp2("#0a0f1d", 0.025);

        const width = modalContainerEl.clientWidth;
        const height = modalContainerEl.clientHeight;

        camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 100);
        camera.position.copy(playerPos);

        renderer = new THREE.WebGLRenderer({
            canvas: canvasEl,
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        // Ambient & Spot Lighting
        const ambientLight = new THREE.AmbientLight("#ffffff", 0.7);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight("#ffffff", 1.8);
        dirLight.position.set(5, 10, 5);
        scene.add(dirLight);

        const brandColor = brand.primaryColor || "#009dd6";
        const brandDark = brand.darkColor || "#04547c";

        const pointLight1 = new THREE.PointLight(brandColor, 2.5, 12);
        pointLight1.position.set(0, 3.8, 2.0);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(brandColor, 2.5, 12);
        pointLight2.position.set(0, 3.8, -6.0);
        scene.add(pointLight2);

        // Build Indoor Venue
        const venueRoot = new THREE.Group();
        buildIndoorGalleryVenue(venueRoot, brand.name, brandColor, brandDark);
        scene.add(venueRoot);

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        if (typeof document !== "undefined") {
            document.addEventListener("pointerlockchange", onPointerLockChange);
        }

        // Game Loop
        let clock = new THREE.Clock();
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const delta = Math.min(0.1, clock.getDelta());

            // Rotate Hologram Crystal
            if (hologramCrystal) {
                hologramCrystal.rotation.y += delta * 1.2;
                hologramCrystal.rotation.x += delta * 0.6;
            }

            // Pulse floor navigation chevron markers
            const time = clock.getElapsedTime();
            floorMarkers.forEach((m, idx) => {
                const pulse = 1.0 + Math.sin(time * 3.0 + idx) * 0.08;
                m.mesh.scale.set(pulse, 1.0, pulse);
            });

            // Smooth Waypoint Gliding
            if (isGliding && camera) {
                glideProgress = Math.min(1.0, glideProgress + delta * 1.8);
                const ease = 0.5 - Math.cos(glideProgress * Math.PI) / 2;
                playerPos.lerpVectors(fromGlidePos, toGlidePos, ease);
                yaw = fromGlideYaw + (toGlideYaw - fromGlideYaw) * ease;
                pitch = fromGlidePitch + (toGlidePitch - fromGlidePitch) * ease;

                if (glideProgress >= 1.0) {
                    isGliding = false;
                }
            } else {
                // Manual Movement
                const moveForward = keysPressed["KeyW"] || keysPressed["ArrowUp"] || dpadForward;
                const moveBackward = keysPressed["KeyS"] || keysPressed["ArrowDown"] || dpadBackward;
                const moveLeft = keysPressed["KeyA"] || keysPressed["ArrowLeft"] || dpadLeft;
                const moveRight = keysPressed["KeyD"] || keysPressed["ArrowRight"] || dpadRight;
                const isSprinting = keysPressed["ShiftLeft"] || keysPressed["ShiftRight"] || speedMode === "run";

                const walkSpeed = (isSprinting ? 5.0 : 2.8) * delta;

                const forwardVec = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
                const rightVec = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

                moveVelocity.set(0, 0, 0);

                if (moveForward) moveVelocity.add(forwardVec);
                if (moveBackward) moveVelocity.sub(forwardVec);
                if (moveRight) moveVelocity.add(rightVec);
                if (moveLeft) moveVelocity.sub(rightVec);

                if (moveVelocity.lengthSq() > 0) {
                    moveVelocity.normalize().multiplyScalar(walkSpeed);
                    playerPos.add(moveVelocity);
                    isMoving = true;
                    stepCycle += delta * (isSprinting ? 12 : 8);
                    showGestureHint = false;
                } else {
                    isMoving = false;
                }

                // Bounds inside gallery
                playerPos.x = Math.max(-7.2, Math.min(7.2, playerPos.x));
                playerPos.z = Math.max(-11.5, Math.min(11.5, playerPos.z));

                // Head bob
                const bob = isMoving ? Math.sin(stepCycle) * 0.035 : 0;
                playerPos.y = 1.65 + bob;
            }

            if (camera) {
                camera.position.copy(playerPos);
                camera.rotation.set(0, 0, 0);
                camera.rotation.y = yaw;
                camera.rotation.x = pitch;
            }

            // Radar calculations (Map bounds [-7.5, 7.5], [-12, 12])
            radarX = Math.round(50 + (playerPos.x / 7.5) * 40);
            radarY = Math.round(50 + (playerPos.z / 12.0) * 40);
            radarAngle = Math.round((-yaw * 180) / Math.PI);

            // Active zone detector
            if (playerPos.z > 5.0) activeZone = "Grand Atrium";
            else if (playerPos.x < -1.5 && playerPos.z > -4.0) activeZone = "Spatial Plinth";
            else if (playerPos.x > 1.5 && playerPos.z > -4.0) activeZone = "Ultra-HD Display";
            else if (playerPos.z < -4.5) activeZone = "Discussion Lounge";
            else activeZone = "Exhibition Hall";

            if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }
        };

        animate();
    }

    function cleanupThreeScene() {
        if (typeof window === "undefined") return;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        if (typeof document !== "undefined") {
            document.removeEventListener("pointerlockchange", onPointerLockChange);
            if (document.pointerLockElement === canvasEl) {
                document.exitPointerLock();
            }
        }
        isPointerLocked = false;
        renderer?.dispose();
        renderer = null;
        scene = null;
        camera = null;
    }

    function selectWaypoint(wp: Waypoint) {
        activeWaypointId = wp.id;
        activeZone = wp.zoneName;
        glideToTarget(wp.pos, wp.lookAt);
    }

    function glideToTarget(targetPos: [number, number, number], lookAt: [number, number, number]) {
        if (!camera) return;

        fromGlidePos.copy(playerPos);
        toGlidePos.set(targetPos[0], targetPos[1], targetPos[2]);

        const dx = lookAt[0] - targetPos[0];
        const dy = lookAt[1] - targetPos[1];
        const dz = lookAt[2] - targetPos[2];

        fromGlideYaw = yaw;
        toGlideYaw = Math.atan2(-dx, -dz);
        fromGlidePitch = pitch;
        toGlidePitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));

        glideProgress = 0.0;
        isGliding = true;
        showGestureHint = false;
    }

    function rotateQuick(angleDeg: number) {
        yaw += (angleDeg * Math.PI) / 180;
        showGestureHint = false;
    }

    // Mouse & Touch Look Handlers (No drag required for mouse)
    let hasInitializedMouse = false;
    let isTouching = false;
    let touchStartX = 0;
    let touchStartY = 0;

    function handleMouseEnter(e: MouseEvent) {
        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
        hasInitializedMouse = true;
    }

    function handleMouseLeave() {
        hasInitializedMouse = false;
    }

    function handleMouseMove(e: MouseEvent) {
        if (isGliding) return;

        let deltaX = 0;
        let deltaY = 0;

        if (typeof document !== "undefined" && document.pointerLockElement === canvasEl) {
            deltaX = e.movementX;
            deltaY = e.movementY;
        } else {
            if (!hasInitializedMouse) {
                previousMouseX = e.clientX;
                previousMouseY = e.clientY;
                hasInitializedMouse = true;
                return;
            }
            deltaX = (e.movementX !== undefined && Math.abs(e.movementX) < 120) ? e.movementX : (e.clientX - previousMouseX);
            deltaY = (e.movementY !== undefined && Math.abs(e.movementY) < 120) ? e.movementY : (e.clientY - previousMouseY);
            previousMouseX = e.clientX;
            previousMouseY = e.clientY;
        }

        yaw -= deltaX * 0.0022;
        pitch -= deltaY * 0.0022;
        pitch = Math.max(-Math.PI * 0.38, Math.min(Math.PI * 0.38, pitch));
        showGestureHint = false;
    }

    function handleTouchStart(e: TouchEvent) {
        if (e.touches.length > 0) {
            isTouching = true;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    }

    function handleTouchMove(e: TouchEvent) {
        if (!isTouching || isGliding || e.touches.length === 0) return;
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;

        const deltaX = clientX - touchStartX;
        const deltaY = clientY - touchStartY;

        yaw -= deltaX * 0.0035;
        pitch -= deltaY * 0.0035;
        pitch = Math.max(-Math.PI * 0.38, Math.min(Math.PI * 0.38, pitch));

        touchStartX = clientX;
        touchStartY = clientY;
        showGestureHint = false;
    }

    function handleTouchEnd() {
        isTouching = false;
    }

    // Floor marker raycasting click & Pointer Lock request
    function handleCanvasClick(e: MouseEvent) {
        if (!canvasEl || !camera) return;

        if (!isPointerLocked) {
            requestCanvasPointerLock();
        }

        const rect = canvasEl.getBoundingClientRect();
        mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouseVec, camera);

        const clickableMeshes = floorMarkers.map((m) => m.mesh.children[0]);
        const intersects = raycaster.intersectObjects(clickableMeshes, false);

        if (intersects.length > 0) {
            const hitObject = intersects[0].object;
            const marker = floorMarkers.find((m) => m.mesh.children[0] === hitObject);
            if (marker) {
                glideToTarget(marker.targetPos, marker.targetLook);
            }
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.code === "Escape" || e.key === "Escape") {
            if (typeof document !== "undefined" && document.pointerLockElement) {
                document.exitPointerLock();
            }
        }
        keysPressed[e.code] = true;
        if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
            isGliding = false;
            showGestureHint = false;
        }
    }

    function handleKeyUp(e: KeyboardEvent) {
        keysPressed[e.code] = false;
    }

    onDestroy(() => {
        cleanupThreeScene();
    });
</script>

<div class="relative w-full h-full min-h-[100dvh] md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex flex-col justify-between select-none font-sans overflow-hidden">
    <!-- Top Header -->
    <div class="flex items-end justify-between pb-2 border-b border-black/5 shrink-0 w-full mb-2 sm:mb-3">
        <div>
            <div class="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest font-bold mb-0.5" style="color: {brand.primaryColor};">
                <span class="size-1.5 rounded-full" style="background-color: {brand.primaryColor};"></span>
                <span>04 / Spatial Walkthrough</span>
            </div>
            <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-text tracking-tight uppercase">
                Real-Time Walkthrough
            </h2>
            <p class="text-[11px] sm:text-xs text-text/70 mt-0.5 max-w-xl">
                Explore architectural installations and indoor gallery venues with fluid first-person navigation gestures and photorealistic rendering.
            </p>
        </div>

        <div class="hidden sm:flex items-center gap-2 font-mono text-[10px] text-text/50">
            <span class="size-2 rounded-full animate-pulse" style="background-color: {brand.primaryColor};"></span>
            <span>60 FPS LOCOMOTION</span>
        </div>
    </div>

    <!-- Main Content Area: 2-Column Split (Default Video View) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 flex-1 w-full my-auto max-h-[74vh] md:max-h-[78vh] items-stretch overflow-hidden">
        <!-- Left Narrative Card -->
        <div class="bg-white border border-black/10 rounded-2xl p-5 sm:p-8 md:p-10 flex flex-col justify-between shadow-xs overflow-hidden">
            <div>
                <span class="font-mono text-[10px] font-bold uppercase tracking-widest block mb-1" style="color: {brand.primaryColor};">
                    IMMERSIVE LOCOMOTION
                </span>
                <h3 class="text-xl sm:text-2xl md:text-3xl font-black text-text uppercase tracking-tight leading-snug">
                    Seamless Indoor Navigation
                </h3>
                <p class="text-xs sm:text-sm text-text/70 leading-relaxed mt-2.5">
                    Empower visitors to freely roam through high-resolution spatial indoor galleries with gesture-based navigation arrows, fluid first-person controls, and ambient lighting.
                </p>
            </div>

            <div class="space-y-3 mt-4 pt-4 border-t border-black/5">
                <div class="flex flex-wrap gap-2">
                    <span class="px-3 py-1 bg-black/[0.03] border border-black/5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider text-text/80">
                        Floor Gesture Chevrons
                    </span>
                    <span class="px-3 py-1 bg-black/[0.03] border border-black/5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider text-text/80">
                        Minimap Radar HUD
                    </span>
                    <span class="px-3 py-1 bg-black/[0.03] border border-black/5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider text-text/80">
                        Rapid Teleport Waypoints
                    </span>
                </div>

                <!-- Launch Walkthrough Action Button -->
                <button
                    onclick={open3DWalkthrough}
                    class="w-full py-3 px-5 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                    style="background-color: {brand.primaryColor};"
                >
                    <span class="material-symbols-rounded text-[18px]">explore</span>
                    <span>Launch 3D Spatial Walkthrough</span>
                </button>
            </div>
        </div>

        <!-- Right Column: Looping Video Preview with Launch Button Overlay -->
        <div class="relative overflow-hidden bg-slate-900 border border-black/10 rounded-2xl shadow-xs h-60 sm:h-72 md:h-full min-h-[160px] group">
            <!-- svelte-ignore a11y_media_has_caption -->
            <video
                class="absolute inset-0 w-full h-full object-cover opacity-90 transition group-hover:scale-105 duration-700"
                src="Walkthrough-demo.mp4"
                autoplay
                muted
                loop
                playsinline
            ></video>

            <!-- Video Dark Gradient Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

            <!-- Launch 3D Mode Floating Button -->
            <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 z-10">
                <button
                    onclick={open3DWalkthrough}
                    class="size-16 sm:size-18 rounded-full text-white flex items-center justify-center shadow-2xl transition hover:scale-110 cursor-pointer backdrop-blur-md border border-white/30 animate-pulse"
                    style="background-color: {brand.primaryColor};"
                    title="Enter 3D Walkthrough"
                    aria-label="Enter 3D Walkthrough"
                >
                    <span class="material-symbols-rounded text-[32px] sm:text-[36px]">view_in_ar</span>
                </button>
                <span class="font-mono text-[11px] font-bold text-white uppercase tracking-wider bg-black/60 px-3.5 py-1 rounded-full border border-white/20 backdrop-blur-md">
                    Click to Roam Indoor Venue
                </span>
            </div>
        </div>
    </div>
</div>

<!-- Immersive Real-Time 3D Walkthrough Modal View -->
{#if is3DActive}
    <div
        bind:this={modalContainerEl}
        class="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between select-none font-sans overflow-hidden animate-fade-in"
    >
        <!-- Top HUD Header Bar -->
        <div class="relative z-20 flex items-center justify-between p-3 sm:p-5 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <div class="flex items-center gap-2 pointer-events-auto">
                <div class="bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-md flex items-center gap-2">
                    <span class="size-2 rounded-full animate-ping" style="background-color: {brand.primaryColor};"></span>
                    <span class="text-[10px] sm:text-xs font-mono font-extrabold uppercase text-white tracking-wider">
                        ZONE: {activeZone}
                    </span>
                </div>

                <!-- Cursor Lock Status Pill -->
                <button
                    onclick={requestCanvasPointerLock}
                    class="px-3 py-1.5 bg-black/80 hover:bg-white/20 text-white border border-white/20 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider transition cursor-pointer backdrop-blur-md flex items-center gap-1.5"
                    title={isPointerLocked ? "Press ESC to unlock cursor" : "Click to lock cursor"}
                >
                    <span class="material-symbols-rounded text-[14px]" style="color: {brand.primaryColor};">
                        {isPointerLocked ? "lock" : "lock_open"}
                    </span>
                    <span>{isPointerLocked ? "CURSOR LOCKED (ESC TO UNLOCK)" : "CLICK TO LOCK CURSOR"}</span>
                </button>

                <!-- Speed Toggle -->
                <button
                    onclick={() => (speedMode = speedMode === "walk" ? "run" : "walk")}
                    class="px-3 py-1.5 bg-black/80 hover:bg-white/20 text-white border border-white/20 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider transition cursor-pointer backdrop-blur-md"
                >
                    SPEED: <span class="font-black" style="color: {brand.primaryColor};">{speedMode.toUpperCase()}</span>
                </button>
            </div>

            <!-- Close Walkthrough Button -->
            <button
                onclick={close3DWalkthrough}
                class="pointer-events-auto px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full shadow-lg transition flex items-center gap-1.5 cursor-pointer border border-white/20"
                aria-label="Exit Walkthrough"
            >
                <span class="material-symbols-rounded text-[16px]">close</span>
                <span>Exit Walkthrough</span>
            </button>
        </div>

        <!-- 3D Canvas Viewport -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
            class="absolute inset-0 w-full h-full z-0 cursor-crosshair"
            onmouseenter={handleMouseEnter}
            onmouseleave={handleMouseLeave}
            onmousemove={handleMouseMove}
            ontouchstart={handleTouchStart}
            ontouchmove={handleTouchMove}
            ontouchend={handleTouchEnd}
            onclick={handleCanvasClick}
            role="region"
            aria-label="3D Indoor Walkthrough Canvas"
        >
            <canvas bind:this={canvasEl} class="w-full h-full block"></canvas>

            <!-- Center Crosshair Reticle -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-70">
                <div class="size-2 rounded-full border border-white/80 bg-white/30 shadow-xs"></div>
            </div>
        </div>

        <!-- Navigation Gesture Hint Overlay -->
        {#if showGestureHint}
            <div class="absolute inset-x-0 top-20 z-10 flex justify-center pointer-events-none animate-bounce">
                <div class="bg-black/75 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 shadow-xl flex items-center gap-2.5 text-white">
                    <span class="material-symbols-rounded text-[20px]" style="color: {brand.primaryColor};">visibility</span>
                    <span class="font-mono text-[11px] font-bold uppercase tracking-wider">
                        Move Mouse to Look • Click Floor Arrows to Move • WASD / Keys
                    </span>
                </div>
            </div>
        {/if}

        <!-- Top Right Minimap Radar HUD -->
        <div class="absolute top-4 right-4 z-20 pointer-events-none hidden sm:flex flex-col items-center gap-1">
            <div class="relative size-22 rounded-2xl bg-black/85 backdrop-blur-md border border-white/25 shadow-xl overflow-hidden flex items-center justify-center">
                <div class="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:10px_10px]"></div>
                <!-- Gallery Outer Boundary -->
                <div class="absolute w-14 h-18 border border-white/30 rounded-xs"></div>

                <!-- Player Dot & Directional Cone -->
                <div
                    class="absolute size-3 rounded-full flex items-center justify-center transition-all duration-75"
                    style="left: calc({radarX}% - 6px); top: calc({radarY}% - 6px); transform: rotate({radarAngle}deg);"
                >
                    <div class="size-2 rounded-full shadow-sm" style="background-color: {brand.primaryColor};"></div>
                    <div
                        class="absolute -top-3 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] opacity-75"
                        style="border-bottom-color: {brand.primaryColor};"
                    ></div>
                </div>
            </div>
            <span class="font-mono text-[8px] text-white/60 uppercase tracking-widest">VENUE RADAR</span>
        </div>

        <!-- Quick Turn Floating Buttons -->
        <div class="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 pointer-events-auto">
            <button
                onclick={() => rotateQuick(-45)}
                class="size-10 rounded-full bg-black/70 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition cursor-pointer shadow-lg"
                title="Turn Left 45°"
                aria-label="Turn Left 45 degrees"
            >
                <span class="material-symbols-rounded text-[20px]">undo</span>
            </button>
            <button
                onclick={() => rotateQuick(45)}
                class="size-10 rounded-full bg-black/70 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition cursor-pointer shadow-lg"
                title="Turn Right 45°"
                aria-label="Turn Right 45 degrees"
            >
                <span class="material-symbols-rounded text-[20px]">redo</span>
            </button>
        </div>

        <!-- Bottom Controls & Waypoints Bar -->
        <div class="relative z-20 p-3 sm:p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pointer-events-none">
            <!-- Navigation Gesture Pill -->
            <div class="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-lg font-mono text-[9px] sm:text-[10px] text-white/80 uppercase pointer-events-auto">
                <span class="material-symbols-rounded text-[14px]" style="color: {brand.primaryColor};">navigation</span>
                <span>MOVE MOUSE TO LOOK • CLICK FLOOR ARROWS OR WASD</span>
            </div>

            <!-- Waypoint Rapid Teleport Pills -->
            <div class="pointer-events-auto flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-lg overflow-x-auto scrollbar-none">
                {#each waypoints as wp}
                    <button
                        onclick={() => selectWaypoint(wp)}
                        class="px-3 py-1 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider rounded-full transition cursor-pointer border shrink-0 {activeWaypointId === wp.id ? 'text-white border-transparent shadow-xs' : 'text-white/70 hover:text-white bg-white/5 border-transparent'}"
                        style="{activeWaypointId === wp.id ? `background-color: ${brand.primaryColor};` : ''}"
                        title="Go to {wp.zoneName}"
                    >
                        {wp.label}
                    </button>
                {/each}
            </div>
        </div>

        <!-- Mobile Touch Virtual D-Pad -->
        <div class="absolute bottom-20 left-4 z-30 sm:hidden pointer-events-auto flex flex-col items-center gap-1 bg-black/75 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-xl">
            <button
                ontouchstart={() => (dpadForward = true)}
                ontouchend={() => (dpadForward = false)}
                class="size-9 rounded-lg bg-white/15 text-white flex items-center justify-center active:bg-white/40 font-bold"
                aria-label="Forward"
            >
                ▲
            </button>
            <div class="flex items-center gap-1">
                <button
                    ontouchstart={() => (dpadLeft = true)}
                    ontouchend={() => (dpadLeft = false)}
                    class="size-9 rounded-lg bg-white/15 text-white flex items-center justify-center active:bg-white/40 font-bold"
                    aria-label="Left"
                >
                    ◀
                </button>
                <button
                    ontouchstart={() => (dpadBackward = true)}
                    ontouchend={() => (dpadBackward = false)}
                    class="size-9 rounded-lg bg-white/15 text-white flex items-center justify-center active:bg-white/40 font-bold"
                    aria-label="Backward"
                >
                    ▼
                </button>
                <button
                    ontouchstart={() => (dpadRight = true)}
                    ontouchend={() => (dpadRight = false)}
                    class="size-9 rounded-lg bg-white/15 text-white flex items-center justify-center active:bg-white/40 font-bold"
                    aria-label="Right"
                >
                    ▶
                </button>
            </div>
        </div>
    </div>
{/if}