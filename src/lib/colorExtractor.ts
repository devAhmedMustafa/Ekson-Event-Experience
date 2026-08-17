/**
 * Brand Color Extractor Utility
 *
 * Extracts the most dominant UN-NEUTRAL (chromatic / vibrant) color from a brand logo image.
 * Explicitly filters out background whites, off-whites, blacks, and neutral greys.
 */

export interface ExtractedBrandColors {
    /** Main dominant un-neutral hex color (e.g. "#43a047", "#009dd6", "#ff5722") */
    primary: string;
    /** RGB array [r, g, b] */
    primaryRgb: [number, number, number];
    /** HSL representation { h, s, l } */
    hsl: { h: number; s: number; l: number };
    /** Appropriate text color for readability against the primary background ("#ffffff" | "#0f172a") */
    contrastText: string;
    /** Darker shade for borders, hover states, or dark UI headers */
    darkShade: string;
    /** Lighter 10% opacity tint for subtle card backgrounds */
    lightTint: string;
    /** Secondary accent / harmonic shade */
    accent: string;
    /** Top detected un-neutral color palette in descending dominance order */
    palette: string[];
}

export const FALLBACK_COLOR: ExtractedBrandColors = {
    primary: "#009dd6",
    primaryRgb: [0, 157, 214],
    hsl: { h: 196, s: 1.0, l: 0.42 },
    contrastText: "#ffffff",
    darkShade: "#04547c",
    lightTint: "rgba(0, 157, 214, 0.12)",
    accent: "#00b4d8",
    palette: ["#009dd6", "#04547c", "#00b4d8"]
};

// Convert RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return [Math.round(h * 360), s, l];
}

// Convert RGB to HEX string
export function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (c: number) => {
        const hex = Math.round(Math.max(0, Math.min(255, c))).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert HEX to RGB array
export function hexToRgb(hex: string): [number, number, number] {
    const cleanHex = hex.replace("#", "").trim();
    if (cleanHex.length === 3) {
        return [
            parseInt(cleanHex[0] + cleanHex[0], 16),
            parseInt(cleanHex[1] + cleanHex[1], 16),
            parseInt(cleanHex[2] + cleanHex[2], 16)
        ];
    }
    if (cleanHex.length === 6) {
        return [
            parseInt(cleanHex.slice(0, 2), 16),
            parseInt(cleanHex.slice(2, 4), 16),
            parseInt(cleanHex.slice(4, 6), 16)
        ];
    }
    return [0, 157, 214];
}

interface ColorBucket {
    rSum: number;
    gSum: number;
    bSum: number;
    score: number;
    count: number;
    hue: number;
    sat: number;
    light: number;
}

/**
 * Extracts dominant un-neutral chromatic colors from an ImageData buffer
 */
export function extractDominantColorFromImageData(imageData: ImageData): ExtractedBrandColors {
    const data = imageData.data;
    const len = data.length;

    function runExtraction(minChroma: number) {
        const buckets: Map<string, ColorBucket> = new Map();

        for (let i = 0; i < len; i += 4) {
            const a = data[i + 3];
            // Skip transparent / semi-transparent background pixels
            if (a < 60) continue;

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const chroma = max - min; // 0 (pure grey) to 255 (pure saturated)

            // Filter out neutral whites, blacks, and greys
            if (chroma < minChroma) continue;

            const lightness = (max + min) / 510; // 0.0 to 1.0

            // Skip extreme near-white or near-black backgrounds
            if (lightness > 0.94 && chroma < 35) continue;
            if (lightness < 0.08 && chroma < 35) continue;

            const [h, s, l] = rgbToHsl(r, g, b);

            // Bucket by Hue (36 segments of 10° each) and Lightness (4 segments)
            const hueBin = Math.floor(h / 10) * 10;
            const lightBin = Math.floor(l * 4);
            const bucketKey = `${hueBin}_${lightBin}`;

            // Vibrant Weighting: prioritize rich, saturated brand colors
            const satWeight = Math.pow(Math.max(0.1, s), 1.3);
            const lightWeight = Math.max(0.2, 1.0 - Math.abs(l - 0.5) * 1.3);
            const alphaWeight = a / 255;
            const weight = satWeight * lightWeight * alphaWeight * (chroma / 255) * 10;

            const existing = buckets.get(bucketKey);
            if (existing) {
                existing.rSum += r * weight;
                existing.gSum += g * weight;
                existing.bSum += b * weight;
                existing.score += weight;
                existing.count++;
            } else {
                buckets.set(bucketKey, {
                    rSum: r * weight,
                    gSum: g * weight,
                    bSum: b * weight,
                    score: weight,
                    count: 1,
                    hue: h,
                    sat: s,
                    light: l
                });
            }
        }

        return buckets;
    }

    // Attempt standard chromatic extraction (chroma >= 16)
    let buckets = runExtraction(16);

    // If logo has lower saturation (pastel/subtle tones), lower threshold
    if (buckets.size === 0) {
        buckets = runExtraction(8);
    }

    // Fallback if logo is 100% grayscale/monochrome
    if (buckets.size === 0) {
        return FALLBACK_COLOR;
    }

    // Sort buckets by weighted score descending
    const sorted = Array.from(buckets.values()).sort((a, b) => b.score - a.score);

    // Build palette of unique vibrant colors
    const palette: string[] = [];
    for (const b of sorted) {
        const r = Math.round(b.rSum / b.score);
        const g = Math.round(b.gSum / b.score);
        const bl = Math.round(b.bSum / b.score);
        const hex = rgbToHex(r, g, bl);
        if (!palette.includes(hex)) {
            palette.push(hex);
            if (palette.length >= 5) break;
        }
    }

    const topBucket = sorted[0];
    const bestR = Math.round(topBucket.rSum / topBucket.score);
    const bestG = Math.round(topBucket.gSum / topBucket.score);
    const bestB = Math.round(topBucket.bSum / topBucket.score);

    const primaryHex = rgbToHex(bestR, bestG, bestB);
    const [finalH, finalS, finalL] = rgbToHsl(bestR, bestG, bestB);

    // Contrast text formula (W3C perceived luminance)
    const luminance = (0.299 * bestR + 0.587 * bestG + 0.114 * bestB) / 255;
    const contrastText = luminance > 0.60 ? "#0f172a" : "#ffffff";

    // Dark corporate shade
    const darkShade = rgbToHex(bestR * 0.55, bestG * 0.55, bestB * 0.55);
    // Soft tint
    const lightTint = `rgba(${bestR}, ${bestG}, ${bestB}, 0.12)`;
    // Accent shade
    const accent = palette[1] || rgbToHex(Math.min(255, bestR * 1.3), Math.min(255, bestG * 1.3), Math.min(255, bestB * 1.3));

    return {
        primary: primaryHex,
        primaryRgb: [bestR, bestG, bestB],
        hsl: { h: finalH, s: Number(finalS.toFixed(2)), l: Number(finalL.toFixed(2)) },
        contrastText,
        darkShade,
        lightTint,
        accent,
        palette
    };
}

/**
 * Extracts dominant un-neutral brand color from an image URL, base64 data URL, File/Blob, or HTMLImageElement
 */
export async function extractDominantColor(
    source: string | HTMLImageElement | HTMLCanvasElement | Blob
): Promise<ExtractedBrandColors> {
    if (typeof window === "undefined") {
        return FALLBACK_COLOR;
    }

    try {
        let canvas: HTMLCanvasElement;

        if (source instanceof HTMLCanvasElement) {
            canvas = source;
        } else if (source instanceof HTMLImageElement) {
            canvas = document.createElement("canvas");
            const w = Math.max(16, Math.min(100, source.naturalWidth || source.width || 100));
            const h = Math.max(16, Math.min(100, source.naturalHeight || source.height || 100));
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) return FALLBACK_COLOR;
            ctx.drawImage(source, 0, 0, w, h);
        } else {
            // String (data URL, blob URL, or external URL) or Blob
            let imageSourceUrl: string;
            let shouldRevoke = false;

            if (source instanceof Blob) {
                imageSourceUrl = URL.createObjectURL(source);
                shouldRevoke = true;
            } else {
                imageSourceUrl = source;
            }

            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const imgEl = new Image();
                // IMPORTANT: Only set crossOrigin for remote HTTP URLs to prevent canvas tainting on data: URIs
                if (imageSourceUrl.startsWith("http://") || imageSourceUrl.startsWith("https://")) {
                    imgEl.crossOrigin = "anonymous";
                }
                imgEl.onload = () => resolve(imgEl);
                imgEl.onerror = (e) => reject(e);
                imgEl.src = imageSourceUrl;
            });

            if (shouldRevoke) {
                URL.revokeObjectURL(imageSourceUrl);
            }

            canvas = document.createElement("canvas");
            const w = Math.max(16, Math.min(100, img.naturalWidth || img.width || 100));
            const h = Math.max(16, Math.min(100, img.naturalHeight || img.height || 100));
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) return FALLBACK_COLOR;
            ctx.drawImage(img, 0, 0, w, h);
        }

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return FALLBACK_COLOR;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return extractDominantColorFromImageData(imageData);
    } catch (e) {
        console.warn("Color extraction encountered an issue, using fallback:", e);
        return FALLBACK_COLOR;
    }
}
