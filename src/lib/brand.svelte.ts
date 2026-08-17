// Centralized reactive brand store using Svelte 5 runes
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
    }
}

export const brand = new BrandStore();
