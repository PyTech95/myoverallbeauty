import { SERVICE_CATEGORIES, MANIFESTO_CHAPTERS, TESTIMONIALS } from "./content";

// The site's default content shape. The live editor stores overrides
// under the same keys in /api/content; anything not overridden falls back
// to these defaults so the site always renders.
export const DEFAULT_CONTENT = {
    banner: {
        enabled: true,
        text: "Founding Client Launch Special — limited-time pricing available",
        secondary: "Contact us for current promotional pricing",
        tertiary: "Complimentary consultation with Crystal G. Marrero, FNP-C",
    },
    marquee: {
        words: [
            "Botox",
            "Xeomin",
            "Lip Filler",
            "Sculptra",
            "Radiesse",
            "Microneedling",
            "PRP",
            "PDO Threads",
            "Hydrodermabrasion",
            "Hair Restoration",
            "IV Hydration",
            "Wellness",
            "Beauty",
            "Confidence",
            "Renewal",
        ],
    },
    hero: {
        eyebrow: "Where beauty meets wellness",
        line1: "Refresh.",
        line2: "Restore.",
        line3: "Revitalize —",
        line4: "overall.",
        subtitle:
            "Personalized aesthetic and wellness treatments authored one client at a time by Crystal G. Marrero, FNP-C — safe, evidence-informed, unmistakably yours.",
        badge_top: "Now welcoming",
        badge_bottom: "Founding clients",
    },
    manifesto: {
        title_line1: "Where beauty",
        title_line2: "meets",
        title_italic: "wellness.",
        subtitle:
            "Confidence begins with feeling your best. Our practice is built on care that is safe, honest, and visibly authored around you.",
        chapters: MANIFESTO_CHAPTERS,
    },
    founder: {
        name: "Crystal G. Marrero",
        title: "FNP-C",
        subtitle: "Board-certified · Family Nurse Practitioner",
        heading_line1: "Clinical expertise,",
        heading_line2: "authored with",
        heading_italic: "care.",
        bio: [
            "I'm Crystal G. Marrero, FNP-C — a board-certified family nurse practitioner and founder of Overall Beauty and Wellness. My approach combines clinical precision with a focus on natural-looking results.",
            "I'm committed to personalized care, honest guidance, and treatments tailored to your goals. Whether you're refreshing your appearance, improving your skin, or supporting your overall wellness — I'm here to help you feel confident and cared for.",
        ],
    },
    services: {
        eyebrow: "04 — The Menu",
        heading_line1: "A precise",
        heading_italic: "service",
        heading_line2: "menu.",
        subtitle:
            "Founding Client Launch Special — contact us for current promotional pricing on select treatments. Complimentary consultation always included.",
        categories: SERVICE_CATEGORIES,
    },
    consultation: {
        eyebrow: "05 — The Consultation",
        heading_line1: "Your journey",
        heading_line2: "starts with a",
        heading_italic: "conversation.",
        body:
            "Meet one-on-one with our family nurse practitioner to discuss your goals, review your concerns, and receive a personalized treatment plan.",
        tag: "Complimentary. No obligation.",
    },
    mission:
        "To provide personalized aesthetic and wellness treatments that enhance confidence and support your overall well-being through safe, compassionate, evidence-informed care.",
    contact: {
        email: "Info@myoverallbeauty.com",
        phone: "+15163477619",
        phone_display: "516-347-7619",
        address_line_1: "Located in Farmingdale, NY",
        address_line_2: "By appointment only",
        hours: [
            "Mon — Fri · 9:00 AM — 6:00 PM",
            "Sat · 10:00 AM — 4:00 PM",
            "Sun · Closed",
        ],
        social: {
            instagram: "",
            facebook: "",
        },
    },
    testimonials: TESTIMONIALS,
    legal: {
        business_name: "Overall Beauty & Wellness",
        owner: "Crystal G. Marrero, FNP-C",
        jurisdiction: "United States",
        effective_date: "2025",
    },
};

export function mergeContent(defaults, overrides) {
    if (!overrides) return defaults;
    const out = Array.isArray(defaults) ? [...defaults] : { ...defaults };
    for (const key of Object.keys(overrides)) {
        const dv = defaults?.[key];
        const ov = overrides[key];
        if (
            dv &&
            typeof dv === "object" &&
            !Array.isArray(dv) &&
            ov &&
            typeof ov === "object" &&
            !Array.isArray(ov)
        ) {
            out[key] = mergeContent(dv, ov);
        } else if (ov !== undefined && ov !== null) {
            out[key] = ov;
        }
    }
    return out;
}
