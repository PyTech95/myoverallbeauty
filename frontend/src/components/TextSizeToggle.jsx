import { useEffect, useState } from "react";
import { Type } from "lucide-react";

const KEY = "obw_text_scale";
const STEPS = ["base", "lg", "xl"];
const LABELS = { base: "A", lg: "A+", xl: "A++" };
const TITLES = {
    base: "Text size: normal — tap for larger",
    lg: "Text size: large — tap for largest",
    xl: "Text size: largest — tap to reset",
};

export default function TextSizeToggle({ className = "" }) {
    const [step, setStep] = useState("base");

    useEffect(() => {
        const saved = localStorage.getItem(KEY);
        const next = STEPS.includes(saved) ? saved : "base";
        setStep(next);
        document.documentElement.dataset.textScale = next;
    }, []);

    function cycle() {
        const next = STEPS[(STEPS.indexOf(step) + 1) % STEPS.length];
        setStep(next);
        localStorage.setItem(KEY, next);
        document.documentElement.dataset.textScale = next;
    }

    return (
        <button
            onClick={cycle}
            title={TITLES[step]}
            aria-label={TITLES[step]}
            data-testid="text-size-toggle"
            data-scale={step}
            className={`inline-flex min-h-[44px] items-center gap-2 border border-white/25 px-3 py-2 text-white/80 transition-colors hover:border-gold hover:text-gold ${className}`}
        >
            <Type className="h-4 w-4" strokeWidth={1.7} />
            <span className="text-sm font-semibold tracking-wide">{LABELS[step]}</span>
        </button>
    );
}
