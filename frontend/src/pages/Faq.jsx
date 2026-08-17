import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Minus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Nav from "../components/Nav";
import Footer from "../components/sections/Footer";
import { useLenis } from "../lib/useLenis";
import { useContent } from "../lib/contentContext";
import { useLiveEditing } from "../lib/liveEdit";
import { DEFAULT_CONTENT, computeDiff, setPath } from "../lib/defaultContent";
import { useSeo, breadcrumbs } from "../lib/seo";

export default function Faq() {
    useLenis();
    const { content, saveOverrides } = useContent();
    const editing = useLiveEditing();
    const F = content.faq || {};
    const items = useMemo(() => F.items || [], [F.items]);
    const [open, setOpen] = useState(0);

    const jsonLd = useMemo(
        () => [
            {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: items.map((it) => ({
                    "@type": "Question",
                    name: it.q,
                    acceptedAnswer: { "@type": "Answer", text: it.a },
                })),
            },
            breadcrumbs([
                { name: "Home", path: "/" },
                { name: "FAQ", path: "/faq" },
            ]),
        ],
        [items],
    );

    useSeo({
        title: `FAQ — ${content.brand?.name || "Overall Beauty & Wellness"}`,
        description:
            "Answers to common questions about consultations, injectables, hydrodermabrasion, IV hydration, downtime, results, pricing and our cancellation policy at Overall Beauty & Wellness in Farmingdale, NY.",
        path: "/faq",
        jsonLd,
    });

    async function persist(nextItems) {
        const next = setPath(content, "faq.items", nextItems);
        await saveOverrides(computeDiff(DEFAULT_CONTENT, next) || {});
    }

    async function addItem() {
        try {
            await persist([
                ...items,
                { q: "New question", a: "Type the answer here." },
            ]);
            setOpen(items.length);
            toast.success("Question added — click the text to edit it.");
        } catch {
            toast.error("Could not add the question.");
        }
    }

    async function removeItem(i) {
        try {
            const next = [...items];
            next.splice(i, 1);
            await persist(next);
            toast.success("Question removed.");
        } catch {
            toast.error("Could not remove the question.");
        }
    }

    return (
        <main
            className="grain relative min-h-screen bg-ink text-white"
            data-testid="faq-page"
        >
            <Nav />

            <section className="relative border-b border-white/10">
                <div className="mx-auto max-w-5xl px-4 py-16 sm:px-8 sm:py-24">
                    <Link
                        to="/"
                        data-testid="faq-back-home"
                        className="label link-underline inline-flex items-center gap-2 text-white/60 hover:text-gold"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to home
                    </Link>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mt-10"
                    >
                        <div className="label text-gold" data-edit="faq.eyebrow">
                            {F.eyebrow}
                        </div>
                        <h1
                            className="mt-4 font-serif text-4xl italic leading-tight sm:text-5xl lg:text-6xl"
                            data-edit="faq.title"
                        >
                            {F.title}
                        </h1>
                        <p
                            className="mt-6 max-w-2xl text-base text-white/60 sm:text-lg"
                            data-edit="faq.subtitle"
                        >
                            {F.subtitle}
                        </p>
                    </motion.div>
                </div>
            </section>

            <section className="mx-auto max-w-4xl px-4 py-16 sm:px-8 sm:py-20">
                <div className="divide-y divide-white/10 border-y border-white/10">
                    {items.map((it, i) => {
                        const isOpen = open === i;
                        return (
                            <div key={i} className="py-6" data-testid={`faq-item-${i}`}>
                                <div className="flex items-start gap-4">
                                    <button
                                        onClick={() => setOpen(isOpen ? -1 : i)}
                                        className="flex flex-1 items-start justify-between gap-6 text-left"
                                        aria-expanded={isOpen}
                                        data-testid={`faq-toggle-${i}`}
                                    >
                                        <span
                                            className={`font-serif text-xl italic transition-colors sm:text-2xl ${
                                                isOpen ? "text-gold" : "text-white"
                                            }`}
                                            data-edit={`faq.items.${i}.q`}
                                        >
                                            {it.q}
                                        </span>
                                        <span className="mt-2 shrink-0 text-gold">
                                            {isOpen ? (
                                                <Minus className="h-4 w-4" />
                                            ) : (
                                                <Plus className="h-4 w-4" />
                                            )}
                                        </span>
                                    </button>
                                    {editing && (
                                        <button
                                            onClick={() => removeItem(i)}
                                            aria-label="Remove question"
                                            data-testid={`faq-remove-${i}`}
                                            className="mt-1 shrink-0 border border-white/15 p-2 text-white/50 transition-colors hover:border-red-400 hover:text-red-400"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.35 }}
                                            className="overflow-hidden"
                                        >
                                            <p
                                                className="mt-4 max-w-3xl text-base leading-relaxed text-white/70"
                                                data-edit={`faq.items.${i}.a`}
                                                data-testid={`faq-answer-${i}`}
                                            >
                                                {it.a}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>

                {editing && (
                    <button
                        onClick={addItem}
                        data-testid="faq-add"
                        className="mt-8 inline-flex items-center gap-2 border border-gold px-5 py-3 text-[10px] tracking-[0.24em] uppercase text-gold transition-colors hover:bg-gold hover:text-ink"
                    >
                        <Plus className="h-3.5 w-3.5" /> Add question
                    </button>
                )}

                <div className="mt-16 flex flex-wrap items-center gap-6 border-t border-white/10 pt-10">
                    <Link
                        to="/book"
                        data-testid="faq-cta-book"
                        className="group inline-flex items-center gap-4 border border-gold bg-gold px-6 py-3.5 text-[11px] tracking-[0.24em] uppercase font-medium text-ink transition-transform duration-500 hover:translate-y-[-2px]"
                    >
                        {content.nav?.cta_label}
                        <span className="h-px w-8 bg-ink transition-all duration-500 group-hover:w-12" />
                    </Link>
                    <div className="font-serif text-xl italic text-white/70 sm:text-2xl">
                        Still have a question? Ask us at your consultation.
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
