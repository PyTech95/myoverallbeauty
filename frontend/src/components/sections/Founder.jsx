import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { useContent } from "../../lib/contentContext";

export default function Founder() {
    const { content } = useContent();
    const F = content.founder;
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });
    const yShift = useTransform(scrollYProgress, [0, 1], [40, -40]);

    // Initials for the typographic monogram
    const initials = (F.name || "")
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0]?.toUpperCase())
        .slice(0, 3)
        .join(".");

    return (
        <section
            id="founder"
            ref={ref}
            className="relative overflow-hidden bg-cream py-20 sm:py-24 lg:py-40"
            data-testid="founder-section"
        >
            {/* Subtle typographic backdrop — huge italic "Crystal" ghosted across the top */}
            <motion.div
                aria-hidden
                style={{ y: yShift }}
                className="pointer-events-none absolute -top-10 left-[-4vw] right-[-4vw] select-none whitespace-nowrap font-serif italic text-ink/[.05] leading-[0.85] tracking-tight"
                data-testid="founder-name-backdrop"
            >
                <div className="text-[26vw] sm:text-[22vw] lg:text-[20vw]">
                    {(F.name || "").split(" ")[0]}.
                </div>
            </motion.div>

            <div className="relative mx-auto max-w-[1600px] px-4 sm:px-8">
                <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-[1fr_1.15fr] lg:gap-24">
                    {/* LEFT — Typographic "signature plaque" replacing the portrait */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
                        viewport={{ once: true, margin: "-120px" }}
                        className="relative flex flex-col"
                        data-testid="founder-signature-plaque"
                    >
                        {/* The plaque itself */}
                        <div className="relative border border-ink/15 bg-cream/80 px-8 py-12 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.25)] sm:px-12 sm:py-16">
                            {/* Decorative corner marks */}
                            <span className="absolute left-3 top-3 h-3 w-3 border-l border-t border-gold" />
                            <span className="absolute right-3 top-3 h-3 w-3 border-r border-t border-gold" />
                            <span className="absolute bottom-3 left-3 h-3 w-3 border-b border-l border-gold" />
                            <span className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-gold" />

                            <div className="label text-ink/50" data-edit="founder.plaque_label">
                                {F.plaque_label}
                            </div>

                            {/* Monogram — big serif initials */}
                            <div
                                className="mt-6 font-serif italic text-gold-dark leading-none tracking-tight"
                                data-testid="founder-monogram"
                            >
                                <span className="text-[6rem] sm:text-[8rem] lg:text-[9rem]">
                                    {initials || "C.M."}
                                </span>
                            </div>

                            {/* Gold hairline */}
                            <div className="my-8 flex items-center gap-4">
                                <span className="h-px flex-1 bg-gold/50" />
                                <span className="label text-gold" data-edit="founder.est_label">
                                    {F.est_label}
                                </span>
                                <span className="h-px flex-1 bg-gold/50" />
                            </div>

                            {/* Full name */}
                            <h3
                                className="font-serif italic text-ink leading-[0.95] tracking-tight text-4xl sm:text-5xl lg:text-6xl"
                                data-testid="founder-name"
                                data-edit="founder.name"
                            >
                                {F.name}
                            </h3>

                            {/* Title + subtitle */}
                            <div className="mt-5 label text-gold" data-edit="founder.title">
                                {F.title}
                            </div>
                            <div
                                className="mt-2 text-sm leading-relaxed text-ink/60 sm:text-base"
                                data-edit="founder.subtitle"
                            >
                                {F.subtitle}
                            </div>
                        </div>

                        {/* A short mission caption below the plaque */}
                        <div className="mt-8 border-l-2 border-gold pl-5 font-serif text-lg italic leading-relaxed text-ink/70 sm:text-xl">
                            “
                            <span data-edit="mission">
                                {content.mission ||
                                    "Personalized care, authored one client at a time."}
                            </span>
                            ”
                        </div>
                    </motion.div>

                    {/* RIGHT — Unchanged narrative */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                        viewport={{ once: true, margin: "-120px" }}
                    >
                        <div className="label mb-6 flex items-center gap-3 text-gold-dark">
                            <span className="h-px w-10 bg-gold-dark/60" />
                            <span data-edit="founder.eyebrow">{F.eyebrow}</span>
                        </div>
                        <h2 className="font-serif text-3xl leading-[0.98] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                            <span data-edit="founder.heading_line1">
                                {F.heading_line1}
                            </span>{" "}
                            <br />
                            <span data-edit="founder.heading_line2">
                                {F.heading_line2}
                            </span>{" "}
                            <em className="italic text-gold-dark" data-edit="founder.heading_italic">
                                {F.heading_italic}
                            </em>
                        </h2>
                        <div className="mt-10 space-y-5 text-base leading-relaxed text-ink/80 sm:text-lg">
                            {(F.bio || []).map((p, i) => (
                                <p key={i} data-edit={`founder.bio.${i}`}>
                                    {p}
                                </p>
                            ))}
                        </div>

                        <div className="mt-12 grid grid-cols-2 gap-6 border-y border-ink/10 py-8 sm:grid-cols-3">
                            {(F.stats || []).map((s, i) => (
                                <div key={i}>
                                    <div
                                        className="label text-gold-dark"
                                        data-edit={`founder.stats.${i}.k`}
                                    >
                                        {s.k}
                                    </div>
                                    <div
                                        className="mt-2 font-serif text-xl italic text-ink sm:text-2xl"
                                        data-edit={`founder.stats.${i}.v`}
                                    >
                                        {s.v}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 flex flex-wrap items-center gap-6">
                            <Link
                                to="/book"
                                data-testid="founder-cta-book"
                                className="group relative inline-flex items-center gap-4 border border-ink bg-ink px-6 py-3.5 text-[11px] tracking-[0.24em] uppercase font-medium text-cream transition-transform duration-500 hover:translate-y-[-2px] sm:px-7 sm:py-4 sm:text-[12px]"
                            >
                                <span data-edit="founder.cta_label">{F.cta_label}</span>
                                <span className="h-px w-8 bg-gold transition-all duration-500 group-hover:w-12" />
                            </Link>
                            <div
                                className="font-serif text-xl italic text-ink/70 sm:text-2xl"
                                data-edit="founder.cta_note"
                            >
                                {F.cta_note}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
