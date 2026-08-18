<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as THREE from "three";
    import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
    import { brand } from "$lib/brand.svelte";

    interface Hotspot {
        id: number;
        title: string;
        subtitle: string;
        description: string;
        specs: string[];
        pos: [number, number, number];
        cameraPos: [number, number, number];
        cameraLook: [number, number, number];
    }

    interface CameraPreset {
        id: string;
        label: string;
        title: string;
        pos: [number, number, number];
        look: [number, number, number];
    }

    const hotspots: Hotspot[] = [
        {
            id: 1,
            title: "VIP Lounge & Discussion Zone",
            subtitle: "Acoustic Seating & Planter Divider",
            description: "Dedicated client engagement zone featuring modern Scandinavian seating, quartz discussion tables, and integrated low foliage acoustic planters with brand signage.",
            specs: ["4x Designer Armchairs", "2x Quartz Discussion Tables", "Built-in Greenery Divider", "Low Ambient Luminescence"],
            pos: [-1.4, 0.85, 0.8],
            cameraPos: [-2.6, 2.0, 2.8],
            cameraLook: [-1.2, 0.6, 0.6]
        },
        {
            id: 2,
            title: "Iconic Overhead C-Canopy",
            subtitle: "3D Brand Signage & Logo Medallion",
            description: "Signature sweeping curved canopy engineered with primary brand trim, 3D illuminated dimensional brand typography, illuminated logo medallion, and recessed LED downlights.",
            specs: ["Sweeping 4.8m Span", "3D Illuminated Brand Sign", "Illuminated Logo Medallion", "12x Recessed Downlight Spots"],
            pos: [0.0, 3.2, 0.4],
            cameraPos: [0.0, 3.4, 4.6],
            cameraLook: [0.0, 2.8, 0.0]
        },
        {
            id: 3,
            title: "4K Interactive Video Wall",
            subtitle: "Curved Ultra-HD LED Matrix",
            description: "High-density seamless LED video wall showcasing real-time spatial simulations, analytics dashboards, brand logo branding, and interactive product presentations.",
            specs: ["Seamless MicroLED Panel", "Real-Time 60FPS Playback", "Integrated Touch Controller", "HDR Contrast Tuned"],
            pos: [1.3, 1.7, -1.5],
            cameraPos: [1.1, 1.8, 1.8],
            cameraLook: [1.3, 1.6, -1.4]
        },
        {
            id: 4,
            title: "Biophilic Green Wall",
            subtitle: "Living Moss & Halo Logo Emblem",
            description: "Sustainable preserved forest moss vertical wall accented with natural oak architectural timber slats and a prominent halo back-illuminated brand logo badge.",
            specs: ["Natural Preserved Moss", "Solid Oak Slats", "Halo Backlit Brand Emblem", "Zero-Maintenance"],
            pos: [-1.8, 1.6, -1.2],
            cameraPos: [-2.4, 1.7, 1.2],
            cameraLook: [-1.7, 1.5, -1.0]
        },
        {
            id: 5,
            title: "Concierge Reception Desk",
            subtitle: "Curved Counter & Front Logo Badge",
            description: "Organic ribbon-contour greeting counter with natural oak ribbing, glowing front brand logo badge, frosted illuminated glass counter, and integrated digital attendee check-in tablet.",
            specs: ["Ribbon Curve Geometry", "Front Illuminated Logo", "Under-Counter LED Glow", "Tablet Check-In Pod"],
            pos: [2.5, 0.8, 1.2],
            cameraPos: [3.4, 1.8, 2.8],
            cameraLook: [2.3, 0.7, 0.9]
        },
        {
            id: 6,
            title: "Digital Signage Totems",
            subtitle: "65\" Ultra-Slim Interactive Kiosks",
            description: "Dual freestanding vertical digital signage pillars providing instant wayfinding, session schedules, brand logo headers, and touchless WebAR activation QR codes.",
            specs: ["65\" 4K Touch Displays", "Brand Logo Top Header", "WebAR QR Activators", "Dual-Sided Luminescence"],
            pos: [3.1, 1.6, -0.4],
            cameraPos: [3.6, 2.0, 1.2],
            cameraLook: [2.9, 1.4, -0.3]
        },
        {
            id: 7,
            title: "Interactive Demo Podiums",
            subtitle: "Angled Spatial Kiosk Stations",
            description: "Ergonomically angled touchscreen demo stations enabling visitors to explore 3D product configurations and dynamic brand quiz modules.",
            specs: ["45° Ergonomic Pitch", "Capacitive Multi-Touch", "Real-Time 3D Rendering", "Instant Data Capture"],
            pos: [-0.4, 0.9, -1.6],
            cameraPos: [-0.3, 1.8, 0.6],
            cameraLook: [-0.4, 0.8, -1.5]
        }
    ];

    const presets: CameraPreset[] = [
        { id: "iso", label: "01 ISO", title: "Isometric Overview", pos: [5.2, 4.0, 5.2], look: [0, 1.0, 0] },
        { id: "front", label: "02 FRONT", title: "Main Entrance", pos: [0.0, 2.3, 5.6], look: [0, 1.1, 0] },
        { id: "lounge", label: "03 LOUNGE", title: "VIP Discussion Area", pos: [-2.8, 2.0, 2.9], look: [-1.2, 0.6, 0.6] },
        { id: "reception", label: "04 DESK", title: "Welcome Reception", pos: [3.5, 1.8, 2.7], look: [2.2, 0.7, 0.8] },
        { id: "canopy", label: "05 CANOPY", title: "Overhead Signage", pos: [0.0, 3.4, 4.4], look: [0.0, 2.8, 0.0] },
        { id: "top", label: "06 TOP", title: "Top-Down Floorplan", pos: [0.1, 7.8, 0.1], look: [0, 0, 0] }
    ];

    let containerEl: HTMLElement | null = null;
    let canvasEl: HTMLCanvasElement | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let controls: OrbitControls | null = null;
    let boothRoot: THREE.Group | null = null;
    let animationFrameId: number | null = null;

    let activePreset = $state<string>("iso");
    let autoRotate = $state(true);
    let lightingMode = $state<"day" | "night" | "tech">("day");
    let activeHotspot = $state<Hotspot | null>(null);
    let hoveredHotspotId = $state<number | null>(null);
    let showHotspots = $state(true);

    // Camera animation state
    let isTransitioningCamera = false;
    let cameraTransitionProgress = 1.0;
    const fromCamPos = new THREE.Vector3();
    const toCamPos = new THREE.Vector3();
    const fromCamLook = new THREE.Vector3();
    const toCamLook = new THREE.Vector3();

    // Lighting refs for dynamic mode switching
    let keyLight: THREE.DirectionalLight | null = null;
    let fillLight: THREE.DirectionalLight | null = null;
    let hemiLight: THREE.HemisphereLight | null = null;
    let canopySpotLights: THREE.SpotLight[] = [];
    let hotspotSprites: { sprite: THREE.Sprite; hotspot: Hotspot }[] = [];
    let raycaster = new THREE.Raycaster();
    let mouseVec = new THREE.Vector2();

    // Loaded image cache
    let loadedLogoImg: HTMLImageElement | null = null;

    // Procedural Dynamic Texture Generators
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

    function createCarpetTexture(): THREE.CanvasTexture {
        return createTextureFromCanvas((ctx, w, h) => {
            ctx.fillStyle = "#cbd5e1";
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = "#94a3b8";
            for (let i = 0; i < 2000; i++) {
                const x = Math.random() * w;
                const y = Math.random() * h;
                const size = Math.random() * 2 + 1;
                ctx.globalAlpha = 0.12;
                ctx.fillRect(x, y, size, size);
            }
            ctx.globalAlpha = 1.0;

            ctx.strokeStyle = "#94a3b8";
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.25;
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
        }, 512, 512);
    }

    // Brand Logo Texture Generator
    function createBrandLogoTexture(logoImg: HTMLImageElement | null, brandName: string, brandColor: string): THREE.CanvasTexture {
        return createTextureFromCanvas((ctx, w, h) => {
            // Rounded background circle with brand color
            ctx.fillStyle = brandColor;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, w / 2 - 4, 0, Math.PI * 2);
            ctx.fill();

            // Clean white border
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, w / 2 - 12, 0, Math.PI * 2);
            ctx.stroke();

            if (logoImg) {
                const pad = w * 0.18;
                const drawSize = w - pad * 2;
                ctx.save();
                ctx.beginPath();
                ctx.arc(w / 2, h / 2, (w - pad * 2) / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.fillStyle = "#ffffff";
                ctx.fill();
                ctx.drawImage(logoImg, pad, pad, drawSize, drawSize);
                ctx.restore();
            } else {
                // Sleek Geometric Spatial Hexagon Glyph
                const cx = w / 2;
                const cy = h / 2;
                const size = w * 0.28;

                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3 - Math.PI / 6;
                    const x = cx + size * Math.cos(angle);
                    const y = cy + size * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = brandColor;
                ctx.beginPath();
                ctx.arc(cx, cy, size * 0.46, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "#ffffff";
                ctx.font = `bold ${Math.round(w * 0.2)}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(brandName.charAt(0).toUpperCase() || "E", cx, cy + 2);
            }
        }, 512, 512);
    }

    function createVideoWallTexture(brandName: string, logoImg: HTMLImageElement | null, brandColor: string, darkColor: string): THREE.CanvasTexture {
        return createTextureFromCanvas((ctx, w, h) => {
            const grad = ctx.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, "#031726");
            grad.addColorStop(0.5, darkColor);
            grad.addColorStop(1, "#02121f");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // Tech grid lines
            ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
            ctx.lineWidth = 1;
            for (let x = 0; x < w; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }
            for (let y = 0; y < h; y += 40) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }

            // Glowing top header bar
            ctx.fillStyle = brandColor;
            ctx.fillRect(30, 30, w - 60, 4);

            let textStartX = 40;

            // Draw Logo on top-left of video wall if available
            if (logoImg) {
                const logoSize = 64;
                ctx.save();
                ctx.beginPath();
                ctx.arc(40 + logoSize / 2, 45 + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.fillStyle = "#ffffff";
                ctx.fill();
                ctx.drawImage(logoImg, 40, 45, logoSize, logoSize);
                ctx.restore();
                textStartX = 120;
            }

            // Brand Title
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 32px sans-serif";
            ctx.fillText(`${brandName.toUpperCase()} SPATIAL PLATFORM`, textStartX, 78);

            ctx.fillStyle = brandColor;
            ctx.font = "bold 13px monospace";
            ctx.fillText("REAL-TIME BOOTH TELEMETRY & SPATIAL ENGINE // ACTIVE", textStartX, 104);

            // UI Cards
            const cardW = (w - 100) / 3;
            const cardH = 180;
            const cardY = 135;

            const cards = [
                { title: "VISITOR ENGAGEMENT", val: "98.4%", sub: "Live Dwell Metrics", color: brandColor },
                { title: "3D XR ACTIVATIONS", val: "1,420+", sub: "WebAR Scans Today", color: "#10b981" },
                { title: "LEAD CONVERSIONS", val: "3.8X", sub: "Above Standard Booths", color: "#f59e0b" }
            ];

            cards.forEach((c, idx) => {
                const cx = 35 + idx * (cardW + 15);
                ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
                ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
                ctx.lineWidth = 1.5;
                ctx.fillRect(cx, cardY, cardW, cardH);
                ctx.strokeRect(cx, cardY, cardW, cardH);

                ctx.fillStyle = "#94a3b8";
                ctx.font = "bold 11px monospace";
                ctx.fillText(c.title, cx + 15, cardY + 28);

                ctx.fillStyle = c.color;
                ctx.font = "bold 38px monospace";
                ctx.fillText(c.val, cx + 15, cardY + 80);

                ctx.fillStyle = "#ffffff";
                ctx.font = "12px sans-serif";
                ctx.fillText(c.sub, cx + 15, cardY + 120);

                // Mini graph bar
                ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
                ctx.fillRect(cx + 15, cardY + 140, cardW - 30, 8);
                ctx.fillStyle = c.color;
                ctx.fillRect(cx + 15, cardY + 140, (cardW - 30) * 0.78, 8);
            });

            // Bottom Wave Graphic
            ctx.strokeStyle = brandColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let x = 30; x <= w - 30; x += 10) {
                const y = h - 60 + Math.sin(x * 0.02) * 18;
                if (x === 30) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            ctx.fillStyle = "#64748b";
            ctx.font = "11px monospace";
            ctx.fillText(`POWERED BY ${brandName.toUpperCase()} 3D SPATIAL COMPUTING INFRASTRUCTURE`, 40, h - 25);
        }, 1024, 512);
    }

    function createGreenWallTexture(): THREE.CanvasTexture {
        return createTextureFromCanvas((ctx, w, h) => {
            ctx.fillStyle = "#1e4620";
            ctx.fillRect(0, 0, w, h);

            const colors = ["#2d6a4f", "#40916c", "#52b788", "#1b4332", "#74c69d", "#143625"];
            for (let i = 0; i < 4000; i++) {
                const x = Math.random() * w;
                const y = Math.random() * h;
                const r = Math.random() * 7 + 3;
                ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                ctx.globalAlpha = Math.random() * 0.7 + 0.3;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }, 512, 512);
    }

    function createWoodSlatTexture(): THREE.CanvasTexture {
        return createTextureFromCanvas((ctx, w, h) => {
            ctx.fillStyle = "#8a5a36";
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = "#a77148";
            for (let i = 0; i < 80; i++) {
                ctx.globalAlpha = 0.15;
                ctx.fillRect(0, i * 6, w, 3);
            }
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = "#3d2211";
            for (let x = 0; x < w; x += 24) {
                ctx.fillRect(x, 0, 4, h);
            }
        }, 256, 512);
    }

    function createTotemTexture(brandName: string, logoImg: HTMLImageElement | null, brandColor: string, darkColor: string): THREE.CanvasTexture {
        return createTextureFromCanvas((ctx, w, h) => {
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, brandColor);
            grad.addColorStop(0.35, darkColor);
            grad.addColorStop(1, "#082f49");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            let headerY = 70;

            if (logoImg) {
                const lSize = 56;
                ctx.save();
                ctx.beginPath();
                ctx.arc(w / 2, 45, lSize / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.fillStyle = "#ffffff";
                ctx.fill();
                ctx.drawImage(logoImg, w / 2 - lSize / 2, 45 - lSize / 2, lSize, lSize);
                ctx.restore();
                headerY = 95;
            }

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 22px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(brandName.toUpperCase(), w / 2, headerY);

            ctx.font = "bold 10px monospace";
            ctx.fillStyle = "#ffffff";
            ctx.fillText("INTERACTIVE KIOSK", w / 2, headerY + 22);

            const btnY = headerY + 45;
            const btns = ["EXPLORE 3D MODELS", "SPATIAL AR DEMO", "SCHEDULE BRIEFING", "PRODUCT QUIZ"];
            btns.forEach((b, i) => {
                const y = btnY + i * 48;
                ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
                ctx.fillRect(20, y, w - 40, 38);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
                ctx.strokeRect(20, y, w - 40, 38);

                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 11px monospace";
                ctx.fillText(b, w / 2, y + 23);
            });

            // QR Code Mockup
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(w / 2 - 36, h - 110, 72, 72);
            ctx.fillStyle = darkColor;
            ctx.fillRect(w / 2 - 28, h - 102, 56, 56);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(w / 2 - 18, h - 92, 36, 36);
            ctx.fillStyle = darkColor;
            ctx.fillRect(w / 2 - 8, h - 82, 16, 16);

            ctx.fillStyle = "#ffffff";
            ctx.font = "10px monospace";
            ctx.fillText("SCAN FOR WEBAR", w / 2, h - 20);
        }, 256, 512);
    }

    function createSignTextTexture(text: string, logoImg: HTMLImageElement | null, brandColor: string, textColor = "#ffffff"): THREE.CanvasTexture {
        return createTextureFromCanvas((ctx, w, h) => {
            ctx.fillStyle = brandColor;
            ctx.fillRect(0, 0, w, h);

            let textX = w / 2;

            if (logoImg) {
                const lSize = h * 0.68;
                const lPad = 40;
                ctx.save();
                ctx.beginPath();
                ctx.arc(lPad + lSize / 2, h / 2, lSize / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.fillStyle = "#ffffff";
                ctx.fill();
                ctx.drawImage(logoImg, lPad, (h - lSize) / 2, lSize, lSize);
                ctx.restore();
                textX = w / 2 + lSize / 3;
            }

            ctx.fillStyle = textColor;
            ctx.font = "900 68px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text, textX, h / 2);
        }, 1024, 256);
    }

    function createHotspotSprite(num: number, isHovered = false, isSelected = false, brandColor = "#009dd6"): THREE.Sprite {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d")!;

        const grad = ctx.createRadialGradient(64, 64, 20, 64, 64, 60);
        grad.addColorStop(0, isSelected ? "rgba(0, 0, 0, 0.8)" : isHovered ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.35)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(64, 64, 58, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isSelected ? brandColor : isHovered ? "#38bdf8" : "#0f172a";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(64, 64, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 36px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(num.toString(), 64, 64);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(0.48, 0.48, 1.0);
        return sprite;
    }

    // Build the Real-Time Architectural ThreeJS Booth Model with Logo Embeddings & Full Brand Color Sync
    function buildBoothScene(root: THREE.Group, brandName: string, logoImg: HTMLImageElement | null) {
        const brandColorHex = brand.primaryColor || "#009dd6";
        const brandDarkHex = brand.darkColor || "#04547c";

        // Shared Materials
        const whiteMat = new THREE.MeshStandardMaterial({ color: "#f8fafc", roughness: 0.25, metalness: 0.1 });
        const brandCyanMat = new THREE.MeshStandardMaterial({ color: brandColorHex, roughness: 0.2, metalness: 0.2 });
        const brandNavyMat = new THREE.MeshStandardMaterial({ color: brandDarkHex, roughness: 0.3, metalness: 0.3 });
        const chromeMat = new THREE.MeshStandardMaterial({ color: "#e2e8f0", roughness: 0.1, metalness: 0.9 });
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: "#ffffff",
            transmission: 0.75,
            opacity: 0.9,
            transparent: true,
            roughness: 0.1,
            ior: 1.5
        });
        const glowingWhiteMat = new THREE.MeshStandardMaterial({
            color: "#ffffff",
            emissive: "#ffffff",
            emissiveIntensity: 1.2,
            roughness: 0.2
        });
        const woodMat = new THREE.MeshStandardMaterial({
            map: createWoodSlatTexture(),
            roughness: 0.6,
            metalness: 0.1
        });
        const greenMossMat = new THREE.MeshStandardMaterial({
            map: createGreenWallTexture(),
            roughness: 0.9,
            metalness: 0.0
        });

        // Common Brand Logo Material
        const brandLogoTex = createBrandLogoTexture(logoImg, brandName, brandColorHex);
        const brandLogoMat = new THREE.MeshStandardMaterial({
            map: brandLogoTex,
            emissive: brandColorHex,
            emissiveIntensity: 0.75,
            roughness: 0.2
        });

        // 1. BASE FLOOR & PLATFORM
        const floorWidth = 7.6;
        const floorDepth = 5.2;
        const floorHeight = 0.12;

        const floorGeo = new THREE.BoxGeometry(floorWidth, floorHeight, floorDepth);
        const carpetTexture = createCarpetTexture();
        carpetTexture.wrapS = THREE.RepeatWrapping;
        carpetTexture.wrapT = THREE.RepeatWrapping;
        carpetTexture.repeat.set(4, 3);

        const carpetMat = new THREE.MeshStandardMaterial({
            map: carpetTexture,
            roughness: 0.85,
            metalness: 0.05
        });

        const floorMesh = new THREE.Mesh(floorGeo, carpetMat);
        floorMesh.position.y = floorHeight / 2;
        floorMesh.receiveShadow = true;
        root.add(floorMesh);

        // Platform Bevel Trim
        const trimGeo = new THREE.BoxGeometry(floorWidth + 0.06, 0.04, floorDepth + 0.06);
        const trimMat = new THREE.MeshStandardMaterial({ color: "#334155", roughness: 0.3, metalness: 0.5 });
        const trimMesh = new THREE.Mesh(trimGeo, trimMat);
        trimMesh.position.y = 0.02;
        root.add(trimMesh);

        // 2. ICONIC CURVED OVERHEAD CANOPY (The C-Curve Ribbon)
        const canopyShape = new THREE.Shape();
        canopyShape.moveTo(-2.4, -0.6);
        canopyShape.bezierCurveTo(-2.6, 1.4, -0.8, 2.6, 1.6, 2.4);
        canopyShape.bezierCurveTo(3.2, 2.2, 3.4, 0.8, 2.6, -0.4);
        canopyShape.bezierCurveTo(2.1, -1.1, 1.4, -1.0, 1.6, -0.2);
        canopyShape.bezierCurveTo(2.0, 0.6, 1.8, 1.4, 0.8, 1.6);
        canopyShape.bezierCurveTo(-0.4, 1.8, -1.7, 1.0, -1.6, -0.6);
        canopyShape.closePath();

        const extrudeSettings = {
            depth: 0.28,
            bevelEnabled: true,
            bevelSegments: 4,
            steps: 2,
            bevelSize: 0.04,
            bevelThickness: 0.04
        };

        const canopyGeo = new THREE.ExtrudeGeometry(canopyShape, extrudeSettings);
        canopyGeo.center();

        const canopyMesh = new THREE.Mesh(canopyGeo, brandCyanMat);
        canopyMesh.rotation.x = Math.PI / 2;
        canopyMesh.position.set(0.1, 3.25, 0.2);
        canopyMesh.castShadow = true;
        root.add(canopyMesh);

        // LED White Glow Trim inside the canopy curve
        const glowTrimMesh = new THREE.Mesh(canopyGeo, glowingWhiteMat);
        glowTrimMesh.rotation.x = Math.PI / 2;
        glowTrimMesh.scale.set(0.98, 0.98, 0.35);
        glowTrimMesh.position.set(0.1, 3.12, 0.2);
        root.add(glowTrimMesh);

        // 3D Illuminated Brand Sign & Logo Medallion on Canopy Top
        const canopySignGroup = new THREE.Group();
        canopySignGroup.position.set(1.4, 3.75, 1.4);
        canopySignGroup.rotation.y = -0.35;

        // 3D Text Sign with dynamic brand color
        const signTextTex = createSignTextTexture(brandName.toUpperCase(), logoImg, brandColorHex, "#ffffff");
        const signGeo = new THREE.BoxGeometry(2.4, 0.55, 0.08);
        const signMat = new THREE.MeshStandardMaterial({
            map: signTextTex,
            emissive: brandColorHex,
            emissiveIntensity: 0.55,
            roughness: 0.2
        });
        const signMesh = new THREE.Mesh(signGeo, signMat);
        canopySignGroup.add(signMesh);

        // Illuminated 3D Logo Disc next to the sign
        const logoMedallionGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 32);
        const logoMedallionMesh = new THREE.Mesh(logoMedallionGeo, brandLogoMat);
        logoMedallionMesh.rotation.x = Math.PI / 2;
        logoMedallionMesh.position.set(-1.55, 0.0, 0);
        canopySignGroup.add(logoMedallionMesh);

        root.add(canopySignGroup);

        // Canopy Downlight Spotlights
        const spotPositions = [
            [-1.4, 3.1, -0.4],
            [-0.4, 3.1, 1.1],
            [1.0, 3.1, 1.4],
            [2.1, 3.1, 0.5]
        ];

        canopySpotLights = [];
        spotPositions.forEach((pos) => {
            const fixtureGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16);
            const fixtureMesh = new THREE.Mesh(fixtureGeo, glowingWhiteMat);
            fixtureMesh.position.set(pos[0], pos[1], pos[2]);
            root.add(fixtureMesh);

            const spot = new THREE.SpotLight(0xffffff, 2.2, 6.0, Math.PI / 4, 0.4, 1.8);
            spot.position.set(pos[0], pos[1], pos[2]);
            spot.target.position.set(pos[0], 0, pos[2]);
            root.add(spot);
            root.add(spot.target);
            canopySpotLights.push(spot);
        });

        // 3. MAIN BACK ARCHITECTURAL CURVED WALL & 4K VIDEO WALL
        const backWallGroup = new THREE.Group();
        backWallGroup.position.set(0, 0, -1.6);

        // White curved structural wall
        const wallCurveGeo = new THREE.CylinderGeometry(3.6, 3.6, 2.7, 32, 1, true, Math.PI * 0.8, Math.PI * 0.65);
        const wallCurveMesh = new THREE.Mesh(wallCurveGeo, whiteMat);
        wallCurveMesh.position.set(0, 1.35, 0);
        wallCurveMesh.scale.set(1, 1, 0.65);
        wallCurveMesh.castShadow = true;
        wallCurveMesh.receiveShadow = true;
        backWallGroup.add(wallCurveMesh);

        // 4K Ultra-Wide LED Video Matrix with embedded Brand Logo & dynamic color
        const videoWallGeo = new THREE.PlaneGeometry(2.8, 1.6);
        const videoWallTex = createVideoWallTexture(brandName, logoImg, brandColorHex, brandDarkHex);
        const videoWallMat = new THREE.MeshStandardMaterial({
            map: videoWallTex,
            emissive: brandColorHex,
            emissiveIntensity: 0.45,
            roughness: 0.2
        });
        const videoWallMesh = new THREE.Mesh(videoWallGeo, videoWallMat);
        videoWallMesh.position.set(1.1, 1.65, 0.2);
        videoWallMesh.rotation.y = -0.25;
        backWallGroup.add(videoWallMesh);

        // Video Wall Frame
        const frameGeo = new THREE.BoxGeometry(2.88, 1.68, 0.06);
        const frameMat = new THREE.MeshStandardMaterial({ color: "#0f172a", roughness: 0.2, metalness: 0.8 });
        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        frameMesh.position.set(1.1, 1.65, 0.17);
        frameMesh.rotation.y = -0.25;
        backWallGroup.add(frameMesh);

        // Poster Lightboxes on Left Wall
        const poster1Geo = new THREE.PlaneGeometry(0.75, 1.35);
        const posterTex = createTextureFromCanvas((ctx, w, h) => {
            ctx.fillStyle = brandDarkHex;
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = brandColorHex;
            ctx.fillRect(10, 10, w - 20, 4);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 20px sans-serif";
            ctx.fillText("WEBAR EXPERIENCES", 20, 50);
            ctx.fillStyle = "#e2e8f0";
            ctx.font = "12px sans-serif";
            ctx.fillText("1:1 Scale Spatial Projection", 20, 80);
            ctx.fillText("Markerless Instant SLAM", 20, 105);
            ctx.fillText("60 FPS Smooth Locomotion", 20, 130);
            ctx.fillStyle = "rgba(255,255,255,0.1)";
            ctx.fillRect(20, 160, w - 40, 180);
        }, 256, 512);

        const posterMat = new THREE.MeshStandardMaterial({ map: posterTex, emissive: brandDarkHex, emissiveIntensity: 0.3 });
        const posterMesh = new THREE.Mesh(poster1Geo, posterMat);
        posterMesh.position.set(-1.65, 1.5, 0.3);
        posterMesh.rotation.y = 0.35;
        backWallGroup.add(posterMesh);

        root.add(backWallGroup);

        // 4. VERTICAL BIOPHILIC LIVING GREEN WALL WITH BRAND LOGO EMBLEM
        const greenWallGroup = new THREE.Group();
        greenWallGroup.position.set(-2.6, 0, -0.6);

        const greenPanelGeo = new THREE.BoxGeometry(0.2, 2.5, 1.8);
        const greenPanelMesh = new THREE.Mesh(greenPanelGeo, greenMossMat);
        greenPanelMesh.position.set(0, 1.25, 0);
        greenPanelMesh.castShadow = true;
        greenWallGroup.add(greenPanelMesh);

        // Vertical Timber Slats along Green Wall
        for (let z = -0.85; z <= 0.85; z += 0.22) {
            const slatGeo = new THREE.BoxGeometry(0.24, 2.6, 0.06);
            const slatMesh = new THREE.Mesh(slatGeo, woodMat);
            slatMesh.position.set(0.04, 1.3, z);
            slatMesh.castShadow = true;
            greenWallGroup.add(slatMesh);
        }

        // Prominent Halo Backlit Brand Logo Badge on Green Wall
        const logoBadgeGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.06, 32);
        const logoBadgeMesh = new THREE.Mesh(logoBadgeGeo, brandLogoMat);
        logoBadgeMesh.rotation.z = Math.PI / 2;
        logoBadgeMesh.position.set(0.18, 1.6, 0);
        greenWallGroup.add(logoBadgeMesh);

        // Glowing Back Halo Disc
        const haloGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.02, 32);
        const haloMat = new THREE.MeshStandardMaterial({
            color: "#ffffff",
            emissive: brandColorHex,
            emissiveIntensity: 1.4,
            roughness: 0.2
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.rotation.z = Math.PI / 2;
        haloMesh.position.set(0.15, 1.6, 0);
        greenWallGroup.add(haloMesh);

        root.add(greenWallGroup);

        // 5. RECEPTION / WELCOME CONCIERGE DESK (Front Right) WITH BRAND LOGO
        const deskGroup = new THREE.Group();
        deskGroup.position.set(2.4, 0, 1.1);

        // Curved desk body
        const deskShape = new THREE.Shape();
        deskShape.moveTo(-0.8, -0.4);
        deskShape.bezierCurveTo(-0.4, 0.4, 0.6, 0.5, 0.9, -0.2);
        deskShape.lineTo(0.7, -0.4);
        deskShape.bezierCurveTo(0.4, 0.2, -0.3, 0.1, -0.6, -0.4);
        deskShape.closePath();

        const deskExtrude = new THREE.ExtrudeGeometry(deskShape, { depth: 0.95, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
        deskExtrude.center();
        const deskMesh = new THREE.Mesh(deskExtrude, whiteMat);
        deskMesh.rotation.x = -Math.PI / 2;
        deskMesh.position.y = 0.5;
        deskMesh.castShadow = true;
        deskGroup.add(deskMesh);

        // Brand accent wave ribbon on desk front
        const deskTrimGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.1, 32, 1, true, 0, Math.PI * 0.8);
        const deskTrimMesh = new THREE.Mesh(deskTrimGeo, brandCyanMat);
        deskTrimMesh.position.set(0, 0.5, 0.05);
        deskGroup.add(deskTrimMesh);

        // Front Face Brand Logo Badge on Reception Desk
        const deskLogoGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.03, 32);
        const deskLogoMesh = new THREE.Mesh(deskLogoGeo, brandLogoMat);
        deskLogoMesh.rotation.x = Math.PI / 2;
        deskLogoMesh.position.set(0.08, 0.52, 0.48);
        deskGroup.add(deskLogoMesh);

        // Frosted Glass Countertop
        const topGlassGeo = new THREE.BoxGeometry(1.6, 0.04, 0.7);
        const topGlassMesh = new THREE.Mesh(topGlassGeo, glassMat);
        topGlassMesh.position.set(0, 0.98, 0);
        deskGroup.add(topGlassMesh);

        // Digital Check-in Tablet
        const tabletGeo = new THREE.BoxGeometry(0.28, 0.02, 0.2);
        const tabletMesh = new THREE.Mesh(tabletGeo, brandNavyMat);
        tabletMesh.position.set(0.3, 1.04, 0.05);
        tabletMesh.rotation.x = -0.3;
        deskGroup.add(tabletMesh);

        root.add(deskGroup);

        // 6. VIP DISCUSSION LOUNGE & SEATING (Dynamic Brand Upholstery)
        const loungeGroup = new THREE.Group();
        loungeGroup.position.set(-1.2, 0, 0.8);

        function createTable(x: number, z: number) {
            const table = new THREE.Group();
            table.position.set(x, 0, z);

            const topGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.03, 32);
            const topMesh = new THREE.Mesh(topGeo, whiteMat);
            topMesh.position.y = 0.68;
            topMesh.castShadow = true;
            table.add(topMesh);

            const stemGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.66, 16);
            const stemMesh = new THREE.Mesh(stemGeo, chromeMat);
            stemMesh.position.y = 0.34;
            table.add(stemMesh);

            const baseGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.02, 32);
            const baseMesh = new THREE.Mesh(baseGeo, chromeMat);
            baseMesh.position.y = 0.01;
            table.add(baseMesh);

            return table;
        }

        function createChair(x: number, z: number, rotY: number) {
            const chair = new THREE.Group();
            chair.position.set(x, 0, z);
            chair.rotation.y = rotY;

            const seatGeo = new THREE.BoxGeometry(0.42, 0.06, 0.42);
            const seatMat = new THREE.MeshStandardMaterial({ color: "#f1f5f9", roughness: 0.7 });
            const seatMesh = new THREE.Mesh(seatGeo, seatMat);
            seatMesh.position.y = 0.42;
            seatMesh.castShadow = true;
            chair.add(seatMesh);

            // Dynamic Brand Color Backrest
            const backGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.32, 16, 1, true, -Math.PI * 0.5, Math.PI);
            const backMat = new THREE.MeshStandardMaterial({ color: brandColorHex, roughness: 0.6 });
            const backMesh = new THREE.Mesh(backGeo, backMat);
            backMesh.position.set(0, 0.6, -0.15);
            backMesh.castShadow = true;
            chair.add(backMesh);

            const legGeo = new THREE.CylinderGeometry(0.018, 0.012, 0.42, 8);
            const legMat = new THREE.MeshStandardMaterial({ color: "#8a5a36", roughness: 0.5 });
            const legOffsets = [
                [-0.16, 0.16],
                [0.16, 0.16],
                [-0.16, -0.16],
                [0.16, -0.16]
            ];
            legOffsets.forEach(([lx, lz]) => {
                const leg = new THREE.Mesh(legGeo, legMat);
                leg.position.set(lx, 0.21, lz);
                leg.rotation.z = lx * -0.25;
                leg.rotation.x = lz * 0.25;
                chair.add(leg);
            });

            return chair;
        }

        loungeGroup.add(createTable(-0.6, 0));
        loungeGroup.add(createChair(-1.1, 0, Math.PI / 2));
        loungeGroup.add(createChair(-0.6, 0.55, Math.PI));
        loungeGroup.add(createChair(-0.1, 0, -Math.PI / 2));

        loungeGroup.add(createTable(1.1, -0.6));
        loungeGroup.add(createChair(1.1, -1.15, 0));
        loungeGroup.add(createChair(1.65, -0.6, -Math.PI / 2));

        root.add(loungeGroup);

        // 7. FRONT LOW PLANTER BOX & LOGO DIVIDER BANNER
        const planterGroup = new THREE.Group();
        planterGroup.position.set(-0.8, 0, 2.2);

        const boxGeo = new THREE.BoxGeometry(2.4, 0.38, 0.45);
        const boxMesh = new THREE.Mesh(boxGeo, woodMat);
        boxMesh.position.y = 0.19;
        boxMesh.castShadow = true;
        planterGroup.add(boxMesh);

        const shrubGeo = new THREE.BoxGeometry(2.3, 0.22, 0.38);
        const shrubMesh = new THREE.Mesh(shrubGeo, greenMossMat);
        shrubMesh.position.y = 0.44;
        planterGroup.add(shrubMesh);

        // Glass Divider with Glowing Brand Name & Logo in Brand Color
        const dividerGeo = new THREE.BoxGeometry(2.2, 0.42, 0.04);
        const dividerTex = createSignTextTexture(brandName.toUpperCase(), logoImg, brandColorHex, "#ffffff");
        const dividerMat = new THREE.MeshStandardMaterial({
            map: dividerTex,
            transparent: true,
            opacity: 0.92,
            emissive: brandColorHex,
            emissiveIntensity: 0.45
        });
        const dividerMesh = new THREE.Mesh(dividerGeo, dividerMat);
        dividerMesh.position.y = 0.72;
        planterGroup.add(dividerMesh);

        root.add(planterGroup);

        // 8. FREESTANDING DIGITAL TOTEMS & INTERACTIVE KIOSKS
        const totemTex = createTotemTexture(brandName, logoImg, brandColorHex, brandDarkHex);
        const totemGeo = new THREE.BoxGeometry(0.48, 1.85, 0.12);
        const totemMat = new THREE.MeshStandardMaterial({
            map: totemTex,
            emissive: brandColorHex,
            emissiveIntensity: 0.45,
            roughness: 0.2
        });

        // Totem Right
        const totemMeshRight = new THREE.Mesh(totemGeo, totemMat);
        totemMeshRight.position.set(3.2, 0.95, -0.4);
        totemMeshRight.rotation.y = -0.3;
        totemMeshRight.castShadow = true;
        root.add(totemMeshRight);

        // Totem Left
        const totemMeshLeft = new THREE.Mesh(totemGeo, totemMat);
        totemMeshLeft.position.set(-3.2, 0.95, 0.8);
        totemMeshLeft.rotation.y = 0.45;
        totemMeshLeft.castShadow = true;
        root.add(totemMeshLeft);

        // Dual Angled Podium Kiosks
        for (let i = 0; i < 2; i++) {
            const kiosk = new THREE.Group();
            kiosk.position.set(-0.2 + i * 0.45, 0, -1.8);

            const pillarGeo = new THREE.BoxGeometry(0.14, 0.85, 0.14);
            const pillarMesh = new THREE.Mesh(pillarGeo, whiteMat);
            pillarMesh.position.y = 0.42;
            kiosk.add(pillarMesh);

            const screenGeo = new THREE.BoxGeometry(0.32, 0.03, 0.24);
            const screenMesh = new THREE.Mesh(screenGeo, brandCyanMat);
            screenMesh.position.set(0, 0.92, 0.05);
            screenMesh.rotation.x = 0.65;
            kiosk.add(screenMesh);

            root.add(kiosk);
        }

        // Support Pillar Column with Dynamic Graphic Wrap
        const colGeo = new THREE.CylinderGeometry(0.24, 0.24, 3.1, 32);
        const colTex = createTextureFromCanvas((ctx, w, h) => {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = brandColorHex;
            ctx.fillRect(0, 40, w, 20);
            ctx.fillRect(0, h - 60, w, 20);

            let textY = h / 2;
            if (logoImg) {
                const s = 110;
                ctx.save();
                ctx.beginPath();
                ctx.arc(w / 2, h / 2 - 80, s / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.fillStyle = "#f1f5f9";
                ctx.fill();
                ctx.drawImage(logoImg, w / 2 - s / 2, h / 2 - 80 - s / 2, s, s);
                ctx.restore();
                textY = h / 2 + 30;
            }

            ctx.fillStyle = brandDarkHex;
            ctx.font = "bold 28px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(brandName.toUpperCase(), w / 2, textY);
            ctx.font = "14px monospace";
            ctx.fillText("SPATIAL ARCHITECTURE", w / 2, textY + 35);
        }, 512, 1024);

        const colMat = new THREE.MeshStandardMaterial({ map: colTex, roughness: 0.3 });
        const colMesh = new THREE.Mesh(colGeo, colMat);
        colMesh.position.set(-2.1, 1.55, -0.6);
        root.add(colMesh);
    }

    // Build Hotspot Pins
    function rebuildHotspots(scene: THREE.Scene) {
        hotspotSprites.forEach((h) => scene.remove(h.sprite));
        hotspotSprites = [];

        if (!showHotspots) return;

        const brandColor = brand.primaryColor || "#009dd6";

        hotspots.forEach((h) => {
            const isHovered = hoveredHotspotId === h.id;
            const isSelected = activeHotspot?.id === h.id;
            const sprite = createHotspotSprite(h.id, isHovered, isSelected, brandColor);
            sprite.position.set(h.pos[0], h.pos[1], h.pos[2]);
            scene.add(sprite);
            hotspotSprites.push({ sprite, hotspot: h });
        });
    }

    // Apply Lighting Modes
    function applyLighting(mode: "day" | "night" | "tech") {
        lightingMode = mode;
        if (!keyLight || !fillLight || !hemiLight || !scene) return;

        const brandColor = brand.primaryColor || "#009dd6";

        if (mode === "day") {
            scene.background = new THREE.Color("#f1f5f9");
            keyLight.color.set("#ffffff");
            keyLight.intensity = 2.4;
            keyLight.position.set(6, 10, 6);

            fillLight.color.set("#e0f2fe");
            fillLight.intensity = 1.2;

            hemiLight.color.set("#ffffff");
            hemiLight.groundColor.set("#cbd5e1");
            hemiLight.intensity = 1.1;

            canopySpotLights.forEach((s) => (s.intensity = 1.8));
        } else if (mode === "night") {
            scene.background = new THREE.Color("#090d16");
            keyLight.color.set(brandColor);
            keyLight.intensity = 0.8;

            fillLight.color.set("#818cf8");
            fillLight.intensity = 0.4;

            hemiLight.color.set("#1e293b");
            hemiLight.groundColor.set("#020617");
            hemiLight.intensity = 0.5;

            canopySpotLights.forEach((s) => (s.intensity = 3.5));
        } else if (mode === "tech") {
            scene.background = new THREE.Color("#030712");
            keyLight.color.set(brandColor);
            keyLight.intensity = 1.8;

            fillLight.color.set("#06b6d4");
            fillLight.intensity = 0.9;

            hemiLight.color.set("#0369a1");
            hemiLight.groundColor.set("#082f49");
            hemiLight.intensity = 0.6;

            canopySpotLights.forEach((s) => (s.intensity = 4.0));
        }
    }

    function selectPreset(preset: CameraPreset) {
        activePreset = preset.id;
        activeHotspot = null;
        transitionCamera(preset.pos, preset.look);
    }

    function selectHotspot(hotspot: Hotspot) {
        activeHotspot = hotspot;
        transitionCamera(hotspot.cameraPos, hotspot.cameraLook);
        if (scene) rebuildHotspots(scene);
    }

    function transitionCamera(targetPos: [number, number, number], targetLook: [number, number, number]) {
        if (!camera || !controls) return;
        fromCamPos.copy(camera.position);
        toCamPos.set(targetPos[0], targetPos[1], targetPos[2]);

        fromCamLook.copy(controls.target);
        toCamLook.set(targetLook[0], targetLook[1], targetLook[2]);

        cameraTransitionProgress = 0.0;
        isTransitioningCamera = true;
    }

    function toggleAutoRotate() {
        autoRotate = !autoRotate;
        if (controls) controls.autoRotate = autoRotate;
    }

    function toggleHotspots() {
        showHotspots = !showHotspots;
        if (scene) rebuildHotspots(scene);
    }

    function handleCanvasPointer(e: MouseEvent, isClick = false) {
        if (!canvasEl || !camera || !showHotspots) return;
        const rect = canvasEl.getBoundingClientRect();
        mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouseVec, camera);
        const spriteObjects = hotspotSprites.map((h) => h.sprite);
        const intersects = raycaster.intersectObjects(spriteObjects, false);

        if (intersects.length > 0) {
            const hitSprite = intersects[0].object as THREE.Sprite;
            const match = hotspotSprites.find((h) => h.sprite === hitSprite);
            if (match) {
                if (isClick) {
                    selectHotspot(match.hotspot);
                } else if (hoveredHotspotId !== match.hotspot.id) {
                    hoveredHotspotId = match.hotspot.id;
                    if (scene) rebuildHotspots(scene);
                }
                return;
            }
        }

        if (!isClick && hoveredHotspotId !== null) {
            hoveredHotspotId = null;
            if (scene) rebuildHotspots(scene);
        }
    }

    async function loadBrandLogoImage(): Promise<HTMLImageElement | null> {
        if (!brand.logo) return null;
        return new Promise((resolve) => {
            const img = new Image();
            if (brand.logo!.startsWith("http://") || brand.logo!.startsWith("https://")) {
                img.crossOrigin = "anonymous";
            }
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = brand.logo!;
        });
    }

    async function rebuildSceneWithBrand() {
        if (!scene) return;
        loadedLogoImg = await loadBrandLogoImage();

        if (boothRoot) {
            scene.remove(boothRoot);
            boothRoot.clear();
        } else {
            boothRoot = new THREE.Group();
        }

        buildBoothScene(boothRoot, brand.name, loadedLogoImg);
        scene.add(boothRoot);
        rebuildHotspots(scene);
    }

    onMount(() => {
        if (!containerEl || !canvasEl) return;

        scene = new THREE.Scene();
        scene.background = new THREE.Color("#f1f5f9");

        const width = containerEl.clientWidth;
        const height = containerEl.clientHeight;

        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(5.2, 4.0, 5.2);

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
        renderer.toneMappingExposure = 1.1;

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 0.8;
        controls.maxPolarAngle = Math.PI / 2 - 0.02;
        controls.minDistance = 2.0;
        controls.maxDistance = 12.0;
        controls.target.set(0, 1.0, 0);

        // Lighting
        keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
        keyLight.position.set(6, 10, 6);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 2048;
        keyLight.shadow.mapSize.height = 2048;
        keyLight.shadow.bias = -0.0001;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 25;
        keyLight.shadow.camera.left = -6;
        keyLight.shadow.camera.right = 6;
        keyLight.shadow.camera.top = 6;
        keyLight.shadow.camera.bottom = -6;
        scene.add(keyLight);

        fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.2);
        fillLight.position.set(-6, 8, -6);
        scene.add(fillLight);

        hemiLight = new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 1.1);
        scene.add(hemiLight);

        // Initial build with logo
        rebuildSceneWithBrand().then(() => {
            applyLighting("day");
        });

        const handleResize = () => {
            if (!containerEl || !camera || !renderer) return;
            const w = containerEl.clientWidth;
            const h = containerEl.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener("resize", handleResize);

        let clock = new THREE.Clock();
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const delta = clock.getDelta();

            if (isTransitioningCamera && camera && controls) {
                cameraTransitionProgress = Math.min(1.0, cameraTransitionProgress + delta * 2.5);
                const ease = 0.5 - Math.cos(cameraTransitionProgress * Math.PI) / 2;
                camera.position.lerpVectors(fromCamPos, toCamPos, ease);
                controls.target.lerpVectors(fromCamLook, toCamLook, ease);

                if (cameraTransitionProgress >= 1.0) {
                    isTransitioningCamera = false;
                }
            }

            const time = clock.getElapsedTime();
            hotspotSprites.forEach(({ sprite, hotspot }) => {
                const baseScale = hoveredHotspotId === hotspot.id || activeHotspot?.id === hotspot.id ? 0.56 : 0.46;
                const scale = baseScale + Math.sin(time * 3.5 + hotspot.id) * 0.025;
                sprite.scale.set(scale, scale, 1.0);
            });

            if (controls) {
                controls.autoRotate = autoRotate && !isTransitioningCamera;
                controls.update();
            }

            if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }
        };

        animate();

        // Listen for brand profile updates
        const onBrandUpdated = () => {
            rebuildSceneWithBrand();
        };
        window.addEventListener("ekson_brand_updated", onBrandUpdated);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("ekson_brand_updated", onBrandUpdated);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            controls?.dispose();
            renderer?.dispose();
        };
    });
</script>

<div
    bind:this={containerEl}
    class="relative w-full h-full min-h-[420px] sm:min-h-[480px] md:min-h-full flex flex-col justify-between p-3 sm:p-5 select-none font-sans overflow-hidden bg-slate-100"
>
    <!-- Top Header Badge & Title (Overlaid) -->
    <div class="relative z-10 flex items-start justify-between gap-2 pointer-events-none">
        <div>
            <div class="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest font-bold mb-0.5" style="color: {brand.primaryColor};">
                <span class="size-1.5 rounded-full" style="background-color: {brand.primaryColor};"></span>
                <span>04 / REAL-TIME ARCHITECTURE</span>
                {#if brand.logo}
                    <span
                        class="px-2 py-0.2 font-mono text-[8px] font-bold rounded-full ml-1 flex items-center gap-1 border"
                        style="color: {brand.primaryColor}; background-color: {brand.lightTint}; border-color: {brand.primaryColor}40;"
                    >
                        <span class="size-1.5 rounded-full animate-pulse" style="background-color: {brand.primaryColor};"></span>
                        BRAND COLOR ACTIVE
                    </span>
                {:else}
                    <span class="px-2 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-300 font-mono text-[8px] font-bold rounded-full ml-1">
                        60 FPS 3D
                    </span>
                {/if}
            </div>
            <h3 class="text-lg sm:text-xl md:text-2xl font-black text-text uppercase tracking-tight">
                {brand.name} True Scale Booth
            </h3>
            <p class="text-[10px] sm:text-xs text-text/60 font-medium max-w-xs sm:max-w-sm mt-0.5">
                1:1 Scale interactive ThreeJS exhibition booth in full <span class="font-bold font-mono" style="color: {brand.primaryColor};">{brand.name}</span> styling.
            </p>
        </div>

        <!-- Top Right Actions: Auto-Rotate, Lighting Mode, Hotspots Toggle -->
        <div class="pointer-events-auto flex items-center gap-1 sm:gap-1.5">
            <!-- Hotspot Pins Toggle -->
            <button
                onclick={toggleHotspots}
                class="px-2.5 py-1 bg-white/90 hover:bg-white text-text border border-black/10 shadow-xs rounded-full font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition backdrop-blur-md {showHotspots ? 'border-black/30' : 'text-text/50'}"
                style="{showHotspots ? `color: ${brand.primaryColor};` : ''}"
                title="Toggle Interactive Hotspots"
            >
                <span class="material-symbols-rounded text-[14px]">location_on</span>
                <span class="hidden sm:inline">Pins</span>
            </button>

            <!-- Lighting Mode Switcher -->
            <div class="flex bg-white/90 backdrop-blur-md p-0.5 rounded-full border border-black/10 shadow-xs">
                <button
                    onclick={() => applyLighting("day")}
                    class="px-2 py-0.5 rounded-full transition cursor-pointer text-[9px] sm:text-[10px] font-bold font-mono {lightingMode === 'day' ? 'text-white shadow-xs' : 'text-text/60 hover:text-text'}"
                    style="{lightingMode === 'day' ? `background-color: ${brand.primaryColor};` : ''}"
                    title="Daylight Studio Lighting"
                >
                    DAY
                </button>
                <button
                    onclick={() => applyLighting("night")}
                    class="px-2 py-0.5 rounded-full transition cursor-pointer text-[9px] sm:text-[10px] font-bold font-mono {lightingMode === 'night' ? 'bg-indigo-600 text-white shadow-xs' : 'text-text/60 hover:text-text'}"
                    title="VIP Twilight Glow"
                >
                    NIGHT
                </button>
                <button
                    onclick={() => applyLighting("tech")}
                    class="px-2 py-0.5 rounded-full transition cursor-pointer text-[9px] sm:text-[10px] font-bold font-mono {lightingMode === 'tech' ? 'text-white shadow-xs' : 'text-text/60 hover:text-text'}"
                    style="{lightingMode === 'tech' ? `background-color: ${brand.darkColor};` : ''}"
                    title="Cyber Tech Lighting"
                >
                    TECH
                </button>
            </div>

            <!-- Auto-Rotate Toggle -->
            <button
                onclick={toggleAutoRotate}
                class="size-7 sm:size-8 bg-white/90 hover:bg-white text-text rounded-full flex items-center justify-center border border-black/10 shadow-xs transition cursor-pointer backdrop-blur-md"
                title={autoRotate ? "Pause Auto-Rotation" : "Enable Auto-Rotation"}
                aria-label="Toggle Auto-Rotation"
            >
                <span
                    class="material-symbols-rounded text-[16px] {autoRotate ? 'animate-spin' : 'text-text/60'}"
                    style="{autoRotate ? `color: ${brand.primaryColor};` : ''}"
                >
                    sync
                </span>
            </button>
        </div>
    </div>

    <!-- 3D Canvas Viewport with Orbit Controls & Pointer Raycasting -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
        class="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing"
        onclick={(e) => handleCanvasPointer(e, true)}
        onmousemove={(e) => handleCanvasPointer(e, false)}
        role="region"
        aria-label="3D Booth Viewport"
    >
        <canvas bind:this={canvasEl} class="w-full h-full block"></canvas>
    </div>

    <!-- Selected Hotspot Detail Card Overlay -->
    {#if activeHotspot}
        <div class="relative z-20 max-w-sm sm:max-w-md bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-black/10 shadow-lg animate-fade-in my-auto self-start pointer-events-auto">
            <div class="flex items-center justify-between border-b border-black/5 pb-1.5 mb-2">
                <div class="flex items-center gap-1.5">
                    <span
                        class="size-5 rounded-full text-white flex items-center justify-center font-mono text-[11px] font-black"
                        style="background-color: {brand.primaryColor};"
                    >
                        {activeHotspot.id}
                    </span>
                    <div>
                        <h4 class="text-xs sm:text-sm font-extrabold uppercase text-text tracking-tight leading-none">
                            {activeHotspot.title}
                        </h4>
                        <span class="text-[9px] sm:text-[10px] font-mono font-bold" style="color: {brand.primaryColor};">
                            {activeHotspot.subtitle}
                        </span>
                    </div>
                </div>
                <button
                    onclick={() => (activeHotspot = null)}
                    class="size-6 bg-black/5 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center transition cursor-pointer text-text/60"
                    aria-label="Close Specification Card"
                >
                    <span class="material-symbols-rounded text-[14px]">close</span>
                </button>
            </div>

            <p class="text-[10px] sm:text-[11px] text-text/70 leading-relaxed font-sans mb-2.5">
                {activeHotspot.description}
            </p>

            <div class="grid grid-cols-2 gap-1.5">
                {#each activeHotspot.specs as spec}
                    <div class="p-1.5 bg-black/[0.02] border border-black/5 rounded-lg flex items-center gap-1 text-[9px] font-mono text-text/80">
                        <span class="material-symbols-rounded text-[12px]" style="color: {brand.primaryColor};">check_circle</span>
                        <span class="truncate">{spec}</span>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Bottom HUD Controls & Angle Presets -->
    <div class="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-black/5 mt-auto">
        <!-- Interaction Hint & Metric Scale -->
        <div class="flex items-center gap-2">
            <div class="flex items-center gap-1.5 bg-white/85 backdrop-blur-md px-3 py-1 rounded-full border border-black/10 shadow-xs font-mono text-[9px] text-text/60 uppercase">
                <span class="material-symbols-rounded text-[13px]" style="color: {brand.primaryColor};">drag_pan</span>
                <span>360° ORBIT // TAP PINS</span>
            </div>
            <div class="hidden md:flex items-center gap-1.5 bg-white/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-black/10 shadow-xs font-mono text-[9px] text-emerald-700 font-bold uppercase">
                <span class="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>METRIC: 7.6M × 5.2M</span>
            </div>
        </div>

        <!-- Camera Angle Preset Buttons -->
        <div class="flex items-center gap-1 bg-white/85 backdrop-blur-md p-1 rounded-full border border-black/10 shadow-xs overflow-x-auto scrollbar-none">
            {#each presets as preset}
                <button
                    onclick={() => selectPreset(preset)}
                    class="px-2.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider rounded-full transition cursor-pointer border shrink-0 {activePreset === preset.id && !activeHotspot ? 'text-white border-transparent shadow-xs' : 'bg-black/3 text-text/70 hover:text-text border-black/5'}"
                    style="{activePreset === preset.id && !activeHotspot ? `background-color: ${brand.primaryColor};` : ''}"
                    title={preset.title}
                >
                    {preset.label}
                </button>
            {/each}
        </div>
    </div>
</div>
