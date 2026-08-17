import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useContent } from "../../lib/contentContext";

export default function Testimonials() {
    const { content } = useContent();
    const list = content.testimonials || [];
    const [i, setI] = useState(0);
    if (!list.length) return null;
    const idx = Math.min(i, list.length - 1);
    const next = () => setI((v) => (v + 1) % list.length);
    const prev = () => setI((v) => (v - 1 + list.length) % list.length);
    const t = list[idx];

    return (
        <section
            className="relative overflow-hidden bg-ink py-24 lg:py-40"
            data-testid="testimonials-section"
        >
            <div className="mx-auto max-w-[1200px] px-4 sm:px-8 text-center">
                <div className="label mb-8 inline-flex items-center gap-3 text-gold">
                    <span className="h-px w-10 bg-gold/60" />
                    <span data-edit="testimonials_meta.eyebrow">
                        {content.testimonials_meta?.eyebrow}
                    </span>
                    <span className="h-px w-10 bg-gold/60" />
                </div>
                <div className="font-serif text-8xl italic text-gold/20 leading-none">
                    &ldquo;
                </div>
                <motion.blockquote
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9 }}
                    className="mx-auto max-w-4xl font-serif text-3xl italic leading-[1.2] text-white sm:text-4xl lg:text-5xl"
                    data-testid={`testimonial-${idx}`}
                    data-edit={`testimonials.${idx}.quote`}
                >
                    {t.quote}
                </motion.blockquote>
                <div
                    className="mt-10 label text-gold"
                    data-edit={`testimonials.${idx}.author`}
                >
                    {t.author}
                </div>
                <div
                    className="label mt-1 text-white/40"
                    data-edit={`testimonials.${idx}.role`}
                >
                    {t.role}
                </div>

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
                        {list.map((_, k) => (
                            <button
                                key={k}
                                onClick={() => setI(k)}
                                aria-label={`Testimonial ${k + 1}`}
                                data-testid={`t-dot-${k}`}
                                className={`h-px w-8 transition-colors ${
                                    k === idx ? "bg-gold" : "bg-white/20"
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
