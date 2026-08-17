import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useContent } from "../../lib/contentContext";

export default function Services() {
    const { content } = useContent();
    const S = content.services;
    const [active, setActive] = useState(S.categories?.[0]?.id);
    const ref = useRef(null);
    const current =
        S.categories.find((c) => c.id === active) || S.categories[0];
    const ci = S.categories.findIndex((c) => c.id === current.id);

    const onMove = (e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--x", `${e.clientX - r.left}px`);
        el.style.setProperty("--y", `${e.clientY - r.top}px`);
    };

    return (
        <section
            id="services"
            ref={ref}
            onMouseMove={onMove}
            className="spotlight relative overflow-hidden bg-ink py-20 sm:py-24 lg:py-40"
            data-testid="services-section"
        >
            <div className="relative z-10 mx-auto max-w-[1600px] px-4 sm:px-8">
                <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-[1fr_1fr]">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9 }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <div className="label mb-6 flex items-center gap-3 text-gold">
                            <span className="h-px w-10 bg-gold/60" />
                            <span data-edit="services.eyebrow">{S.eyebrow}</span>
                        </div>
                        <h2 className="font-serif text-4xl leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
                            <span data-edit="services.heading_line1">
                                {S.heading_line1}
                            </span>{" "}
                            <em
                                className="italic text-gold-gradient animate-shimmer"
                                data-edit="services.heading_italic"
                            >
                                {S.heading_italic}
                            </em>{" "}
                            <br />
                            <span data-edit="services.heading_line2">
                                {S.heading_line2}
                            </span>
                        </h2>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="max-w-xl text-base text-white/60 sm:text-lg lg:justify-self-end"
                        data-edit="services.subtitle"
                    >
                        {S.subtitle}
                    </motion.p>
                </div>

                <div className="scrollbar-hide mt-12 -mx-4 flex items-center gap-x-6 gap-y-4 overflow-x-auto whitespace-nowrap border-b border-white/10 px-4 pb-4 sm:mx-0 sm:flex-wrap sm:whitespace-normal sm:px-0">
                    {S.categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActive(cat.id)}
                            data-testid={`service-tab-${cat.id}`}
                            data-active={active === cat.id}
                            className={`link-underline label shrink-0 transition-colors ${
                                active === cat.id
                                    ? "text-gold"
                                    : "text-white/50 hover:text-white"
                            }`}
                        >
                            <span className="mr-2 font-serif text-xs italic normal-case text-gold/70">
                                {cat.number} —
                            </span>
                            {cat.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={active}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="mt-10 grid grid-cols-1 gap-10 lg:mt-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16"
                    >
                        <div className="relative aspect-[4/5] overflow-hidden lg:aspect-auto lg:min-h-[560px]">
                            <div className="absolute inset-0 border border-gold/30" />
                            <div className="absolute inset-0 z-10 bg-gradient-to-t from-ink/70 via-transparent to-ink/30" />
                            <motion.img
                                key={active + "-img"}
                                initial={{ scale: 1.05, opacity: 0.6 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                    duration: 1.6,
                                    ease: [0.2, 0.8, 0.2, 1],
                                }}
                                src={current.image}
                                alt={current.label}
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3">
                                <div className="font-serif text-4xl italic text-gold sm:text-5xl">
                                    {current.number}
                                </div>
                                <div>
                                    <div className="label text-white/60">
                                        Category
                                    </div>
                                    <div
                                        className="font-serif text-xl italic text-white sm:text-2xl"
                                        data-edit={`services.categories.${ci}.label`}
                                    >
                                        {current.label}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p
                                className="font-serif text-xl italic text-white/90 sm:text-2xl"
                                data-edit={`services.categories.${ci}.blurb`}
                            >
                                {current.blurb}
                            </p>
                            <ul className="mt-6 divide-y divide-white/10 border-y border-white/10 sm:mt-8">
                                {current.items.map((it, i) => (
                                    <motion.li
                                        key={it.name + i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            delay: i * 0.05,
                                            duration: 0.5,
                                        }}
                                        className="group grid grid-cols-[1fr_auto] items-baseline gap-6 py-5 sm:py-6"
                                        data-testid={`service-item-${current.id}-${i}`}
                                    >
                                        <div>
                                            <div
                                                className="font-serif text-xl italic text-white transition-colors group-hover:text-gold sm:text-2xl"
                                                data-edit={`services.categories.${ci}.items.${i}.name`}
                                            >
                                                {it.name}
                                            </div>
                                            {it.aka && (
                                                <div
                                                    className="mt-1 label text-gold/70"
                                                    data-edit={`services.categories.${ci}.items.${i}.aka`}
                                                >
                                                    {it.aka}
                                                </div>
                                            )}
                                            {it.description && (
                                                <p
                                                    className="mt-2 max-w-xl text-sm leading-relaxed text-white/60 sm:text-[15px]"
                                                    data-edit={`services.categories.${ci}.items.${i}.description`}
                                                >
                                                    {it.description}
                                                </p>
                                            )}
                                            {it.note && (
                                                <div
                                                    className="mt-2 label text-white/40"
                                                    data-edit={`services.categories.${ci}.items.${i}.note`}
                                                >
                                                    {it.note}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div
                                                data-edit={`services.categories.${ci}.items.${i}.price`}
                                                className={`font-serif text-2xl sm:text-3xl ${
                                                    it.price === "Coming Soon"
                                                        ? "italic text-gold/70"
                                                        : "text-gold"
                                                }`}
                                            >
                                                {it.price}
                                            </div>
                                            {it.unit && (
                                                <div
                                                    className="label text-white/40"
                                                    data-edit={`services.categories.${ci}.items.${i}.unit`}
                                                >
                                                    {it.unit}
                                                </div>
                                            )}
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                            <p
                                className="mt-6 max-w-2xl border-l-2 border-gold/50 pl-4 font-serif text-base italic leading-relaxed text-white/75 sm:text-lg"
                                data-testid={`services-footer-note-${current.id}`}
                                data-edit="services.footer_note"
                            >
                                {S.footer_note}
                            </p>
                            <div className="mt-8 flex flex-wrap items-center gap-6 sm:mt-10">
                                <Link
                                    to="/book"
                                    data-testid={`services-cta-${current.id}`}
                                    className="group relative inline-flex items-center gap-3 border border-gold px-5 py-3 label text-gold transition-colors duration-500 hover:text-ink sm:gap-4 sm:px-6"
                                >
                                    <span className="absolute inset-0 origin-left scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100" />
                                    <span className="relative">
                                        Book — {current.label}
                                    </span>
                                    <span className="relative h-px w-6 bg-gold transition-all duration-500 group-hover:w-10 group-hover:bg-ink sm:w-8 sm:group-hover:w-12" />
                                </Link>
                                <div
                                    className="label text-white/40"
                                    data-edit="services.cta_note"
                                >
                                    {S.cta_note}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}
