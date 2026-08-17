import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TESTIMONIALS } from "../../lib/content";

export default function Testimonials() {
    const [i, setI] = useState(0);
    const next = () => setI((v) => (v + 1) % TESTIMONIALS.length);
    const prev = () =>
        setI((v) => (v - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
    const t = TESTIMONIALS[i];

    return (
        <section
            className="relative overflow-hidden bg-ink py-24 lg:py-40"
            data-testid="testimonials-section"
        >
            <div className="mx-auto max-w-[1200px] px-4 sm:px-8 text-center">
                <div className="label mb-8 inline-flex items-center gap-3 text-gold">
                    <span className="h-px w-10 bg-gold/60" />
                    06 — Words from our clients
                    <span className="h-px w-10 bg-gold/60" />
                </div>
                <div className="font-serif text-8xl italic text-gold/20 leading-none">
                    &ldquo;
                </div>
                <motion.blockquote
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9 }}
                    className="mx-auto max-w-4xl font-serif text-3xl italic leading-[1.2] text-white sm:text-4xl lg:text-5xl"
                    data-testid={`testimonial-${i}`}
                >
                    {t.quote}
                </motion.blockquote>
                <div className="mt-10 label text-gold">{t.author}</div>
                <div className="label mt-1 text-white/40">{t.role}</div>

                <div className="mt-12 flex items-center justify-center gap-6">
                    <button
                        onClick={prev}
                        aria-label="Previous"
                        data-testid="t-prev"
                        className="grid h-11 w-11 place-items-center border border-white/15 text-white/60 transition-colors hover:border-gold hover:text-gold"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex gap-2">
                        {TESTIMONIALS.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setI(idx)}
                                aria-label={`Testimonial ${idx + 1}`}
                                data-testid={`t-dot-${idx}`}
                                className={`h-px w-8 transition-colors ${
                                    idx === i ? "bg-gold" : "bg-white/20"
                                }`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={next}
                        aria-label="Next"
                        data-testid="t-next"
                        className="grid h-11 w-11 place-items-center border border-white/15 text-white/60 transition-colors hover:border-gold hover:text-gold"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </section>
    );
}
