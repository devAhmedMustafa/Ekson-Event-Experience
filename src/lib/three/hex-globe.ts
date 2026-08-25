import * as THREE from "three";

/**
 * 3D Geodesic Hexagonal Tech Globe Generator
 * 
 * Creates a high-precision spherical hexagonal grid by dualizing a subdivided icosphere.
 * Maps world landmasses onto the hex tiles to accurately shape Earth's continents.
 * Renders intensely bright neon continent outlines and glowing land hexes.
 */

// 12 Golden-ratio vertices of a base Icosahedron
const PHI = (1 + Math.sqrt(5)) / 2;
const BASE_ICO_VERTICES = [
    [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
    [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
    [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]
].map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize());

const BASE_ICO_FACES = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
];

export interface DualCell {
    center: THREE.Vector3;
    vertices: THREE.Vector3[];
    isLand: boolean;
    neighbors: number[];
}

/**
 * High-Resolution World Landmass Canvas Sampler
 * Renders accurate, detailed polygons for Earth's continents onto a 1024x512 2D canvas for exact lon-lat lookup.
 */
let landCanvasCtx: CanvasRenderingContext2D | null = null;

function initLandCanvas(): CanvasRenderingContext2D {
    if (landCanvasCtx) return landCanvasCtx;

    const width = 1024;
    const height = 512;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

    // Black background (ocean)
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    // White foreground (landmasses)
    ctx.fillStyle = "#ffffff";

    // Helper to map Lon/Lat coords [-180..180, -90..90] to Canvas pixel X/Y
    const toXY = (lon: number, lat: number): [number, number] => {
        const x = ((lon + 180) / 360) * width;
        const y = ((90 - lat) / 180) * height;
        return [x, y];
    };

    const drawPoly = (coords: Array<[number, number]>) => {
        if (coords.length < 3) return;
        ctx.beginPath();
        const [x0, y0] = toXY(coords[0][0], coords[0][1]);
        ctx.moveTo(x0, y0);
        for (let i = 1; i < coords.length; i++) {
            const [x, y] = toXY(coords[i][0], coords[i][1]);
            ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    };

    // --- ACCURATE EARTH CONTINENT POLYGONS ---

    // Africa (Recognizable horn & West bulge)
    drawPoly([
        [-17, 35], [-5, 36], [10, 37], [25, 33], [33, 31], [33, 27], [43, 13], [51, 12],
        [43, -11], [35, -24], [28, -34], [18, -34], [12, -16], [9, 5], [0, 6], [-15, 5], [-17, 21], [-17, 35]
    ]);

    // North America
    drawPoly([
        [-168, 65], [-140, 70], [-125, 75], [-75, 78], [-55, 60], [-55, 48],
        [-66, 44], [-75, 35], [-80, 25], [-90, 16], [-105, 20], [-118, 30],
        [-124, 48], [-140, 60], [-160, 55], [-168, 65]
    ]);

    // Central America
    drawPoly([
        [-90, 16], [-85, 14], [-78, 8], [-77, 8], [-83, 10], [-91, 15]
    ]);

    // South America
    drawPoly([
        [-80, 10], [-73, 12], [-60, 8], [-50, -2], [-35, -5], [-37, -12],
        [-48, -28], [-58, -38], [-68, -54], [-75, -45], [-72, -33], [-81, -5], [-80, 10]
    ]);

    // Eurasia (Europe & Asia Mainland)
    drawPoly([
        [-10, 36], [0, 43], [12, 44], [28, 41], [32, 46], [28, 58], [15, 56], [10, 60],
        [25, 71], [32, 70], [60, 72], [100, 78], [170, 72], [180, 65], [170, 60], [140, 52],
        [120, 32], [108, 12], [98, 10], [90, 22], [80, 8], [68, 24], [60, 25], [50, 30],
        [40, 30], [35, 35], [26, 38], [15, 38], [-5, 36], [-10, 36]
    ]);

    // Scandinavia & Baltic
    drawPoly([
        [5, 58], [12, 56], [18, 60], [28, 70], [18, 71], [8, 62]
    ]);

    // India Subcontinent
    drawPoly([
        [68, 24], [88, 22], [80, 8], [77, 8]
    ]);

    // Southeast Asia & Malay Peninsula
    drawPoly([
        [95, 20], [108, 12], [104, 1], [99, 6]
    ]);

    // Australia
    drawPoly([
        [113, -22], [130, -12], [142, -10], [153, -28], [148, -38], [138, -35], [115, -34], [113, -22]
    ]);

    // Antarctica
    drawPoly([
        [-180, -65], [180, -65], [180, -90], [-180, -90]
    ]);

    // Greenland
    drawPoly([
        [-55, 60], [-40, 60], [-20, 75], [-30, 83], [-60, 83], [-55, 60]
    ]);

    // Madagascar
    drawPoly([
        [44, -12], [50, -15], [47, -25], [43, -24]
    ]);

    // Japan
    drawPoly([
        [130, 31], [140, 36], [142, 44], [136, 35]
    ]);

    // UK & Ireland
    drawPoly([
        [-10, 50], [-5, 58], [2, 53], [-5, 50]
    ]);

    // Indonesia & Maritime SE Asia
    drawPoly([
        [95, 6], [128, 10], [126, -8], [105, -7]
    ]);

    // New Zealand
    drawPoly([
        [166, -46], [178, -36], [174, -42]
    ]);

    landCanvasCtx = ctx;
    return ctx;
}

/**
 * Checks if a 3D unit vector direction (x, y, z) falls on land.
 */
export function isVectorOnLand(dir: THREE.Vector3): boolean {
    const ctx = initLandCanvas();
    const radius = dir.length();
    if (radius === 0) return false;

    // Convert vector (x, y, z) to longitude (-180..180) and latitude (-90..90)
    const normX = dir.x / radius;
    const normY = dir.y / radius;
    const normZ = dir.z / radius;

    const lat = Math.asin(Math.max(-1, Math.min(1, normY))) * (180 / Math.PI);
    const lon = Math.atan2(normX, normZ) * (180 / Math.PI);

    const px = Math.floor(((lon + 180) / 360) * 1024);
    const py = Math.floor(((90 - lat) / 180) * 512);

    const clampedX = Math.max(0, Math.min(1023, px));
    const clampedY = Math.max(0, Math.min(511, py));

    const pixel = ctx.getImageData(clampedX, clampedY, 1, 1).data;
    return pixel[0] > 128; // White pixel = land
}

/**
 * Builds Subdivided Icosphere Vertices & Triangles
 */
function createSubdividedIcosphere(subdivisions = 4) {
    let vertices = BASE_ICO_VERTICES.map(v => v.clone());
    let faces = BASE_ICO_FACES.map(f => [...f]);

    const getMiddlePoint = (p1Idx: number, p2Idx: number, cache: Map<string, number>): number => {
        const key = p1Idx < p2Idx ? `${p1Idx}_${p2Idx}` : `${p2Idx}_${p1Idx}`;
        if (cache.has(key)) return cache.get(key)!;

        const p1 = vertices[p1Idx];
        const p2 = vertices[p2Idx];
        const middle = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5).normalize();

        const newIdx = vertices.length;
        vertices.push(middle);
        cache.set(key, newIdx);
        return newIdx;
    };

    for (let sub = 0; sub < subdivisions; sub++) {
        const cache = new Map<string, number>();
        const nextFaces: number[][] = [];

        for (const face of faces) {
            const a = face[0];
            const b = face[1];
            const c = face[2];

            const ab = getMiddlePoint(a, b, cache);
            const bc = getMiddlePoint(b, c, cache);
            const ca = getMiddlePoint(c, a, cache);

            nextFaces.push([a, ab, ca]);
            nextFaces.push([b, bc, ab]);
            nextFaces.push([c, ca, bc]);
            nextFaces.push([ab, bc, ca]);
        }
        faces = nextFaces;
    }

    return { vertices, faces };
}

/**
 * Constructs Dual Hexagonal Cells from Subdivided Icosphere
 */
export function buildHexGlobeGrid(subdivisions = 4, sphereRadius = 1.0): DualCell[] {
    const { vertices: icoVertices, faces: icoFaces } = createSubdividedIcosphere(subdivisions);

    // Calculate face center centroids
    const faceCenters = icoFaces.map(face => {
        const v0 = icoVertices[face[0]];
        const v1 = icoVertices[face[1]];
        const v2 = icoVertices[face[2]];
        return new THREE.Vector3()
            .addVectors(v0, v1)
            .add(v2)
            .divideScalar(3)
            .normalize();
    });

    // Map each icosphere vertex to its surrounding triangular faces
    const vertexToFaces: number[][] = Array.from({ length: icoVertices.length }, () => []);
    icoFaces.forEach((face, faceIdx) => {
        vertexToFaces[face[0]].push(faceIdx);
        vertexToFaces[face[1]].push(faceIdx);
        vertexToFaces[face[2]].push(faceIdx);
    });

    const dualCells: DualCell[] = [];

    // Build each dual cell (centered at icoVertices[vIdx])
    icoVertices.forEach((center, vIdx) => {
        const surroundingFaceIndices = vertexToFaces[vIdx];
        if (surroundingFaceIndices.length === 0) return;

        // Order surrounding face centers in a clean counter-clockwise polygon loop around center
        const unorderedCenters = surroundingFaceIndices.map(fIdx => faceCenters[fIdx].clone());
        const normal = center.clone().normalize();

        // Reference axis for angle sorting
        const refVector = new THREE.Vector3().subVectors(unorderedCenters[0], center).projectOnPlane(normal).normalize();

        const sortedCentersWithAngles = unorderedCenters.map(pt => {
            const vec = new THREE.Vector3().subVectors(pt, center).projectOnPlane(normal).normalize();
            let angle = Math.atan2(
                new THREE.Vector3().crossVectors(refVector, vec).dot(normal),
                refVector.dot(vec)
            );
            if (angle < 0) angle += Math.PI * 2;
            return { pt, angle };
        });

        sortedCentersWithAngles.sort((a, b) => a.angle - b.angle);

        // Scale vertices to final sphere radius
        const cellVertices = sortedCentersWithAngles.map(item => item.pt.clone().multiplyScalar(sphereRadius));
        const cellCenter = center.clone().multiplyScalar(sphereRadius);

        const isLand = isVectorOnLand(center);

        dualCells.push({
            center: cellCenter,
            vertices: cellVertices,
            isLand,
            neighbors: []
        });
    });

    // Identify cell neighbor connectivity
    const edgeMap = new Map<string, number[]>();
    dualCells.forEach((cell, cellIdx) => {
        const count = cell.vertices.length;
        for (let i = 0; i < count; i++) {
            const vA = cell.vertices[i];
            const vB = cell.vertices[(i + 1) % count];

            // Round coordinates to generate stable edge key
            const kA = `${vA.x.toFixed(3)}_${vA.y.toFixed(3)}_${vA.z.toFixed(3)}`;
            const kB = `${vB.x.toFixed(3)}_${vB.y.toFixed(3)}_${vB.z.toFixed(3)}`;
            const edgeKey = kA < kB ? `${kA}|${kB}` : `${kB}|${kA}`;

            if (!edgeMap.has(edgeKey)) {
                edgeMap.set(edgeKey, []);
            }
            edgeMap.get(edgeKey)!.push(cellIdx);
        }
    });

    edgeMap.forEach(cellIndices => {
        if (cellIndices.length === 2) {
            const [c1, c2] = cellIndices;
            if (!dualCells[c1].neighbors.includes(c2)) dualCells[c1].neighbors.push(c2);
            if (!dualCells[c2].neighbors.includes(c1)) dualCells[c2].neighbors.push(c1);
        }
    });

    return dualCells;
}

/**
 * Creates Three.js Meshes & Line Geometries for the Tech Hex Globe
 */
export function buildGlobeGroup(dualCells: DualCell[], brandPrimaryHex: string): {
    group: THREE.Group;
    landMesh: THREE.Mesh;
    oceanMesh: THREE.Mesh;
    outlineLines: THREE.LineSegments;
    coreLines: THREE.LineSegments;
    innerGridLines: THREE.LineSegments;
    landMaterial: THREE.MeshPhysicalMaterial;
    outlineMaterial: THREE.LineBasicMaterial;
    coreLineMaterial: THREE.LineBasicMaterial;
    updateColors: (primaryHex: string) => void;
} {
    const group = new THREE.Group();

    // 1. Build Extruded / Inset Hex Cell Meshes for Land and Ocean
    const landPositions: number[] = [];
    const landNormals: number[] = [];
    const oceanPositions: number[] = [];
    const oceanNormals: number[] = [];

    const outlineLinePositions: number[] = [];
    const coreLinePositions: number[] = [];
    const innerGridLinePositions: number[] = [];

    dualCells.forEach(cell => {
        const count = cell.vertices.length;
        const norm = cell.center.clone().normalize();

        // Inset hex polygon vertices slightly for crisp gap definition
        const insetFactor = 0.90;
        const insetVertices = cell.vertices.map(v => {
            const dir = new THREE.Vector3().subVectors(v, cell.center);
            return cell.center.clone().add(dir.multiplyScalar(insetFactor));
        });

        // Add triangles for hex face (fan triangulation from cell center)
        for (let i = 0; i < count; i++) {
            const v1 = insetVertices[i];
            const v2 = insetVertices[(i + 1) % count];

            if (cell.isLand) {
                // Land hex face
                landPositions.push(cell.center.x, cell.center.y, cell.center.z);
                landPositions.push(v1.x, v1.y, v1.z);
                landPositions.push(v2.x, v2.y, v2.z);

                landNormals.push(norm.x, norm.y, norm.z);
                landNormals.push(norm.x, norm.y, norm.z);
                landNormals.push(norm.x, norm.y, norm.z);
            } else {
                // Ocean hex face
                const oceanCenter = cell.center.clone().multiplyScalar(0.992);
                const ov1 = v1.clone().multiplyScalar(0.992);
                const ov2 = v2.clone().multiplyScalar(0.992);

                oceanPositions.push(oceanCenter.x, oceanCenter.y, oceanCenter.z);
                oceanPositions.push(ov1.x, ov1.y, ov1.z);
                oceanPositions.push(ov2.x, ov2.y, ov2.z);

                oceanNormals.push(norm.x, norm.y, norm.z);
                oceanNormals.push(norm.x, norm.y, norm.z);
                oceanNormals.push(norm.x, norm.y, norm.z);
            }
        }

        // Add Line Segments for Edges
        for (let i = 0; i < count; i++) {
            const v1 = cell.vertices[i];
            const v2 = cell.vertices[(i + 1) % count];

            if (cell.isLand) {
                // Check if this land cell edge is on the continent boundary or perimeter
                const neighborIdx = cell.neighbors[i];
                const isBoundary = neighborIdx === undefined || !dualCells[neighborIdx]?.isLand;

                if (isBoundary) {
                    // INTENSE NEON OUTLINE LINE along continent perimeter
                    const p1 = v1.clone().multiplyScalar(1.008);
                    const p2 = v2.clone().multiplyScalar(1.008);
                    outlineLinePositions.push(p1.x, p1.y, p1.z);
                    outlineLinePositions.push(p2.x, p2.y, p2.z);

                    // Inner ultra-bright white core line overlay for maximum bloom pop!
                    const cp1 = v1.clone().multiplyScalar(1.009);
                    const cp2 = v2.clone().multiplyScalar(1.009);
                    coreLinePositions.push(cp1.x, cp1.y, cp1.z);
                    coreLinePositions.push(cp2.x, cp2.y, cp2.z);
                } else {
                    // Inner land hex border line (makes all continent hexes glow brightly!)
                    const p1 = v1.clone().multiplyScalar(1.004);
                    const p2 = v2.clone().multiplyScalar(1.004);
                    outlineLinePositions.push(p1.x, p1.y, p1.z);
                    outlineLinePositions.push(p2.x, p2.y, p2.z);
                }
            } else {
                // Ocean hex grid wireframe line
                const p1 = v1.clone().multiplyScalar(0.994);
                const p2 = v2.clone().multiplyScalar(0.994);
                innerGridLinePositions.push(p1.x, p1.y, p1.z);
                innerGridLinePositions.push(p2.x, p2.y, p2.z);
            }
        }
    });

    // 2. Create Buffer Geometries
    const landGeo = new THREE.BufferGeometry();
    landGeo.setAttribute("position", new THREE.Float32BufferAttribute(landPositions, 3));
    landGeo.setAttribute("normal", new THREE.Float32BufferAttribute(landNormals, 3));

    const oceanGeo = new THREE.BufferGeometry();
    oceanGeo.setAttribute("position", new THREE.Float32BufferAttribute(oceanPositions, 3));
    oceanGeo.setAttribute("normal", new THREE.Float32BufferAttribute(oceanNormals, 3));

    const outlineLineGeo = new THREE.BufferGeometry();
    outlineLineGeo.setAttribute("position", new THREE.Float32BufferAttribute(outlineLinePositions, 3));

    const coreLineGeo = new THREE.BufferGeometry();
    coreLineGeo.setAttribute("position", new THREE.Float32BufferAttribute(coreLinePositions, 3));

    const innerGridLineGeo = new THREE.BufferGeometry();
    innerGridLineGeo.setAttribute("position", new THREE.Float32BufferAttribute(innerGridLinePositions, 3));

    // 3. Materials
    // Land Tiles: Glossy dark metallic hex tiles WITH VIBRANT EMISSIVE GLOW!
    const brandColor = new THREE.Color(brandPrimaryHex);

    const landMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#121722"),
        emissive: brandColor,
        emissiveIntensity: 0.45,
        roughness: 0.2,
        metalness: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        reflectivity: 1.0
    });
    const landMesh = new THREE.Mesh(landGeo, landMaterial);
    group.add(landMesh);

    // Ocean Tiles: Deep dark translucent glassy tiles
    const oceanMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#030712"),
        roughness: 0.1,
        metalness: 0.2,
        transparent: true,
        opacity: 0.88,
        clearcoat: 1.0
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMaterial);
    group.add(oceanMesh);

    // Primary Neon Continent Edge Glow (Vibrant brand color)
    const outlineMaterial = new THREE.LineBasicMaterial({
        color: brandColor,
        linewidth: 3
    });
    const outlineLines = new THREE.LineSegments(outlineLineGeo, outlineMaterial);
    group.add(outlineLines);

    // Super Bright Inner Core Line (White / High-luminance pop for extreme brightness!)
    const coreLineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color("#ffffff"),
        linewidth: 1.5
    });
    const coreLines = new THREE.LineSegments(coreLineGeo, coreLineMaterial);
    group.add(coreLines);

    // Ocean Wireframe Grid
    const innerGridMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color("#1e293b"),
        transparent: true,
        opacity: 0.35
    });
    const innerGridLines = new THREE.LineSegments(innerGridLineGeo, innerGridMaterial);
    group.add(innerGridLines);

    // 4. Inner Glowing Core Sphere
    const coreGeo = new THREE.SphereGeometry(0.97, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: brandColor,
        transparent: true,
        opacity: 0.28
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMaterial);
    group.add(coreMesh);

    // Dynamic Color Updater
    const updateColors = (primaryHex: string) => {
        const col = new THREE.Color(primaryHex);
        landMaterial.emissive.copy(col);
        outlineMaterial.color.copy(col);
        coreMaterial.color.copy(col);
    };

    return {
        group,
        landMesh,
        oceanMesh,
        outlineLines,
        coreLines,
        innerGridLines,
        landMaterial,
        outlineMaterial,
        coreLineMaterial,
        updateColors
    };
}
