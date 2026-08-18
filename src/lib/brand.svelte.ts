// Centralized reactive brand store using Svelte 5 runes
import { extractDominantColor, FALLBACK_COLOR, type ExtractedBrandColors } from "./colorExtractor";

const STORAGE_KEY = "ekson_brand_profile";
export const DEFAULT_BRAND = "Ekson";
export const DEFAULT_DESCRIPTION =
    "Ekson is an innovative technology company specializing in modern digital platforms, event management and tracking systems, and smart AI workflow automation integrations with scalable cloud backends.";

class BrandStore {
    name = $state(DEFAULT_BRAND);
    description = $state(DEFAULT_DESCRIPTION);
    logo = $state<string | null>(null);
    logoName = $state("");
    industry = $state("Technology & Innovation");
    primaryColor = $state(FALLBACK_COLOR.primary);
    darkColor = $state(FALLBACK_COLOR.darkShade);
    contrastText = $state(FALLBACK_COLOR.contrastText);
    lightTint = $state(FALLBACK_COLOR.lightTint);
    palette = $state<string[]>(FALLBACK_COLOR.palette);

    get isCustom(): boolean {
        return this.name.trim().toLowerCase() !== DEFAULT_BRAND.toLowerCase() && this.name.trim() !== "";
    }

    constructor() {
        if (typeof window !== "undefined") {
            this.load();
            window.addEventListener("ekson_brand_updated", (e: Event) => {
                const customEvent = e as CustomEvent;
                if (customEvent.detail) {
                    this.name = customEvent.detail.companyName || DEFAULT_BRAND;
                    this.description = customEvent.detail.companyDescription || DEFAULT_DESCRIPTION;
                    this.logo = customEvent.detail.brandLogo || null;
                    this.logoName = customEvent.detail.brandLogoName || "";
                    this.industry = customEvent.detail.industry || "Technology & Innovation";
                    if (customEvent.detail.primaryColor) {
                        this.primaryColor = customEvent.detail.primaryColor;
                        this.darkColor = customEvent.detail.darkColor || FALLBACK_COLOR.darkShade;
                        this.contrastText = customEvent.detail.contrastText || FALLBACK_COLOR.contrastText;
                        this.lightTint = customEvent.detail.lightTint || FALLBACK_COLOR.lightTint;
                        this.palette = customEvent.detail.palette || FALLBACK_COLOR.palette;
                    }
                } else {
                    this.load();
                }
            });
            window.addEventListener("storage", (e: StorageEvent) => {
                if (e.key === STORAGE_KEY) {
                    this.load();
                }
            });
        }
    }

    load() {
        if (typeof window === "undefined") return;
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.name = (parsed.companyName && parsed.companyName.trim()) ? parsed.companyName.trim() : DEFAULT_BRAND;
                this.description = (parsed.companyDescription && parsed.companyDescription.trim()) ? parsed.companyDescription.trim() : DEFAULT_DESCRIPTION;
                this.logo = parsed.brandLogo || null;
                this.logoName = parsed.brandLogoName || "";
                this.industry = parsed.industry || "Technology & Innovation";
                this.primaryColor = parsed.primaryColor || FALLBACK_COLOR.primary;
                this.darkColor = parsed.darkColor || FALLBACK_COLOR.darkShade;
                this.contrastText = parsed.contrastText || FALLBACK_COLOR.contrastText;
                this.lightTint = parsed.lightTint || FALLBACK_COLOR.lightTint;
                this.palette = parsed.palette || FALLBACK_COLOR.palette;
                return;
            }
        } catch (e) {
            console.warn("Failed to load brand profile:", e);
        }
        this.name = DEFAULT_BRAND;
        this.description = DEFAULT_DESCRIPTION;
        this.logo = null;
        this.logoName = "";
        this.industry = "Technology & Innovation";
        this.primaryColor = FALLBACK_COLOR.primary;
        this.darkColor = FALLBACK_COLOR.darkShade;
        this.contrastText = FALLBACK_COLOR.contrastText;
        this.lightTint = FALLBACK_COLOR.lightTint;
        this.palette = FALLBACK_COLOR.palette;
    }
}

export const brand = new BrandStore();
