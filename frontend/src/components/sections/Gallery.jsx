import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useContent } from "../../lib/contentContext";

export default function Gallery() {
    const { content } = useContent();
    const G = content.gallery || {};
    const items = (G.items || []).filter((it) => it.before || it.after);
    const [active, setActive] = useState(0);
    if (!G.enabled || !items.length) return null;
    const it = items[Math.min(active, items.length - 1)];

    return (
        <section
            id="results"
            className="relative overflow-hidden bg-ink py-20 sm:py-28 lg:py-36"
            data-testid="gallery-section"
        >
            <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true, margin: "-80px" }}
                    className="max-w-3xl"
                >
                    <div className="label mb-6 inline-flex items-center gap-3 text-gold">
                        <span className="h-px w-10 bg-gold/60" />
                        <span data-edit="gallery.eyebrow">{G.eyebrow}</span>
                    </div>
                    <h2 className="font-serif text-4xl leading-[0.98] tracking-tight text-white sm:text-5xl lg:text-6xl">
                        <span data-edit="gallery.title">{G.title}</span>{" "}
                        <em
                            className="italic text-gold-gradient animate-shimmer"
                            data-edit="gallery.title_italic"
                        >
                            {G.title_italic}
                        </em>
                    </h2>
                    <p
                        className="mt-6 text-base text-white/85 sm:text-lg"
                        data-edit="gallery.subtitle"
                    >
                        {G.subtitle}
                    </p>
                </motion.div>

                <div className="mt-12 grid gap-8 lg:grid-cols-2">
                    {[
                        { key: "before", label: G.before_label, src: it.before },
                        { key: "after", label: G.after_label, src: it.after },
                    ].map((pane) => (
                        <motion.figure
                            key={pane.key}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                            viewport={{ once: true }}
                            className="relative border border-white/10 bg-white/[0.03]"
                            data-testid={`gallery-${pane.key}`}
                        >
                            <div className="absolute left-4 top-4 z-10 border border-gold/50 bg-black/70 px-3 py-1.5 text-sm font-semibold uppercase tracking-wider text-gold backdrop-blur">
                                {pane.label}
                            </div>
                            {pane.src ? (
                                <img
                                    src={pane.src}
                                    alt={`${pane.label} — ${it.caption || "treatment result"}`}
                                    loading="lazy"
                                    className="aspect-[4/5] w-full object-cover"
                                />
                            ) : (
                                <div className="grid aspect-[4/5] w-full place-items-center text-white/40">
                                    No photo yet
                                </div>
                            )}
                        </motion.figure>
                    ))}
                </div>

                {it.caption && (
                    <div
                        className="mt-8 font-serif text-xl italic text-white/90 sm:text-2xl"
                        data-testid="gallery-caption"
                    >
                        {it.caption}
                    </div>
                )}

                {items.length > 1 && (
                    <div className="mt-8 flex flex-wrap gap-3" data-testid="gallery-tabs">
                        {items.map((x, i) => (
                            <button
                                key={i}
                                onClick={() => setActive(i)}
                                data-testid={`gallery-tab-${i}`}
                                data-active={i === active}
                                className={`min-h-[44px] border px-4 py-2 text-sm font-medium transition-colors ${
                                    i === active
                                        ? "border-gold bg-gold/10 text-gold"
                                        : "border-white/20 text-white/80 hover:border-white/50"
                                }`}
                            >
                                {x.label || `Result ${i + 1}`}
                            </button>
                        ))}
                    </div>
                )}

                <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-white/10 pt-10">
                    <Link
                        to="/book"
                        data-testid="gallery-cta-book"
                        className="group inline-flex items-center gap-4 border border-gold bg-gold px-6 py-4 text-[11px] tracking-[0.2em] uppercase font-semibold text-ink transition-transform duration-500 hover:translate-y-[-2px]"
                    >
                        {content.nav?.cta_label}
                        <span className="h-px w-8 bg-ink transition-all duration-500 group-hover:w-12" />
                    </Link>
                    <div
                        className="text-base text-white/80"
                        data-edit="gallery.disclaimer"
                    >
                        {G.disclaimer}
                    </div>
                </div>
            </div>
        </section>
    );
}
