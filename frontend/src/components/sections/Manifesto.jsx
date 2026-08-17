import { motion } from "framer-motion";
import { useContent } from "../../lib/contentContext";

export default function Manifesto() {
    const { content } = useContent();
    const M = content.manifesto;
    return (
        <section
            id="philosophy"
            className="relative overflow-hidden bg-ink py-20 sm:py-24 lg:py-40"
            data-testid="manifesto-section"
        >
            <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr] lg:gap-24">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <div className="label mb-6 flex items-center gap-3 text-gold">
                            <span className="h-px w-10 bg-gold/60" />
                            The Manifesto
                        </div>
                        <h2 className="font-serif text-4xl leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
                            {M.title_line1} <br />
                            {M.title_line2}{" "}
                            <em className="italic text-gold-gradient animate-shimmer">
                                {M.title_italic}
                            </em>
                        </h2>
                        <div className="mt-8 max-w-md text-white/60">
                            {M.subtitle}
                        </div>
                    </motion.div>

                    <div className="space-y-14 lg:space-y-20">
                        {M.chapters.map((c, i) => (
                            <motion.article
                                key={`${c.n}-${i}`}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.9,
                                    delay: i * 0.08,
                                    ease: [0.2, 0.8, 0.2, 1],
                                }}
                                viewport={{ once: true, margin: "-100px" }}
                                className="grid grid-cols-[auto_1fr] gap-6 sm:gap-8"
                                data-testid={`manifesto-chapter-${c.n}`}
                            >
                                <div className="font-serif text-2xl italic text-gold">
                                    {c.n}
                                </div>
                                <div>
                                    <div className="hairline mb-6 -mt-2" />
                                    <h3 className="font-serif text-2xl italic text-white sm:text-3xl lg:text-4xl">
                                        {c.title}
                                    </h3>
                                    <p className="mt-5 max-w-2xl text-base text-white/70 leading-relaxed sm:text-lg">
                                        {c.body}
                                    </p>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
