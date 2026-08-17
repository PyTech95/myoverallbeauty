import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Nav from "../components/Nav";
import Footer from "../components/sections/Footer";
import { useLenis } from "../lib/useLenis";
import { useSeo, breadcrumbs } from "../lib/seo";

export default function LegalPage({
    eyebrow,
    title,
    updated,
    children,
    seoPath,
    seoDescription,
}) {
    useLenis();
    useSeo({
        title: `${title} — Overall Beauty & Wellness`,
        description:
            seoDescription ||
            `${title} for Overall Beauty & Wellness, an aesthetic and wellness practice in Farmingdale, NY.`,
        path: seoPath || "/",
        jsonLd: breadcrumbs([
            { name: "Home", path: "/" },
            { name: title, path: seoPath || "/" },
        ]),
    });
    return (
        <main
            id="main-content"
            className="grain relative min-h-screen bg-ink text-white"
            data-testid="legal-page"
        >
            <Nav />
            <section className="relative border-b border-white/10">
                <div className="mx-auto max-w-4xl px-4 py-16 sm:px-8 sm:py-24">
                    <Link
                        to="/"
                        data-testid="legal-back-home"
                        className="link-underline inline-flex min-h-[44px] items-center gap-2 text-base font-medium text-white/85 hover:text-gold"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to home
                    </Link>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mt-10"
                    >
                        <div className="label text-gold">{eyebrow}</div>
                        <h1 className="mt-4 font-serif text-4xl italic leading-tight sm:text-5xl lg:text-6xl">
                            {title}
                        </h1>
                        {updated && (
                            <div className="mt-5 label text-white/40">
                                Last updated: {updated}
                            </div>
                        )}
                    </motion.div>
                </div>
            </section>

            <article className="mx-auto max-w-3xl px-4 py-16 sm:px-8 sm:py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    viewport={{ once: true }}
                    className="prose-legal space-y-6 text-base leading-relaxed text-white/85 sm:text-lg"
                >
                    {children}
                </motion.div>
            </article>

            <Footer />
        </main>
    );
}

export function LegalSection({ title, children }) {
    return (
        <section>
            <h2 className="mt-10 font-serif text-2xl italic text-white sm:text-3xl">
                {title}
            </h2>
            <div className="mt-4 space-y-4">{children}</div>
        </section>
    );
}
