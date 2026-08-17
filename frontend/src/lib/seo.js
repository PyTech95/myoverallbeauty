import { useEffect } from "react";

const SITE_URL = "https://www.myoverallbeauty.com";
const MANAGED = "data-seo-managed";

function upsert(selector, attrs) {
    let el = document.head.querySelector(selector);
    if (!el) {
        el = document.createElement(attrs.tag);
        el.setAttribute(MANAGED, "1");
        document.head.appendChild(el);
    }
    for (const [k, v] of Object.entries(attrs)) {
        if (k !== "tag" && v != null) el.setAttribute(k, v);
    }
    return el;
}

function meta(nameOrProp, value, isProperty = false) {
    if (!value) return;
    const key = isProperty ? "property" : "name";
    upsert(`meta[${key}="${nameOrProp}"]`, {
        tag: "meta",
        [key]: nameOrProp,
        content: value,
    });
}

// Per-route head management: title, description, canonical, OG/Twitter,
// robots and JSON-LD structured data.
export function useSeo({
    title,
    description,
    path = "/",
    image,
    noindex = false,
    jsonLd,
}) {
    useEffect(() => {
        const url = `${SITE_URL}${path === "/" ? "/" : path}`;
        if (title) document.title = title;
        meta("description", description);
        meta(
            "robots",
            noindex
                ? "noindex, nofollow"
                : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
        );
        upsert('link[rel="canonical"]', { tag: "link", rel: "canonical", href: url });
        meta("og:url", url, true);
        meta("og:title", title, true);
        meta("og:description", description, true);
        if (image) meta("og:image", image, true);
        meta("twitter:title", title);
        meta("twitter:description", description);
        if (image) meta("twitter:image", image);

        document
            .querySelectorAll('script[data-seo-jsonld="1"]')
            .forEach((n) => n.remove());
        const blocks = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
        blocks.forEach((b) => {
            const s = document.createElement("script");
            s.type = "application/ld+json";
            s.setAttribute("data-seo-jsonld", "1");
            s.textContent = JSON.stringify(b);
            document.head.appendChild(s);
        });
    }, [title, description, path, image, noindex, jsonLd]);
}

export function breadcrumbs(trail) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: trail.map((t, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: t.name,
            item: `${SITE_URL}${t.path}`,
        })),
    };
}

export { SITE_URL };
