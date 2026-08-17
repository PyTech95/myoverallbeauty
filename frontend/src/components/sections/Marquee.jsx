import { useContent } from "../../lib/contentContext";

export default function Marquee() {
    const { content } = useContent();
    const words = (content.marquee?.words || []).filter(
        (w) => typeof w === "string" && w.trim(),
    );
    if (!words.length) return null;

    const row = (
        <div className="flex shrink-0 items-center gap-16 pr-16">
            {words.map((w, i) => (
                <span key={i} className="flex items-center gap-16">
                    <span className="font-serif text-6xl italic text-white/85 sm:text-7xl lg:text-8xl">
                        {w}
                    </span>
                    <span
                        className="font-serif text-3xl text-gold/70"
                        aria-hidden
                    >
                        ✦
                    </span>
                </span>
            ))}
        </div>
    );
    return (
        <section
            className="relative overflow-hidden border-y border-white/10 bg-ink py-10"
            data-testid="marquee-section"
            aria-label="Featured treatments"
        >
            <div className="marquee-track">
                {row}
                {row}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-ink to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-ink to-transparent" />
        </section>
    );
}
