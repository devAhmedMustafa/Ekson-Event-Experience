<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as THREE from "three";
    import { brand } from "$lib/brand.svelte";
    import { createBooth } from "$lib/three/booth";
    import { buildBoothTextures, invalidateBoothTextures } from "$lib/three/booth-textures";
    import {
        HALL,
        makeHall,
        makeGenericBooth,
        boothSlots,
        neighbourList,
        VISITOR_SLOT_INDEX
    } from "$lib/three/hall";
    import { envFor, disposeObject } from "$lib/three/env";
    import { QUALITY } from "$lib/three/quality";
    import { createRenderPath } from "$lib/three/render-path";
    import { roundedBox } from "$lib/three/props";
    import { mat } from "$lib/three/materials";

    let is3DActive = $state(false);
    let isPointerLocked = $state(false);
    let isArrived = $state(false);
    let isAutoWalking = $state(false);
    let speedMode = $state<"walk" | "run">("walk");
    let distanceToBooth = $state(0);
    let isMoving = $state(false);
    let showGestureHint = $state(true);
    let videoPreviewEl = $state<HTMLVideoElement | null>(null);
    let videoPreviewSrc = $state<string>("");

    let modalContainerEl = $state<HTMLElement | null>(null);
    let canvasEl = $state<HTMLCanvasElement | null>(null);
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let animationFrameId: number | null = null;
    let renderPath: any = null;
    let budgetClock = 0;

    let phoneInstance: any = null;
    let screenClock = 0;

    const PHONE_SCALE = 1.4;
    const PHONE_X = 0.16;
    const PHONE_Y = -0.136;
    const PHONE_ASPECT = 1112 / 626;

    // Movement & Collision Physics
    const EYE_HEIGHT = 1.66;
    const WALK_SPEED = 3.8;
    const RUN_SPEED = 6.6;
    const PLAYER_RADIUS = 0.42;
    const ARRIVE_RADIUS = 3.8;

    const playerPos = new THREE.Vector3(-HALL.width / 2 + 3.2, 0, 0);
    let yaw = Math.PI / 2; // Facing down +X aisle
    let pitch = 0;

    let pendingLookX = 0;
    let pendingLookY = 0;
    let isMouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const keysPressed: Record<string, boolean> = {};
    let colliders: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [];
    let targetBoothPos = new THREE.Vector3(16.5, 0, -7.6 + 3.6);
    let autoWalkLegs: THREE.Vector3[] = [];
    let autoWalkStall = 0;

    function freeze(root: THREE.Object3D) {
        root.updateMatrixWorld(true);
        root.traverse((o) => {
            o.matrixAutoUpdate = false;
        });
    }

    function resolveCollisions(
        pos: THREE.Vector3,
        boxes: { minX: number; maxX: number; minZ: number; maxZ: number }[],
        radius: number
    ) {
        for (let pass = 0; pass < 3; pass++) {
            let hit = false;
            for (const b of boxes) {
                const minX = b.minX - radius;
                const maxX = b.maxX + radius;
                const minZ = b.minZ - radius;
                const maxZ = b.maxZ + radius;
                if (pos.x <= minX || pos.x >= maxX || pos.z <= minZ || pos.z >= maxZ) continue;

                const dLeft = pos.x - minX;
                const dRight = maxX - pos.x;
                const dBack = pos.z - minZ;
                const dFront = maxZ - pos.z;
                const min = Math.min(dLeft, dRight, dBack, dFront);
                if (min === dLeft) pos.x = minX;
                else if (min === dRight) pos.x = maxX;
                else if (min === dBack) pos.z = minZ;
                else pos.z = maxZ;
                hit = true;
            }
            if (!hit) return;
        }
    }

    function makePhone() {
        const group = new THREE.Group();
        group.position.set(PHONE_X, PHONE_Y, -0.42);
        group.rotation.set(-0.42, -0.28, 0.12);
        group.scale.setScalar(PHONE_SCALE);

        // Body chassis
        const body = roundedBox(0.082, 0.168, 0.011, 0.012, mat.dark(0x14171d));
        group.add(body);

        // Metallic Rim
        const rim = roundedBox(0.086, 0.172, 0.008, 0.013, mat.metal(0x9aa0aa));
        rim.position.z = -0.002;
        group.add(rim);

        // Screen texture canvas
        const canvas = document.createElement("canvas");
        canvas.width = 360;
        canvas.height = 740;
        const ctx = canvas.getContext("2d")!;
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;

        const screen = new THREE.Mesh(
            new THREE.PlaneGeometry(0.072, 0.152),
            new THREE.MeshBasicMaterial({ map: texture, toneMapped: false })
        );
        screen.position.z = 0.0062;
        group.add(screen);

        group.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) o.renderOrder = 20;
        });

        return {
            group,
            ctx,
            texture,
            dispose() {
                texture.dispose();
            }
        };
    }

    function drawPhoneScreen(
        phone: any,
        playerP: THREE.Vector3,
        playerYaw: number,
        targetP: THREE.Vector3,
        slots: any[],
        visitorIndex: number,
        dist: number
    ) {
        const { ctx, texture } = phone;
        const W = 360;
        const H = 740;
        const accent = brand.primaryColor || "#009dd6";
        const companyName = brand.name || "EXHIBITOR";

        ctx.fillStyle = "#0d1017";
        ctx.fillRect(0, 0, W, H);

        /* status bar */
        ctx.fillStyle = "rgba(255,255,255,.55)";
        ctx.font = "600 17px 'Inter', sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("9:41", 20, 26);
        ctx.textAlign = "right";
        ctx.fillText("EXPO ▾ 5G ▮", W - 20, 26);

        /* header */
        ctx.fillStyle = accent;
        ctx.fillRect(0, 46, W, 96);
        ctx.fillStyle = "rgba(255,255,255,.78)";
        ctx.font = "600 14px 'Inter', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("NAVIGATING TO", 20, 74);
        ctx.fillStyle = "#fff";
        let px = 30;
        do {
            ctx.font = `700 ${px}px 'Space Grotesk', Inter, sans-serif`;
            if (ctx.measureText(companyName).width <= W - 40) break;
            px -= 1;
        } while (px > 14);
        ctx.fillText(companyName, 20, 108);

        /* map */
        const mapY = 158;
        const mapH = 330;
        ctx.fillStyle = "#151a24";
        ctx.fillRect(0, mapY, W, mapH);

        const pad = 18;
        const scale = Math.min((W - pad * 2) / HALL.width, (mapH - pad * 2) / HALL.depth);
        const toMapX = (x: number) => W / 2 + x * scale;
        const toMapY = (z: number) => mapY + mapH / 2 + z * scale;

        // hall outline + aisle
        ctx.strokeStyle = "rgba(255,255,255,.16)";
        ctx.lineWidth = 2;
        ctx.strokeRect(
            toMapX(-HALL.width / 2),
            toMapY(-HALL.depth / 2),
            HALL.width * scale,
            HALL.depth * scale
        );
        ctx.fillStyle = "rgba(255,255,255,.05)";
        ctx.fillRect(
            toMapX(-HALL.width / 2),
            toMapY(-HALL.aisleHalf),
            HALL.width * scale,
            HALL.aisleHalf * 2 * scale
        );

        // stands
        slots.forEach((slot, i) => {
            const isTarget = i === visitorIndex;
            const sw = 7 * scale;
            const sd = 6 * scale;
            ctx.fillStyle = isTarget ? accent : "rgba(255,255,255,.14)";
            ctx.fillRect(toMapX(slot.x) - sw / 2, toMapY(slot.z) - sd / 2, sw, sd);
            if (isTarget) {
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 2;
                ctx.strokeRect(toMapX(slot.x) - sw / 2, toMapY(slot.z) - sd / 2, sw, sd);
            }
        });

        // route
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(toMapX(playerP.x), toMapY(playerP.z));
        ctx.lineTo(toMapX(targetP.x), toMapY(targetP.z));
        ctx.stroke();
        ctx.setLineDash([]);

        // player arrow
        const pxx = toMapX(playerP.x);
        const pyy = toMapY(playerP.z);
        ctx.save();
        ctx.translate(pxx, pyy);
        ctx.rotate(-playerYaw + Math.PI);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(0, -11);
        ctx.lineTo(8, 9);
        ctx.lineTo(0, 4);
        ctx.lineTo(-8, 9);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        /* direction card */
        const cardY = mapY + mapH + 16;
        ctx.fillStyle = "#161b25";
        roundRect(ctx, 16, cardY, W - 32, 150, 20);
        ctx.fill();

        const bearing = Math.atan2(targetP.x - playerP.x, targetP.z - playerP.z);
        const rel = ((playerYaw - bearing + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

        const COMPASS_R = 50;
        ctx.save();
        ctx.translate(72, cardY + 74);
        ctx.rotate(rel);
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(0, -COMPASS_R);
        ctx.lineTo(COMPASS_R * 0.733, COMPASS_R * 0.733);
        ctx.lineTo(0, COMPASS_R / 3);
        ctx.lineTo(-COMPASS_R * 0.733, COMPASS_R * 0.733);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.textAlign = "left";
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 40px 'Space Grotesk', Inter, sans-serif";
        ctx.fillText(`${dist.toFixed(0)} m`, 140, cardY + 62);
        ctx.fillStyle = "rgba(255,255,255,.55)";
        ctx.font = "500 17px 'Inter', sans-serif";
        ctx.fillText(turnHint(rel, dist), 140, cardY + 96);
        ctx.fillStyle = "rgba(255,255,255,.35)";
        ctx.font = "500 14px 'Inter', sans-serif";
        ctx.fillText(`Stand B-14 · Hall 3`, 140, cardY + 120);

        /* arrival banner */
        if (dist < ARRIVE_RADIUS) {
            ctx.fillStyle = "#10b981";
            roundRect(ctx, 16, cardY, W - 32, 150, 20);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.font = "700 30px 'Space Grotesk', Inter, sans-serif";
            ctx.fillText("You have arrived", W / 2, cardY + 62);
            ctx.font = "500 17px 'Inter', sans-serif";
            ctx.fillText(`Welcome to ${companyName}`, W / 2, cardY + 96);
        }

        /* home bar */
        ctx.fillStyle = "rgba(255,255,255,.3)";
        roundRect(ctx, W / 2 - 60, H - 22, 120, 6, 3);
        ctx.fill();

        texture.needsUpdate = true;
    }

    function turnHint(rel: number, dist: number) {
        if (dist < ARRIVE_RADIUS) return "You have arrived";
        const deg = (rel * 180) / Math.PI;
        if (Math.abs(deg) < 18) return "Straight ahead";
        if (deg > 140 || deg < -140) return "Turn around";
        return deg > 0 ? "Bear right" : "Bear left";
    }

    function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
    }

    // Minimap Radar
    let radarX = $state(15);
    let radarY = $state(50);
    let radarAngle = $state(0);

    // Floor Wayfinding Path & Beacon
    const PATH_POINTS = 64;
    let pathLineMesh: THREE.Line | null = null;
    let beaconGroup: THREE.Group | null = null;

    function requestCanvasPointerLock() {
        if (canvasEl && typeof document !== "undefined" && document.pointerLockElement !== canvasEl) {
            try {
                canvasEl.requestPointerLock();
            } catch (err) {
                // Fallback for browsers with restricted pointerlock
            }
        }
    }

    function onPointerLockChange() {
        isPointerLocked = typeof document !== "undefined" && document.pointerLockElement === canvasEl;
    }

    function open3DWalkthrough() {
        is3DActive = true;
        setTimeout(() => {
            initThreeScene();
        }, 60);
    }

    function close3DWalkthrough() {
        if (typeof document !== "undefined" && document.exitPointerLock) {
            document.exitPointerLock();
        }
        is3DActive = false;
        cleanupThreeScene();
    }

    function routeTo(from: THREE.Vector3): THREE.Vector3[] {
        const turnIn = new THREE.Vector3(targetBoothPos.x, 0, 0);
        if (Math.abs(from.x - targetBoothPos.x) < 1.4) return [targetBoothPos.clone()];
        return [turnIn, targetBoothPos.clone()];
    }

    function triggerAutoWalk() {
        isAutoWalking = true;
        isArrived = false;
        autoWalkLegs = routeTo(playerPos);
        autoWalkStall = 0;
    }

    function stopAutoWalk() {
        isAutoWalking = false;
        autoWalkLegs = [];
        autoWalkStall = 0;
    }

    function respawnAtEntrance() {
        playerPos.set(-HALL.width / 2 + 3.2, 0, 0);
        yaw = Math.PI / 2;
        pitch = 0;
        isArrived = false;
        stopAutoWalk();
    }

    function makeBeacon(accent: THREE.Color) {
        const g = new THREE.Group();
        const pin = new THREE.Mesh(
            new THREE.ConeGeometry(0.46, 1.2, 24),
            new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.95, roughness: 0.35 })
        );
        pin.rotation.x = Math.PI;
        g.add(pin);

        const ball = new THREE.Mesh(
            new THREE.SphereGeometry(0.44, 24, 16),
            new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.6, roughness: 0.3 })
        );
        ball.position.y = 0.65;
        pin.add(ball);

        const halo = new THREE.Mesh(
            new THREE.TorusGeometry(1.1, 0.04, 8, 48),
            new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.6 })
        );
        halo.rotation.x = Math.PI / 2;
        halo.position.y = -1.3;
        g.add(halo);

        return g;
    }

    function makePathLine(accent: THREE.Color) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3 * PATH_POINTS), 3));
        const material = new THREE.LineDashedMaterial({
            color: accent,
            dashSize: 0.6,
            gapSize: 0.4,
            transparent: true,
            opacity: 0.95,
            depthTest: false,
            depthWrite: false
        });
        const line = new THREE.Line(geometry, material);
        line.renderOrder = 10;
        line.frustumCulled = false;
        return line;
    }

    function updatePathLine(line: THREE.Line, from: THREE.Vector3, waypoints: THREE.Vector3[], t: number) {
        const pts = [from, ...waypoints];
        const legs: number[] = [];
        let total = 0;
        for (let i = 1; i < pts.length; i++) {
            const len = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
            legs.push(len);
            total += len;
        }

        const pos = line.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < PATH_POINTS; i++) {
            let travel = (i / (PATH_POINTS - 1)) * total;
            let leg = 0;
            while (leg < legs.length - 1 && travel > legs[leg]) travel -= legs[leg++];
            const s = legs[leg] > 1e-4 ? travel / legs[leg] : 0;
            const a = pts[leg];
            const b = pts[leg + 1];
            pos.setXYZ(
                i,
                a.x + (b.x - a.x) * s,
                0.05 + Math.sin((i / (PATH_POINTS - 1)) * 10 - t * 3.2) * 0.015,
                a.z + (b.z - a.z) * s
            );
        }
        pos.needsUpdate = true;
        line.computeLineDistances();
    }

    async function initThreeScene() {
        if (typeof window === "undefined" || !canvasEl || !modalContainerEl) return;
        cleanupThreeScene();

        const w = modalContainerEl.clientWidth;
        const h = modalContainerEl.clientHeight;

        scene = new THREE.Scene();
        scene.background = new THREE.Color("#252b34");
        scene.fog = new THREE.Fog("#252b34", 30, 78);

        camera = new THREE.PerspectiveCamera(72, w / h, 0.15, 140);
        camera.rotation.order = "YXZ";

        renderer = new THREE.WebGLRenderer({
            canvas: canvasEl,
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
        renderer.shadowMap.enabled = QUALITY.shadows;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMap.autoUpdate = false; // Static Shadow Caching Optimization
        renderer.shadowMap.needsUpdate = true;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;

        // Lighting Rig
        const ambient = new THREE.HemisphereLight("#dde6f8", "#4a5260", 0.95);
        scene.add(ambient);

        const overhead = new THREE.DirectionalLight("#fff2df", 1.3);
        overhead.position.set(10, 22, 6);
        overhead.castShadow = QUALITY.shadows;
        const hallShadowMap = Math.min(QUALITY.shadowMapSize, 2048);
        overhead.shadow.mapSize.set(hallShadowMap, hallShadowMap);
        overhead.shadow.camera.near = 2;
        overhead.shadow.camera.far = 70;
        overhead.shadow.camera.left = -30;
        overhead.shadow.camera.right = 30;
        overhead.shadow.camera.top = 22;
        overhead.shadow.camera.bottom = -22;
        overhead.shadow.bias = -0.0009;
        overhead.shadow.normalBias = 0.045;
        overhead.shadow.radius = QUALITY.softShadows ? 3 : 1;
        scene.add(overhead);

        const bounce = new THREE.DirectionalLight("#c9d8ff", 0.42);
        bounce.position.set(-14, 8, -10);
        scene.add(bounce);

        // Deducted Brand Accent Colors
        const accentHex = brand.primaryColor || "#009dd6";
        const accentColor = new THREE.Color(accentHex);
        const darkAccentHex = brand.darkColor || "#04547c";

        // Build Entire Exhibition Hall
        const hall = makeHall({ accent: accentHex });
        scene.add(hall);
        freeze(hall);

        // Build All 8 Stands (Visitor's Branded Stand at Slot 3)
        const slots = boothSlots();
        const neighbours = neighbourList();
        colliders = [];
        const visitorSlot = slots[VISITOR_SLOT_INDEX];
        targetBoothPos.set(visitorSlot.x, 0, visitorSlot.z + (visitorSlot.rotation === 0 ? 1 : -1) * 3.6);

        invalidateBoothTextures();
        const tex = await buildBoothTextures();
        let n = 0;

        slots.forEach((slot, i) => {
            const group =
                i === VISITOR_SLOT_INDEX
                    ? createBooth(tex, {
                          accent: accentHex,
                          darkAccent: darkAccentHex,
                          lightAccent: brand.lightTint,
                          palette: brand.palette,
                          detail: "high"
                      })
                    : makeGenericBooth(neighbours[n++ % neighbours.length]);
            group.position.set(slot.x, 0, slot.z);
            group.rotation.y = slot.rotation;
            if (scene) scene.add(group);
            freeze(group);

            const halfW = 3.5;
            const backDepth = 4.0;
            const zSign = slot.rotation === 0 ? -1 : 1;
            colliders.push({
                minX: slot.x - halfW,
                maxX: slot.x + halfW,
                minZ: Math.min(slot.z + zSign * 3, slot.z + zSign * (3 - backDepth)),
                maxZ: Math.max(slot.z + zSign * 3, slot.z + zSign * (3 - backDepth))
            });
        });

        // Hall Colliders
        colliders.push(...((hall.userData.obstacles as any) ?? []));
        const HW = HALL.width / 2 - 0.6;
        const HD = HALL.depth / 2 - 0.6;
        colliders.push({ minX: -1e3, maxX: 1e3, minZ: -1e3, maxZ: -HD });
        colliders.push({ minX: -1e3, maxX: 1e3, minZ: HD, maxZ: 1e3 });
        colliders.push({ minX: -1e3, maxX: -HW, minZ: -1e3, maxZ: 1e3 });
        colliders.push({ minX: HW, maxX: 1e3, minZ: -1e3, maxZ: 1e3 });

        // Overhead Waypoint Beacon over Visitor Stand
        beaconGroup = makeBeacon(accentColor);
        beaconGroup.position.set(visitorSlot.x, 5.2, visitorSlot.z);
        scene.add(beaconGroup);

        // Floor Wayfinding Breadcrumb Path Line
        pathLineMesh = makePathLine(accentColor);
        scene.add(pathLineMesh);

        // Hand holding Phone in First Person view
        phoneInstance = makePhone();
        if (camera) {
            camera.add(phoneInstance.group);
            scene.add(camera);
        }

        // Render Path / Post Processing
        renderPath = createRenderPath(renderer, scene, camera, {
            aoRadius: 0.7,
            aoIntensity: 0.9,
            aoThickness: 1.0,
            aoSamples: 6,
            bloomStrength: 0.16,
            bloomThreshold: 0.92,
            bloomRadius: 0.6,
            vignetteDarkness: 1.12,
            vignetteOffset: 0.98
        });

        // Env reflection
        envFor(renderer).then((env) => {
            if (scene) {
                scene.environment = env;
                scene.environmentIntensity = QUALITY.envMapIntensity * 0.35;
            }
            if (renderer) renderer.shadowMap.needsUpdate = true;
        });

        // Event Listeners
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("pointerup", handlePointerUp);
        window.addEventListener("blur", handleBlur);
        if (canvasEl) {
            canvasEl.addEventListener("pointerdown", handleCanvasPointerDown);
        }
        if (typeof document !== "undefined") {
            document.addEventListener("pointerlockchange", onPointerLockChange);
            document.addEventListener("visibilitychange", handleBlur);
        }

        // Animation Loop
        let clock = new THREE.Clock();
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        const move = new THREE.Vector3();
        const prev = new THREE.Vector3();
        let stepCycle = 0;

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const dt = Math.min(clock.getDelta(), 0.05);
            const t = clock.getElapsedTime();

            // 1. Process concurrent mouse look
            if (pendingLookX !== 0 || pendingLookY !== 0) {
                yaw -= pendingLookX;
                pitch = Math.max(-1.15, Math.min(1.15, pitch - pendingLookY));
                pendingLookX = 0;
                pendingLookY = 0;
            }

            // 2. Auto-walk Autopilot
            if (isAutoWalking && !isArrived) {
                while (autoWalkLegs.length > 1 && autoWalkLegs[0].distanceTo(playerPos) < 1.4) {
                    autoWalkLegs.shift();
                }
                const leg = autoWalkLegs[0] ?? targetBoothPos;
                const desired = Math.atan2(leg.x - playerPos.x, leg.z - playerPos.z);
                let delta = ((desired - yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
                yaw += delta * Math.min(1, dt * 5.2);
                pitch *= Math.max(0, 1 - dt * 4);

                prev.copy(playerPos);
                playerPos.x += Math.sin(yaw) * WALK_SPEED * dt;
                playerPos.z += Math.cos(yaw) * WALK_SPEED * dt;
                resolveCollisions(playerPos, colliders, PLAYER_RADIUS);

                if (prev.distanceTo(playerPos) < WALK_SPEED * dt * 0.25) {
                    autoWalkStall += dt;
                    if (autoWalkStall > 1.2) stopAutoWalk();
                } else {
                    autoWalkStall = 0;
                }
                isMoving = true;
                stepCycle += dt * 9;
            } else {
                // 3. Manual Keyboard Movement aligned with current yaw
                forward.set(Math.sin(yaw), 0, Math.cos(yaw));
                right.set(-forward.z, 0, forward.x);

                let inputX = 0;
                let inputZ = 0;
                if (keysPressed["KeyW"] || keysPressed["ArrowUp"]) inputZ += 1;
                if (keysPressed["KeyS"] || keysPressed["ArrowDown"]) inputZ -= 1;
                if (keysPressed["KeyA"] || keysPressed["ArrowLeft"]) inputX -= 1;
                if (keysPressed["KeyD"] || keysPressed["ArrowRight"]) inputX += 1;

                if (inputX !== 0 || inputZ !== 0) {
                    if (isAutoWalking) stopAutoWalk();
                    move.set(0, 0, 0);
                    move.addScaledVector(forward, inputZ);
                    move.addScaledVector(right, inputX);
                    move.normalize();

                    const isRunning = keysPressed["ShiftLeft"] || keysPressed["ShiftRight"] || speedMode === "run";
                    const currentSpeed = isRunning ? RUN_SPEED : WALK_SPEED;
                    move.multiplyScalar(currentSpeed * dt);

                    playerPos.x += move.x;
                    playerPos.z += move.z;
                    resolveCollisions(playerPos, colliders, PLAYER_RADIUS);

                    isMoving = true;
                    stepCycle += dt * (isRunning ? 14 : 9);
                } else {
                    isMoving = false;
                }
            }

            // Head bob
            const bob = isMoving ? Math.sin(stepCycle) * 0.024 : 0;

            // Camera orientation (YXZ Euler: yaw + PI looks along forward vector)
            if (camera) {
                camera.position.set(playerPos.x, EYE_HEIGHT + bob, playerPos.z);
                camera.rotation.y = yaw + Math.PI;
                camera.rotation.x = pitch;
            }

            // Distance Telemetry
            const dist = Math.hypot(playerPos.x - targetBoothPos.x, playerPos.z - targetBoothPos.z);
            distanceToBooth = Math.round(dist * 10) / 10;
            if (dist < ARRIVE_RADIUS) {
                isArrived = true;
                if (isAutoWalking) stopAutoWalk();
            } else {
                isArrived = false;
            }

            // Radar Calculation
            radarX = ((playerPos.x + HALL.width / 2) / HALL.width) * 100;
            radarY = ((playerPos.z + HALL.depth / 2) / HALL.depth) * 100;
            radarAngle = Math.atan2(Math.sin(yaw), Math.cos(yaw)) * (180 / Math.PI) - 90;

            // Beacon Halo Animation
            if (beaconGroup) {
                const s = 1.0 + Math.sin(t * 3.5) * 0.08;
                beaconGroup.scale.set(s, s, s);
                beaconGroup.rotation.y = t * 0.8;
            }

            // Wayfinding Floor Line
            if (pathLineMesh) {
                const route = routeTo(playerPos);
                updatePathLine(pathLineMesh, playerPos, route, t);
            }

            // Phone in hand sway & live navigation screen
            if (phoneInstance) {
                phoneInstance.group.rotation.z = 0.12 + Math.sin(stepCycle * 0.5) * 0.02;
                phoneInstance.group.position.y = PHONE_Y + Math.sin(stepCycle) * 0.006;

                screenClock += dt;
                if (screenClock > 1 / 12) {
                    screenClock = 0;
                    drawPhoneScreen(phoneInstance, playerPos, yaw, targetBoothPos, slots, VISITOR_SLOT_INDEX, distanceToBooth);
                }
            }

            // Frame budget guard for post processing
            budgetClock += dt;
            if (budgetClock > 2 && renderPath?.enabled) {
                budgetClock = 0;
                const dropped = renderPath.degrade();
                if (dropped) console.info(`[walkthrough] dropped ${dropped} to hold frame rate`);
            }

            if (renderPath) {
                renderPath.render();
            } else if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }
        };

        animate();
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (!is3DActive) return;
        const movementCodes = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"];
        if (movementCodes.includes(e.code)) {
            e.preventDefault();
        }
        keysPressed[e.code] = true;
        if (e.code === "Escape") {
            if (typeof document !== "undefined" && document.exitPointerLock) {
                document.exitPointerLock();
            }
        }
        if (e.code === "KeyR") {
            respawnAtEntrance();
        }
    }

    function handleKeyUp(e: KeyboardEvent) {
        if (!is3DActive) return;
        keysPressed[e.code] = false;
    }

    function handleCanvasPointerDown(e: PointerEvent) {
        if (!is3DActive) return;
        if (e.pointerType === "touch" || (e.button !== undefined && e.button !== 0)) return;
        isMouseDown = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        showGestureHint = false;
        requestCanvasPointerLock();
    }

    function handlePointerUp() {
        isMouseDown = false;
    }

    function handleMouseMove(e: MouseEvent) {
        if (!is3DActive) return;
        showGestureHint = false;
        const isLocked = typeof document !== "undefined" && document.pointerLockElement === canvasEl;

        if (isLocked) {
            // Unconditional pointer lock mouse look
            pendingLookX += e.movementX * 0.0022;
            pendingLookY += e.movementY * 0.0022;
        } else if (isMouseDown || e.buttons === 1) {
            // Drag to look fallback
            const dx = e.movementX || (e.clientX - lastMouseX);
            const dy = e.movementY || (e.clientY - lastMouseY);
            pendingLookX += dx * 0.0035;
            pendingLookY += dy * 0.0035;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
    }

    function onWindowResize() {
        if (!is3DActive || !modalContainerEl || !renderer || !camera) return;
        const w = modalContainerEl.clientWidth;
        const h = modalContainerEl.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        renderPath?.setSize(w, h);
    }

    function handleBlur() {
        for (const k in keysPressed) {
            keysPressed[k] = false;
        }
        isMouseDown = false;
        pendingLookX = 0;
        pendingLookY = 0;
    }

    function cleanupThreeScene() {
        if (typeof window === "undefined") return;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener("resize", onWindowResize);
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("blur", handleBlur);
        if (canvasEl) {
            canvasEl.removeEventListener("pointerdown", handleCanvasPointerDown);
        }
        if (typeof document !== "undefined") {
            document.removeEventListener("pointerlockchange", onPointerLockChange);
            document.removeEventListener("visibilitychange", handleBlur);
        }
        phoneInstance?.dispose();
        phoneInstance = null;
        renderPath?.dispose();
        renderPath = null;
        renderer?.dispose();
        if (scene) disposeObject(scene);
    }

    onMount(() => {
        window.addEventListener("resize", onWindowResize);
        if (typeof window !== "undefined" && "IntersectionObserver" in window) {
            const videoObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            if (!videoPreviewSrc) {
                                videoPreviewSrc = "/Walkthrough-demo.mp4";
                            }
                            videoPreviewEl?.play().catch(() => {});
                        } else {
                            videoPreviewEl?.pause();
                        }
                    });
                },
                { threshold: 0.1 }
            );
            if (videoPreviewEl) videoObserver.observe(videoPreviewEl);
            return () => videoObserver.disconnect();
        } else {
            videoPreviewSrc = "/Walkthrough-demo.mp4";
        }
    });

    onDestroy(() => {
        cleanupThreeScene();
    });
</script>

<div class="w-full flex flex-col">
    <!-- Standalone Hero Walkthrough Launch Card -->
    <div class="w-full min-h-[100dvh] md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex flex-col justify-between select-none font-sans overflow-hidden">
        <!-- Section Header -->
        <div class="flex items-end justify-between pb-2 border-b border-black/5 shrink-0 w-full mb-2 sm:mb-3">
            <div>
                <div class="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest font-bold mb-0.5" style="color: {brand.primaryColor};">
                    <span class="size-1.5 rounded-full" style="background-color: {brand.primaryColor};"></span>
                    <span>04 / Exhibition Walkthrough</span>
                </div>
                <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-text tracking-tight uppercase">
                    1:1 First-Person Hall Walkthrough
                </h2>
                <p class="text-[11px] sm:text-xs text-text/70 mt-0.5 max-w-xl">
                    Walk through the entire 52m exhibition venue in first-person. Interactive spatial wayfinding routes visitors directly to the {brand.name} stand.
                </p>
            </div>

            <div class="hidden sm:flex items-center gap-2 font-mono text-[10px] text-text/50">
                <span class="size-2 rounded-full animate-pulse" style="background-color: {brand.primaryColor};"></span>
                <span>HALL 3 · LIVE 3D NAVIGATION</span>
            </div>
        </div>

        <!-- Showcase Container Box: Swaps between Video Preview (when inactive) and Bounded Live 3D Walkthrough (when active) -->
        <div
            class="relative w-full flex-1 max-h-[74vh] md:max-h-[78vh] h-[52vh] sm:h-[58vh] md:h-[65vh] my-auto bg-slate-950 rounded-2xl overflow-hidden border border-black/10 shadow-lg group flex items-center justify-center"
            bind:this={modalContainerEl}
        >
            {#if !is3DActive}
                <!-- Video Preview Showcase Container with Floating Launch Action -->
                <!-- svelte-ignore a11y_media_has_caption -->
                <video
                    bind:this={videoPreviewEl}
                    class="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition duration-500"
                    src={videoPreviewSrc}
                    preload="none"
                    autoplay
                    muted
                    loop
                    playsinline
                ></video>

                <!-- Center Launch Overlay & Information Badge -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/60 flex flex-col items-center justify-center p-4 text-center">
                    <!-- Venue Badge -->
                    <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white font-mono text-[10px] uppercase tracking-widest mb-3">
                        <span class="size-2 rounded-full animate-pulse" style="background-color: {brand.primaryColor};"></span>
                        <span>{brand.name} Stand · Slot B-14</span>
                    </div>

                    <h3 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white uppercase tracking-tight max-w-lg drop-shadow-md">
                        Explore Exhibition Hall 3
                    </h3>
                    <p class="text-xs sm:text-sm text-white/80 max-w-md mt-1.5 mb-6 font-sans">
                        Navigate the aisles with free mouse-look, collision physics, and live AR wayfinding beacons.
                    </p>

                    <!-- Primary Launch Button -->
                    <button
                        onclick={open3DWalkthrough}
                        class="group/btn relative px-7 py-3 text-white font-mono font-bold text-xs sm:text-sm uppercase tracking-widest rounded-2xl shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer border border-white/20"
                        style="background-color: {brand.primaryColor};"
                    >
                        <span class="material-symbols-rounded text-lg">directions_walk</span>
                        <span>Enter 3D Walkthrough</span>
                        <span class="material-symbols-rounded text-base opacity-70 group-hover/btn:translate-x-0.5 transition">arrow_forward</span>
                    </button>
                </div>

                <!-- Bottom Left Telemetry Preview -->
                <div class="absolute bottom-4 left-4 hidden sm:flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white font-mono text-[10px]">
                    <span class="material-symbols-rounded text-sm" style="color: {brand.primaryColor};">radar</span>
                    <span>HALL DIMENSIONS: 52 × 30 METRES</span>
                </div>
            {:else}
                <!-- LIVE 3D WALKTHROUGH (BOUNDED IN THIS CONTAINER BOX) -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <canvas
                    bind:this={canvasEl}
                    class="w-full h-full block cursor-crosshair outline-none"
                ></canvas>

                <!-- Top HUD Header: Badges & Controls Toolbar -->
                <div class="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none z-20">
                    <!-- Left Title & Subtitle Badge -->
                    <div class="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-black/10 shadow-xs flex flex-col pointer-events-auto">
                        <div class="flex items-center gap-1.5">
                            <span class="size-2 rounded-full animate-pulse" style="background-color: {brand.primaryColor};"></span>
                            <span class="font-mono text-[9px] uppercase tracking-wider font-bold text-text">
                                Venue Navigation · Hall 3
                            </span>
                        </div>
                        <span class="text-[11px] font-black uppercase text-text tracking-tight mt-0.5">
                            {brand.name} Island Stand
                        </span>
                    </div>

                    <!-- Center Distance to Stand Meter -->
                    <div class="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-black/10 shadow-xs flex items-center gap-2 pointer-events-auto">
                        <span class="material-symbols-rounded text-[16px]" style="color: {brand.primaryColor};">near_me</span>
                        <div class="flex flex-col text-left">
                            <span class="text-[8px] font-mono uppercase tracking-wider text-text/60 font-bold">Distance</span>
                            <span class="text-[11px] font-mono font-black text-text">{distanceToBooth} m</span>
                        </div>
                    </div>

                    <!-- Right Controls Toolbar -->
                    <div class="flex items-center gap-1.5 pointer-events-auto">
                        <!-- Autopilot Walk Button -->
                        <button
                            onclick={triggerAutoWalk}
                            class="px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition flex items-center gap-1.5 shadow-xs border cursor-pointer {isAutoWalking ? 'bg-primary text-white border-primary' : 'bg-white/90 text-text border-black/10 hover:bg-white'}"
                            style={isAutoWalking ? `background-color: ${brand.primaryColor}; border-color: ${brand.primaryColor};` : ''}
                        >
                            <span class="material-symbols-rounded text-[14px]">
                                {isAutoWalking ? 'navigation' : 'route'}
                            </span>
                            <span class="hidden sm:inline">
                                {isAutoWalking ? 'Navigating…' : 'Walk Me to Stand'}
                            </span>
                        </button>

                        <!-- Respawn Entrance Button -->
                        <button
                            onclick={respawnAtEntrance}
                            class="px-2.5 py-1.5 bg-white/90 hover:bg-white text-text border border-black/10 rounded-xl text-[10px] font-mono font-bold uppercase shadow-xs transition cursor-pointer flex items-center gap-1.5"
                            title="Back to Entrance (R)"
                        >
                            <span class="material-symbols-rounded text-[14px]">replay</span>
                            <span class="hidden sm:inline">Entrance</span>
                        </button>

                        <!-- Close / Exit 3D Mode -->
                        <button
                            onclick={close3DWalkthrough}
                            class="p-1.5 bg-white/90 hover:bg-rose-600 hover:text-white text-text border border-black/10 rounded-xl shadow-xs transition cursor-pointer"
                            title="Exit 3D Mode (ESC)"
                        >
                            <span class="material-symbols-rounded text-[16px]">close</span>
                        </button>
                    </div>
                </div>

                <!-- Crosshair Cursor -->
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div class="relative size-4 flex items-center justify-center">
                        <span class="size-1 rounded-full bg-white shadow-xs opacity-90"></span>
                        <span class="absolute w-3 h-0.5 bg-white/50"></span>
                        <span class="absolute h-3 w-0.5 bg-white/50"></span>
                    </div>
                </div>

                <!-- Arrival Celebration Banner -->
                {#if isArrived}
                    <div class="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl border border-emerald-500/40 shadow-lg text-center flex items-center gap-2.5 animate-bounce">
                        <span class="material-symbols-rounded text-xl text-emerald-500">check_circle</span>
                        <div class="flex flex-col text-left">
                            <span class="text-[9px] font-mono uppercase tracking-widest text-emerald-600 font-bold">You Have Arrived</span>
                            <span class="text-xs font-black uppercase text-text tracking-tight">{brand.name} Exhibition Stand</span>
                        </div>
                    </div>
                {/if}

                <!-- Bottom Left Minimap Radar Card -->
                <div class="absolute bottom-3 left-3 z-20 bg-white/90 backdrop-blur-md p-2 rounded-xl border border-black/10 shadow-xs flex flex-col gap-1 w-40 sm:w-48 pointer-events-auto">
                    <div class="flex items-center justify-between font-mono text-[8px] text-text/60 font-bold uppercase">
                        <span>VENUE RADAR</span>
                        <span class="font-bold" style="color: {brand.primaryColor};">HALL 3</span>
                    </div>
                    <!-- Radar Canvas Container -->
                    <div class="relative w-full h-20 sm:h-24 bg-slate-950 rounded-lg overflow-hidden border border-black/10">
                        <!-- Hall Aisle Lines -->
                        <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 bg-white/5 border-y border-white/10"></div>
                        <!-- 8 Booth Marker Boxes -->
                        <div class="absolute top-2 left-3 w-6 h-4 bg-white/10 rounded-xs border border-white/15"></div>
                        <div class="absolute top-2 left-11 w-6 h-4 bg-white/10 rounded-xs border border-white/15"></div>
                        <div class="absolute top-2 left-19 w-6 h-4 bg-white/10 rounded-xs border border-white/15"></div>
                        <!-- Destination Stand (Slot 3) -->
                        <div class="absolute top-2 right-3 w-7 h-5 rounded-xs border animate-pulse" style="background-color: {brand.primaryColor}50; border-color: {brand.primaryColor};">
                            <span class="absolute inset-0 flex items-center justify-center text-[6px] font-mono font-bold text-white uppercase">YOU</span>
                        </div>

                        <div class="absolute bottom-2 left-3 w-6 h-4 bg-white/10 rounded-xs border border-white/15"></div>
                        <div class="absolute bottom-2 left-11 w-6 h-4 bg-white/10 rounded-xs border border-white/15"></div>
                        <div class="absolute bottom-2 left-19 w-6 h-4 bg-white/10 rounded-xs border border-white/15"></div>
                        <div class="absolute bottom-2 right-3 w-6 h-4 bg-white/10 rounded-xs border border-white/15"></div>

                        <!-- Player Minimap Dot Indicator -->
                        <div
                            class="absolute size-2 bg-rose-500 rounded-full border border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 z-10"
                            style="left: {((playerPos.x + HALL.width / 2) / HALL.width) * 100}%; top: {((playerPos.z + HALL.depth / 2) / HALL.depth) * 100}%;"
                        ></div>
                    </div>
                </div>

                <!-- Bottom Right Controls Help Box -->
                <div class="absolute bottom-3 right-3 hidden sm:flex flex-col gap-0.5 bg-black/75 backdrop-blur-md p-2 rounded-xl border border-white/10 text-white font-mono text-[8.5px] pointer-events-auto">
                    <span class="font-bold text-[7.5px] uppercase text-white/50 mb-0.5">CONTROLS GUIDE</span>
                    <div class="flex items-center justify-between gap-3">
                        <span class="text-white/70">Movement:</span>
                        <span class="font-bold">WASD / Arrows</span>
                    </div>
                    <div class="flex items-center justify-between gap-3">
                        <span class="text-white/70">Look Around:</span>
                        <span class="font-bold">Mouse Drag / Lock</span>
                    </div>
                    <div class="flex items-center justify-between gap-3">
                        <span class="text-white/70">Sprint:</span>
                        <span class="font-bold">Shift</span>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Bottom Status Bar -->
        <div class="flex items-center justify-between text-[9px] font-mono text-text/50 pt-1 border-t border-black/5 shrink-0">
            <span>WASD OR ARROWS TO WALK · CLICK TO LOCK CURSOR · ESC TO UNLOCK</span>
            <span class="hidden sm:inline">DEDUCTED BRAND COLORING APPLIED</span>
        </div>
    </div>
</div>