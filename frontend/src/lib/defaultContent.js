import {
    SERVICE_CATEGORIES,
    MANIFESTO_CHAPTERS,
    TESTIMONIALS,
    LOGO_URL,
    HERO_IMAGE,
} from "./content";

// The site's default content shape. The live editor stores overrides
// under the same keys in /api/content; anything not overridden falls back
// to these defaults so the site always renders.
export const DEFAULT_CONTENT = {
    brand: {
        logo_url: LOGO_URL,
        name: "Overall Beauty & Wellness",
        blurb: "Where beauty meets wellness. Personalized care, authored one client at a time.",
        watermark: "Overall Beauty",
    },
    nav: {
        links: [
            { label: "Philosophy", href: "#philosophy" },
            { label: "Services", href: "#services" },
            { label: "Results", href: "#results" },
            { label: "Founder", href: "#founder" },
            { label: "Consultation", href: "#consultation" },
            { label: "Contact", href: "#contact" },
        ],
        cta_label: "Book Consultation",
        signin_label: "Sign in",
        signup_label: "Sign up",
    },
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
        image: HERO_IMAGE,
        est_line1: "Est. 2025 — Board-certified",
        est_line2: "Family Nurse Practitioner",
        chapter_label: "Chapter 00 · The Invitation",
        eyebrow: "Where beauty meets wellness",
        line1: "Refresh.",
        line2: "Restore.",
        line3: "Revitalize —",
        line4: "overall.",
        subtitle:
            "Personalized aesthetic and wellness treatments authored one client at a time by Crystal G. Marrero, FNP-C — safe, evidence-informed, unmistakably yours.",
        cta_primary: "Book Complimentary Consultation",
        cta_secondary: "View services",
        scroll_label: "Scroll",
        badge_top: "Now welcoming",
        badge_bottom: "Founding clients",
    },
    manifesto: {
        eyebrow: "The Manifesto",
        title_line1: "Where beauty",
        title_line2: "meets",
        title_italic: "wellness.",
        subtitle:
            "Confidence begins with feeling your best. Our practice is built on care that is safe, honest, and visibly authored around you.",
        chapters: MANIFESTO_CHAPTERS,
    },
    founder: {
        eyebrow: "02 — The Founder",
        plaque_label: "The Founder",
        est_label: "Est. 2025",
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
        stats: [
            { k: "Complimentary", v: "Consultations" },
            { k: "Evidence-", v: "informed care" },
            { k: "1-on-1", v: "with the founder" },
        ],
        cta_label: "Meet with Crystal",
        cta_note: "— Your journey starts with a conversation.",
    },
    services: {
        eyebrow: "04 — The Menu",
        heading_line1: "A precise",
        heading_italic: "service",
        heading_line2: "menu.",
        subtitle:
            "Founding Client Launch Special — contact us for current promotional pricing on select treatments. Complimentary consultation always included.",
        footer_note:
            "Every treatment begins with a personalized consultation to develop a plan tailored to your goals and overall wellness.",
        cta_note: "Pricing may vary — full plan at consultation",
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
        duration: "≈ 45 minutes",
        includes: "Personalized treatment plan",
        cost: "Complimentary",
        submit_label: "Request Consultation",
        reply_note: "We reply within 1 business day.",
    },
    testimonials_meta: {
        eyebrow: "06 — Words from our clients",
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
    footer: {
        mission_label: "Our mission",
        explore_label: "Explore",
        contact_label: "Contact",
        legal_label: "Legal",
        follow_label: "Follow",
        hours_label: "Hours",
        credit: "Board-certified",
    },
    mobile_bar: {
        call_label: "Call now",
        book_label: "Book consultation",
    },
    testimonials: TESTIMONIALS,
    gallery: {
        enabled: true,
        eyebrow: "07 — Results",
        title: "Real results,",
        title_italic: "real people.",
        subtitle:
            "A look at what personalized, evidence-informed treatment can do. Every plan is built around your face, your goals and your timeline.",
        before_label: "Before",
        after_label: "After",
        disclaimer:
            "Photos are of consenting clients. Individual results vary — your plan is discussed at consultation.",
        items: [],
    },
    promo_video: {
        enabled: true,
        src: "/promo.mp4",
        src_webm: "/promo.webm",
        src_mobile: "/promo_mobile.mp4",
        src_mobile_webm: "/promo_mobile.webm",
        delay_seconds: 5,
        once_per_visit: true,
        title: "Grand Opening — Sunday, August 30th",
        subtitle:
            "12PM–4PM · 208 Airport Plaza Boulevard, Suite 8, Farmingdale, NY · Free giveaways, raffles & beauty demos. Stop by and say hi.",
        cta_label: "Book Consultation",
        dismiss_label: "Maybe later",
        expires_on: "2026-08-31",
        rsvp_enabled: true,
        rsvp_label: "RSVP to the event",
        rsvp_note: "Let us know you're coming and we'll save you a spot.",
        rsvp_success: "You're on the list — see you there!",
        event_name: "Grand Opening — Sunday, August 30th",
        event_date: "2026-08-30",
        event_details: "12PM–4PM · 208 Airport Plaza Boulevard, Suite 8, Farmingdale, NY",
    },
    faq: {
        eyebrow: "Questions",
        title: "Frequently asked questions",
        subtitle:
            "Everything clients usually ask before their first visit. Still unsure? Book a complimentary consultation and we'll talk it through.",
        items: [
            {
                q: "Do I need a consultation before treatment?",
                a: "Yes — every client starts with a complimentary one-on-one consultation with Crystal G. Marrero, FNP-C. We review your goals, health history, and build a personalized plan before anything is scheduled.",
            },
            {
                q: "Who performs the treatments?",
                a: "All treatments are performed by Crystal G. Marrero, a board-certified Family Nurse Practitioner. You are never handed off to a technician.",
            },
            {
                q: "How long do results last?",
                a: "It depends on the treatment. Neurotoxins such as Botox and Xeomin typically last 3–4 months, filler 9–18 months, and biostimulators like Sculptra build collagen over months with results that can last up to two years.",
            },
            {
                q: "Is there downtime?",
                a: "Most injectable and hydrodermabrasion appointments have little to no downtime. Mild redness or swelling can occur and usually settles within a day or two. We give you full pre- and post-care instructions.",
            },
            {
                q: "What is your cancellation policy?",
                a: "Please give at least 24 hours' notice to reschedule. Repeated no-shows may require a deposit to secure future appointments.",
            },
            {
                q: "How do I book?",
                a: "Use the Book Consultation button anywhere on this site, choose a date and time that works for you, and you'll receive a confirmation. You can also call or email us directly.",
            },
        ],
    },
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

// Compute a nested diff so we only persist what differs from the defaults.
export function computeDiff(defaults, draft) {
    if (Array.isArray(draft)) {
        return JSON.stringify(draft) !== JSON.stringify(defaults) ? draft : undefined;
    }
    if (draft && typeof draft === "object") {
        const out = {};
        for (const k of Object.keys(draft)) {
            const d = defaults?.[k];
            const v = draft[k];
            if (v !== undefined) {
                const sub = computeDiff(d, v);
                if (sub !== undefined) out[k] = sub;
            }
        }
        return Object.keys(out).length ? out : undefined;
    }
    return draft !== defaults ? draft : undefined;
}

// Set a value at a dotted path ("hero.line1", "testimonials.0.quote") on a clone.
export function setPath(obj, path, value) {
    const keys = path.split(".");
    const root = Array.isArray(obj) ? [...obj] : { ...obj };
    let cur = root;
    for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        const nextIsIndex = /^\d+$/.test(keys[i + 1]);
        const existing = cur[k];
        cur[k] = Array.isArray(existing)
            ? [...existing]
            : existing && typeof existing === "object"
              ? { ...existing }
              : nextIsIndex
                ? []
                : {};
        cur = cur[k];
    }
    cur[keys[keys.length - 1]] = value;
    return root;
}
