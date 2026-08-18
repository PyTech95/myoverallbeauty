import { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Save, RotateCcw, ChevronRight, ExternalLink, Plus, Trash2, Upload, X, Image as ImageIcon, Film } from "lucide-react";
import { useContent } from "../lib/contentContext";
import { DEFAULT_CONTENT, mergeContent, computeDiff } from "../lib/defaultContent";
import { API } from "../lib/api";
import axios from "axios";

const SECTIONS = [
    { id: "brand", label: "Brand & menu" },
    { id: "banner", label: "Launch banner" },
    { id: "promo_video", label: "Pop-up video" },
    { id: "marquee", label: "Scrolling words" },
    { id: "hero", label: "Hero" },
    { id: "manifesto", label: "Manifesto" },
    { id: "founder", label: "Founder" },
    { id: "services", label: "Services & prices" },
    { id: "consultation", label: "Consultation" },
    { id: "mission", label: "Mission" },
    { id: "contact", label: "Contact & hours" },
    { id: "testimonials", label: "Testimonials" },
    { id: "gallery", label: "Before & after" },
    { id: "faq", label: "FAQ" },
    { id: "footer", label: "Footer labels" },
    { id: "legal", label: "Legal metadata" },
];

export default function StudioEditor() {
    const { content, overrides, saveOverrides, refresh } = useContent();
    const [active, setActive] = useState("brand");
    const [draft, setDraft] = useState(content);
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState(false);

    // sync draft with server content when overrides change externally
    useEffect(() => {
        setDraft(content);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(overrides)]);

    const dirty = useMemo(
        () => JSON.stringify(draft) !== JSON.stringify(content),
        [draft, content],
    );

    function patch(section, next) {
        setDraft((d) => ({ ...d, [section]: { ...(d[section] || {}), ...next } }));
    }

    function patchNested(section, key, next) {
        setDraft((d) => ({
            ...d,
            [section]: {
                ...(d[section] || {}),
                [key]: next,
            },
        }));
    }

    async function save() {
        setSaving(true);
        try {
            // Only send diffs from defaults so overrides collection stays small
            const diff = computeDiff(DEFAULT_CONTENT, draft);
            await saveOverrides(diff);
            toast.success("Site content updated.");
        } catch (e) {
            toast.error("Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    function reset() {
        setDraft(content);
    }

    async function resetAllToDefaults() {
        if (
            !window.confirm(
                "Reset ALL content back to the built-in defaults? This will discard your overrides.",
            )
        )
            return;
        setSaving(true);
        try {
            await saveOverrides({});
            await refresh();
            toast.success("Reverted to defaults.");
        } catch (e) {
            toast.error("Failed to reset.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr] lg:gap-12"
            data-testid="studio-editor"
        >
            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 lg:h-fit">
                <div className="label text-gold">Site editor</div>
                <div className="mt-4 space-y-1 border-l border-white/10 pl-4">
                    {SECTIONS.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setActive(s.id)}
                            data-testid={`editor-tab-${s.id}`}
                            data-active={active === s.id}
                            className={`group flex w-full items-center justify-between py-2 label transition-colors ${
                                active === s.id
                                    ? "text-gold"
                                    : "text-white/60 hover:text-white"
                            }`}
                        >
                            <span>{s.label}</span>
                            <ChevronRight
                                className={`h-3.5 w-3.5 transition-transform ${
                                    active === s.id ? "translate-x-0.5 text-gold" : "text-white/30"
                                }`}
                            />
                        </button>
                    ))}
                </div>
                <div className="mt-8 space-y-2 border-t border-white/10 pt-6">
                    <button
                        onClick={save}
                        disabled={!dirty || saving}
                        data-testid="editor-save"
                        className="inline-flex w-full items-center justify-center gap-2 border border-gold bg-gold px-4 py-3 text-[10px] tracking-[0.24em] uppercase font-medium text-ink transition-transform hover:translate-y-[-1px] disabled:opacity-40"
                    >
                        <Save className="h-3.5 w-3.5" />
                        {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
                    </button>
                    <button
                        onClick={reset}
                        disabled={!dirty}
                        data-testid="editor-discard"
                        className="inline-flex w-full items-center justify-center gap-2 border border-white/15 px-4 py-3 label text-white/70 transition-colors hover:border-white/40 disabled:opacity-40"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Discard
                    </button>
                    <a
                        href="/"
                        target="_blank"
                        rel="noreferrer"
                        data-testid="editor-open-site"
                        className="inline-flex w-full items-center justify-center gap-2 border border-white/15 px-4 py-3 label text-white/70 transition-colors hover:border-gold hover:text-gold"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open live site
                    </a>
                    <button
                        onClick={resetAllToDefaults}
                        data-testid="editor-reset-all"
                        className="w-full pt-3 text-xs text-white/40 hover:text-red-400/80 transition-colors"
                    >
                        Reset all to defaults
                    </button>
                </div>
            </aside>

            {/* Editor body */}
            <div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={active}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.35 }}
                    >
                        {active === "brand" && (
                            <SectionCard
                                title="Brand & menu"
                                hint="Logo, business name, footer blurb, and the navigation menu."
                            >
                                <ImageInput
                                    label="Logo"
                                    value={draft.brand?.logo_url || ""}
                                    onChange={(v) => patch("brand", { logo_url: v })}
                                    testid="editor-brand-logo"
                                    aspect="1/1"
                                />
                                <TextInput
                                    label="Business name"
                                    value={draft.brand?.name || ""}
                                    onChange={(v) => patch("brand", { name: v })}
                                    testid="editor-brand-name"
                                />
                                <TextArea
                                    label="Footer blurb"
                                    value={draft.brand?.blurb || ""}
                                    onChange={(v) => patch("brand", { blurb: v })}
                                    testid="editor-brand-blurb"
                                />
                                <TextInput
                                    label="Giant footer watermark"
                                    value={draft.brand?.watermark || ""}
                                    onChange={(v) => patch("brand", { watermark: v })}
                                    testid="editor-brand-watermark"
                                />
                                <div className="mt-6 space-y-3">
                                    <div className="label text-white/60">Menu links</div>
                                    {(draft.nav?.links || []).map((l, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input
                                                className="field"
                                                placeholder="Label"
                                                value={l.label || ""}
                                                data-testid={`editor-nav-label-${i}`}
                                                onChange={(e) => {
                                                    const arr = [...(draft.nav?.links || [])];
                                                    arr[i] = { ...arr[i], label: e.target.value };
                                                    patchNested("nav", "links", arr);
                                                }}
                                            />
                                            <input
                                                className="field"
                                                placeholder="#section or /path"
                                                value={l.href || ""}
                                                data-testid={`editor-nav-href-${i}`}
                                                onChange={(e) => {
                                                    const arr = [...(draft.nav?.links || [])];
                                                    arr[i] = { ...arr[i], href: e.target.value };
                                                    patchNested("nav", "links", arr);
                                                }}
                                            />
                                            <button
                                                onClick={() => {
                                                    const arr = [...(draft.nav?.links || [])];
                                                    arr.splice(i, 1);
                                                    patchNested("nav", "links", arr);
                                                }}
                                                className="shrink-0 border border-white/15 px-3 text-white/60 hover:border-red-400 hover:text-red-400"
                                                aria-label="Remove link"
                                                data-testid={`editor-nav-remove-${i}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() =>
                                            patchNested("nav", "links", [
                                                ...(draft.nav?.links || []),
                                                { label: "", href: "#" },
                                            ])
                                        }
                                        className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 label text-white/70 hover:border-gold hover:text-gold"
                                        data-testid="editor-nav-add"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add menu link
                                    </button>
                                </div>
                                <div className="mt-6 grid grid-cols-3 gap-4">
                                    <TextInput
                                        label="Book button"
                                        value={draft.nav?.cta_label || ""}
                                        onChange={(v) => patch("nav", { cta_label: v })}
                                        testid="editor-nav-cta"
                                    />
                                    <TextInput
                                        label="Sign in label"
                                        value={draft.nav?.signin_label || ""}
                                        onChange={(v) => patch("nav", { signin_label: v })}
                                        testid="editor-nav-signin"
                                    />
                                    <TextInput
                                        label="Sign up label"
                                        value={draft.nav?.signup_label || ""}
                                        onChange={(v) => patch("nav", { signup_label: v })}
                                        testid="editor-nav-signup"
                                    />
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <TextInput
                                        label="Mobile bar — call"
                                        value={draft.mobile_bar?.call_label || ""}
                                        onChange={(v) => patch("mobile_bar", { call_label: v })}
                                        testid="editor-mobilebar-call"
                                    />
                                    <TextInput
                                        label="Mobile bar — book"
                                        value={draft.mobile_bar?.book_label || ""}
                                        onChange={(v) => patch("mobile_bar", { book_label: v })}
                                        testid="editor-mobilebar-book"
                                    />
                                </div>
                            </SectionCard>
                        )}

                        {active === "testimonials" && (
                            <SectionCard
                                title="Testimonials"
                                hint="Client quotes shown in the rotating carousel."
                            >
                                <TextInput
                                    label="Section eyebrow"
                                    value={draft.testimonials_meta?.eyebrow || ""}
                                    onChange={(v) => patch("testimonials_meta", { eyebrow: v })}
                                    testid="editor-testimonials-eyebrow"
                                />
                                <div className="mt-6 space-y-6">
                                    {(draft.testimonials || []).map((t, i) => (
                                        <div key={i} className="border border-white/10 p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="label text-gold">
                                                    Quote {i + 1}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const arr = [...(draft.testimonials || [])];
                                                        arr.splice(i, 1);
                                                        setDraft({ ...draft, testimonials: arr });
                                                    }}
                                                    className="text-white/50 hover:text-red-400"
                                                    aria-label="Remove testimonial"
                                                    data-testid={`editor-testimonial-remove-${i}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <TextArea
                                                label="Quote"
                                                value={t.quote || ""}
                                                onChange={(v) => {
                                                    const arr = [...(draft.testimonials || [])];
                                                    arr[i] = { ...arr[i], quote: v };
                                                    setDraft({ ...draft, testimonials: arr });
                                                }}
                                                testid={`editor-testimonial-quote-${i}`}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <TextInput
                                                    label="Author"
                                                    value={t.author || ""}
                                                    onChange={(v) => {
                                                        const arr = [...(draft.testimonials || [])];
                                                        arr[i] = { ...arr[i], author: v };
                                                        setDraft({ ...draft, testimonials: arr });
                                                    }}
                                                    testid={`editor-testimonial-author-${i}`}
                                                />
                                                <TextInput
                                                    label="Role / treatment"
                                                    value={t.role || ""}
                                                    onChange={(v) => {
                                                        const arr = [...(draft.testimonials || [])];
                                                        arr[i] = { ...arr[i], role: v };
                                                        setDraft({ ...draft, testimonials: arr });
                                                    }}
                                                    testid={`editor-testimonial-role-${i}`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() =>
                                            setDraft({
                                                ...draft,
                                                testimonials: [
                                                    ...(draft.testimonials || []),
                                                    { quote: "", author: "", role: "" },
                                                ],
                                            })
                                        }
                                        className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 label text-white/70 hover:border-gold hover:text-gold"
                                        data-testid="editor-testimonial-add"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add testimonial
                                    </button>
                                </div>
                            </SectionCard>
                        )}

                        {active === "faq" && (
                            <SectionCard
                                title="FAQ page"
                                hint="Questions & answers shown on /faq. These also feed Google's FAQ rich results."
                            >
                                <TextInput
                                    label="Eyebrow"
                                    value={draft.faq?.eyebrow || ""}
                                    onChange={(v) => patch("faq", { eyebrow: v })}
                                    testid="editor-faq-eyebrow"
                                />
                                <TextInput
                                    label="Page title"
                                    value={draft.faq?.title || ""}
                                    onChange={(v) => patch("faq", { title: v })}
                                    testid="editor-faq-title"
                                />
                                <TextArea
                                    label="Intro paragraph"
                                    value={draft.faq?.subtitle || ""}
                                    onChange={(v) => patch("faq", { subtitle: v })}
                                    testid="editor-faq-subtitle"
                                />
                                <div className="mt-6 space-y-6">
                                    {(draft.faq?.items || []).map((it, i) => (
                                        <div key={i} className="border border-white/10 p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="label text-gold">
                                                    Question {i + 1}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const arr = [...(draft.faq?.items || [])];
                                                        arr.splice(i, 1);
                                                        patchNested("faq", "items", arr);
                                                    }}
                                                    className="text-white/50 hover:text-red-400"
                                                    aria-label="Remove question"
                                                    data-testid={`editor-faq-remove-${i}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <TextInput
                                                label="Question"
                                                value={it.q || ""}
                                                onChange={(v) => {
                                                    const arr = [...(draft.faq?.items || [])];
                                                    arr[i] = { ...arr[i], q: v };
                                                    patchNested("faq", "items", arr);
                                                }}
                                                testid={`editor-faq-q-${i}`}
                                            />
                                            <TextArea
                                                label="Answer"
                                                value={it.a || ""}
                                                onChange={(v) => {
                                                    const arr = [...(draft.faq?.items || [])];
                                                    arr[i] = { ...arr[i], a: v };
                                                    patchNested("faq", "items", arr);
                                                }}
                                                testid={`editor-faq-a-${i}`}
                                            />
                                        </div>
                                    ))}
                                    <button
                                        onClick={() =>
                                            patchNested("faq", "items", [
                                                ...(draft.faq?.items || []),
                                                { q: "", a: "" },
                                            ])
                                        }
                                        className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 label text-white/70 hover:border-gold hover:text-gold"
                                        data-testid="editor-faq-add"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add question
                                    </button>
                                </div>
                            </SectionCard>
                        )}

                        {active === "gallery" && (
                            <SectionCard
                                title="Before & after gallery"
                                hint="Upload paired photos. Only add photos you have written consent to publish."
                            >
                                <label className="flex items-center gap-3 py-2">
                                    <input
                                        type="checkbox"
                                        checked={!!draft.gallery?.enabled}
                                        data-testid="editor-gallery-enabled"
                                        onChange={(e) =>
                                            patch("gallery", { enabled: e.target.checked })
                                        }
                                    />
                                    <span className="text-sm text-white/80">
                                        Show the results section on the home page
                                    </span>
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <TextInput
                                        label="Eyebrow"
                                        value={draft.gallery?.eyebrow || ""}
                                        onChange={(v) => patch("gallery", { eyebrow: v })}
                                        testid="editor-gallery-eyebrow"
                                    />
                                    <TextInput
                                        label="Title"
                                        value={draft.gallery?.title || ""}
                                        onChange={(v) => patch("gallery", { title: v })}
                                        testid="editor-gallery-title"
                                    />
                                    <TextInput
                                        label="Title (italic part)"
                                        value={draft.gallery?.title_italic || ""}
                                        onChange={(v) => patch("gallery", { title_italic: v })}
                                        testid="editor-gallery-title-italic"
                                    />
                                    <TextInput
                                        label="'Before' label"
                                        value={draft.gallery?.before_label || ""}
                                        onChange={(v) => patch("gallery", { before_label: v })}
                                        testid="editor-gallery-before-label"
                                    />
                                    <TextInput
                                        label="'After' label"
                                        value={draft.gallery?.after_label || ""}
                                        onChange={(v) => patch("gallery", { after_label: v })}
                                        testid="editor-gallery-after-label"
                                    />
                                </div>
                                <TextArea
                                    label="Intro paragraph"
                                    value={draft.gallery?.subtitle || ""}
                                    onChange={(v) => patch("gallery", { subtitle: v })}
                                    testid="editor-gallery-subtitle"
                                />
                                <TextArea
                                    label="Disclaimer"
                                    value={draft.gallery?.disclaimer || ""}
                                    onChange={(v) => patch("gallery", { disclaimer: v })}
                                    testid="editor-gallery-disclaimer"
                                />

                                <div className="mt-6 space-y-6">
                                    {(draft.gallery?.items || []).map((it, i) => (
                                        <div
                                            key={i}
                                            className="border border-white/10 p-4"
                                            data-testid={`editor-gallery-item-${i}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="label text-gold">
                                                    Result {i + 1}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const arr = [...(draft.gallery?.items || [])];
                                                        arr.splice(i, 1);
                                                        patchNested("gallery", "items", arr);
                                                    }}
                                                    className="text-white/50 hover:text-red-400"
                                                    aria-label="Remove result"
                                                    data-testid={`editor-gallery-remove-${i}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                                <ImageInput
                                                    label="Before photo"
                                                    value={it.before || ""}
                                                    onChange={(v) => {
                                                        const arr = [...(draft.gallery?.items || [])];
                                                        arr[i] = { ...arr[i], before: v };
                                                        patchNested("gallery", "items", arr);
                                                    }}
                                                    testid={`editor-gallery-${i}-before`}
                                                    aspect="4/5"
                                                />
                                                <ImageInput
                                                    label="After photo"
                                                    value={it.after || ""}
                                                    onChange={(v) => {
                                                        const arr = [...(draft.gallery?.items || [])];
                                                        arr[i] = { ...arr[i], after: v };
                                                        patchNested("gallery", "items", arr);
                                                    }}
                                                    testid={`editor-gallery-${i}-after`}
                                                    aspect="4/5"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <TextInput
                                                    label="Tab label"
                                                    value={it.label || ""}
                                                    onChange={(v) => {
                                                        const arr = [...(draft.gallery?.items || [])];
                                                        arr[i] = { ...arr[i], label: v };
                                                        patchNested("gallery", "items", arr);
                                                    }}
                                                    testid={`editor-gallery-${i}-label`}
                                                />
                                                <TextInput
                                                    label="Caption"
                                                    value={it.caption || ""}
                                                    onChange={(v) => {
                                                        const arr = [...(draft.gallery?.items || [])];
                                                        arr[i] = { ...arr[i], caption: v };
                                                        patchNested("gallery", "items", arr);
                                                    }}
                                                    testid={`editor-gallery-${i}-caption`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() =>
                                            patchNested("gallery", "items", [
                                                ...(draft.gallery?.items || []),
                                                { before: "", after: "", label: "", caption: "" },
                                            ])
                                        }
                                        className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 label text-white/70 hover:border-gold hover:text-gold"
                                        data-testid="editor-gallery-add"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add before &amp; after
                                    </button>
                                </div>
                            </SectionCard>
                        )}

                        {active === "footer" && (
                            <SectionCard
                                title="Footer labels"
                                hint="The small column headings in the footer."
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        ["mission_label", "Mission label"],
                                        ["explore_label", "Explore label"],
                                        ["contact_label", "Contact label"],
                                        ["legal_label", "Legal label"],
                                        ["follow_label", "Follow label"],
                                        ["hours_label", "Hours label"],
                                        ["credit", "Bottom-right credit"],
                                    ].map(([k, label]) => (
                                        <TextInput
                                            key={k}
                                            label={label}
                                            value={draft.footer?.[k] || ""}
                                            onChange={(v) => patch("footer", { [k]: v })}
                                            testid={`editor-footer-${k}`}
                                        />
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {active === "promo_video" && (
                            <SectionCard
                                title="Pop-up video"
                                hint="A welcome video that opens over the home page a few seconds after it loads."
                            >
                                <label className="flex items-center gap-3 py-2">
                                    <input
                                        type="checkbox"
                                        checked={!!draft.promo_video?.enabled}
                                        data-testid="editor-promo-enabled"
                                        onChange={(e) =>
                                            patch("promo_video", {
                                                enabled: e.target.checked,
                                            })
                                        }
                                    />
                                    <span className="text-sm text-white/80">
                                        Show the pop-up video
                                    </span>
                                </label>
                                <label className="flex items-center gap-3 py-2">
                                    <input
                                        type="checkbox"
                                        checked={!!draft.promo_video?.once_per_visit}
                                        data-testid="editor-promo-once"
                                        onChange={(e) =>
                                            patch("promo_video", {
                                                once_per_visit: e.target.checked,
                                            })
                                        }
                                    />
                                    <span className="text-sm text-white/80">
                                        Only once per visit
                                    </span>
                                </label>
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                    <VideoInput
                                        label="Desktop video (landscape)"
                                        value={draft.promo_video?.src || ""}
                                        onChange={(v) =>
                                            patch("promo_video", { src: v, src_webm: "" })
                                        }
                                        testid="promo-src"
                                    />
                                    <VideoInput
                                        label="Mobile video (portrait)"
                                        value={draft.promo_video?.src_mobile || ""}
                                        onChange={(v) =>
                                            patch("promo_video", {
                                                src_mobile: v,
                                                src_mobile_webm: "",
                                            })
                                        }
                                        testid="promo-src-mobile"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <TextInput
                                        label="Delay before it opens (seconds)"
                                        value={String(draft.promo_video?.delay_seconds ?? 5)}
                                        onChange={(v) =>
                                            patch("promo_video", {
                                                delay_seconds: Number(v) || 0,
                                            })
                                        }
                                        testid="editor-promo-delay"
                                    />
                                    <label className="block">
                                        <div className="label mb-2 text-white/50">
                                            Stop showing after (date)
                                        </div>
                                        <input
                                            type="date"
                                            className="field"
                                            value={draft.promo_video?.expires_on || ""}
                                            data-testid="editor-promo-expires"
                                            onChange={(e) =>
                                                patch("promo_video", {
                                                    expires_on: e.target.value,
                                                })
                                            }
                                        />
                                    </label>
                                </div>
                                <TextInput
                                    label="Title"
                                    value={draft.promo_video?.title || ""}
                                    onChange={(v) => patch("promo_video", { title: v })}
                                    testid="editor-promo-title"
                                />
                                <TextArea
                                    label="Subtitle"
                                    value={draft.promo_video?.subtitle || ""}
                                    onChange={(v) => patch("promo_video", { subtitle: v })}
                                    testid="editor-promo-subtitle"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <TextInput
                                        label="Button label"
                                        value={draft.promo_video?.cta_label || ""}
                                        onChange={(v) => patch("promo_video", { cta_label: v })}
                                        testid="editor-promo-cta"
                                    />
                                    <TextInput
                                        label="Dismiss link label"
                                        value={draft.promo_video?.dismiss_label || ""}
                                        onChange={(v) =>
                                            patch("promo_video", { dismiss_label: v })
                                        }
                                        testid="editor-promo-dismiss"
                                    />
                                </div>
                                <div className="mt-6 border-t border-white/10 pt-6">
                                    <div className="label text-gold">Event RSVP</div>
                                    <label className="flex items-center gap-3 py-3">
                                        <input
                                            type="checkbox"
                                            checked={!!draft.promo_video?.rsvp_enabled}
                                            data-testid="editor-promo-rsvp-enabled"
                                            onChange={(e) =>
                                                patch("promo_video", {
                                                    rsvp_enabled: e.target.checked,
                                                })
                                            }
                                        />
                                        <span className="text-sm text-white/80">
                                            Let visitors RSVP from the pop-up
                                        </span>
                                    </label>
                                    <TextInput
                                        label="Event name (shown on the guest list)"
                                        value={draft.promo_video?.event_name || ""}
                                        onChange={(v) => patch("promo_video", { event_name: v })}
                                        testid="editor-promo-event-name"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="block">
                                            <div className="label mb-2 text-white/50">
                                                Event date (reminder is emailed that morning)
                                            </div>
                                            <input
                                                type="date"
                                                className="field"
                                                value={draft.promo_video?.event_date || ""}
                                                data-testid="editor-promo-event-date"
                                                onChange={(e) =>
                                                    patch("promo_video", {
                                                        event_date: e.target.value,
                                                    })
                                                }
                                            />
                                        </label>
                                        <TextInput
                                            label="Event details (time & address)"
                                            value={draft.promo_video?.event_details || ""}
                                            onChange={(v) =>
                                                patch("promo_video", { event_details: v })
                                            }
                                            testid="editor-promo-event-details"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <TextInput
                                            label="RSVP button label"
                                            value={draft.promo_video?.rsvp_label || ""}
                                            onChange={(v) =>
                                                patch("promo_video", { rsvp_label: v })
                                            }
                                            testid="editor-promo-rsvp-label"
                                        />
                                        <TextInput
                                            label="Thank-you message"
                                            value={draft.promo_video?.rsvp_success || ""}
                                            onChange={(v) =>
                                                patch("promo_video", { rsvp_success: v })
                                            }
                                            testid="editor-promo-rsvp-success"
                                        />
                                    </div>
                                    <TextArea
                                        label="Note above the RSVP form"
                                        value={draft.promo_video?.rsvp_note || ""}
                                        onChange={(v) => patch("promo_video", { rsvp_note: v })}
                                        testid="editor-promo-rsvp-note"
                                    />
                                </div>
                            </SectionCard>
                        )}

                        {active === "banner" && (
                            <SectionCard title="Launch banner" hint="Announcement bar at the top of the site.">
                                <Toggle
                                    label="Show banner"
                                    value={!!draft.banner?.enabled}
                                    onChange={(v) => patch("banner", { enabled: v })}
                                    testid="editor-banner-enabled"
                                />
                                <TextInput
                                    label="Primary message"
                                    value={draft.banner?.text || ""}
                                    onChange={(v) => patch("banner", { text: v })}
                                    testid="editor-banner-text"
                                />
                                <TextInput
                                    label="Secondary message"
                                    value={draft.banner?.secondary || ""}
                                    onChange={(v) => patch("banner", { secondary: v })}
                                    testid="editor-banner-secondary"
                                />
                                <TextInput
                                    label="Tertiary message"
                                    value={draft.banner?.tertiary || ""}
                                    onChange={(v) => patch("banner", { tertiary: v })}
                                    testid="editor-banner-tertiary"
                                />
                            </SectionCard>
                        )}

                        {active === "marquee" && (
                            <SectionCard
                                title="Scrolling words"
                                hint="The large words that scroll across the home page. Edit or remove any word — it saves instantly to the live site."
                            >
                                <div className="space-y-3">
                                    {(draft.marquee?.words || []).map((w, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input
                                                className="field"
                                                value={w}
                                                data-testid={`editor-marquee-word-${i}`}
                                                onChange={(e) => {
                                                    const arr = [...(draft.marquee?.words || [])];
                                                    arr[i] = e.target.value;
                                                    patchNested("marquee", "words", arr);
                                                }}
                                            />
                                            <button
                                                onClick={() => {
                                                    const arr = [...(draft.marquee?.words || [])];
                                                    arr.splice(i, 1);
                                                    patchNested("marquee", "words", arr);
                                                }}
                                                className="shrink-0 border border-white/15 px-3 text-white/60 transition-colors hover:border-red-400 hover:text-red-400"
                                                aria-label={`Remove ${w}`}
                                                data-testid={`editor-marquee-word-remove-${i}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() =>
                                            patchNested("marquee", "words", [
                                                ...(draft.marquee?.words || []),
                                                "",
                                            ])
                                        }
                                        className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 label text-white/70 transition-colors hover:border-gold hover:text-gold"
                                        data-testid="editor-marquee-add"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add word
                                    </button>
                                </div>
                            </SectionCard>
                        )}

                        {active === "hero" && (
                            <SectionCard title="Hero" hint="The kinetic headline & subtitle at the top of the home page.">
                                <ImageInput
                                    label="Background image"
                                    value={draft.hero?.image || ""}
                                    onChange={(v) => patch("hero", { image: v })}
                                    testid="editor-hero-image"
                                    aspect="16/9"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <TextInput label="Top-left line 1"
                                        value={draft.hero?.est_line1 || ""}
                                        onChange={(v) => patch("hero", { est_line1: v })}
                                        testid="editor-hero-est1" />
                                    <TextInput label="Top-left line 2"
                                        value={draft.hero?.est_line2 || ""}
                                        onChange={(v) => patch("hero", { est_line2: v })}
                                        testid="editor-hero-est2" />
                                </div>
                                <TextInput label="Vertical chapter label"
                                    value={draft.hero?.chapter_label || ""}
                                    onChange={(v) => patch("hero", { chapter_label: v })}
                                    testid="editor-hero-chapter" />
                                <TextInput label="Eyebrow"
                                    value={draft.hero?.eyebrow || ""}
                                    onChange={(v) => patch("hero", { eyebrow: v })}
                                    testid="editor-hero-eyebrow" />
                                <div className="grid grid-cols-2 gap-4">
                                    <TextInput label="Line 1"
                                        value={draft.hero?.line1 || ""}
                                        onChange={(v) => patch("hero", { line1: v })}
                                        testid="editor-hero-line1" />
                                    <TextInput label="Line 2 (gold italic)"
                                        value={draft.hero?.line2 || ""}
                                        onChange={(v) => patch("hero", { line2: v })}
                                        testid="editor-hero-line2" />
                                    <TextInput label="Line 3"
                                        value={draft.hero?.line3 || ""}
                                        onChange={(v) => patch("hero", { line3: v })}
                                        testid="editor-hero-line3" />
                                    <TextInput label="Line 4 (italic)"
                                        value={draft.hero?.line4 || ""}
                                        onChange={(v) => patch("hero", { line4: v })}
                                        testid="editor-hero-line4" />
                                </div>
                                <TextArea label="Subtitle"
                                    value={draft.hero?.subtitle || ""}
                                    onChange={(v) => patch("hero", { subtitle: v })}
                                    testid="editor-hero-subtitle" />
                                <div className="grid grid-cols-2 gap-4">
                                    <TextInput label="Primary button"
                                        value={draft.hero?.cta_primary || ""}
                                        onChange={(v) => patch("hero", { cta_primary: v })}
                                        testid="editor-hero-cta1" />
                                    <TextInput label="Secondary link"
                                        value={draft.hero?.cta_secondary || ""}
                                        onChange={(v) => patch("hero", { cta_secondary: v })}
                                        testid="editor-hero-cta2" />
                                    <TextInput label="Badge top"
                                        value={draft.hero?.badge_top || ""}
                                        onChange={(v) => patch("hero", { badge_top: v })}
                                        testid="editor-hero-badge-top" />
                                    <TextInput label="Badge bottom"
                                        value={draft.hero?.badge_bottom || ""}
                                        onChange={(v) => patch("hero", { badge_bottom: v })}
                                        testid="editor-hero-badge-bottom" />
                                    <TextInput label="Scroll hint"
                                        value={draft.hero?.scroll_label || ""}
                                        onChange={(v) => patch("hero", { scroll_label: v })}
                                        testid="editor-hero-scroll" />
                                </div>
                            </SectionCard>
                        )}

                        {active === "manifesto" && (
                            <SectionCard title="Manifesto" hint="Numbered chapters shown after the hero.">
                                <TextInput label="Eyebrow"
                                    value={draft.manifesto?.eyebrow || ""}
                                    onChange={(v) => patch("manifesto", { eyebrow: v })}
                                    testid="editor-manifesto-eyebrow" />
                                <TextInput label="Title line 1"
                                    value={draft.manifesto?.title_line1 || ""}
                                    onChange={(v) => patch("manifesto", { title_line1: v })}
                                    testid="editor-manifesto-title1" />
                                <TextInput label="Title line 2"
                                    value={draft.manifesto?.title_line2 || ""}
                                    onChange={(v) => patch("manifesto", { title_line2: v })}
                                    testid="editor-manifesto-title2" />
                                <TextInput label="Italic word"
                                    value={draft.manifesto?.title_italic || ""}
                                    onChange={(v) => patch("manifesto", { title_italic: v })}
                                    testid="editor-manifesto-italic" />
                                <TextArea label="Subtitle"
                                    value={draft.manifesto?.subtitle || ""}
                                    onChange={(v) => patch("manifesto", { subtitle: v })}
                                    testid="editor-manifesto-subtitle" />
                                <div className="mt-6 space-y-6">
                                    {(draft.manifesto?.chapters || []).map((c, i) => (
                                        <div key={i} className="border border-white/10 p-4">
                                            <div className="label text-gold">Chapter {c.n}</div>
                                            <TextInput label="Number label"
                                                value={c.n || ""}
                                                onChange={(v) => {
                                                    const arr = [...(draft.manifesto?.chapters || [])];
                                                    arr[i] = { ...arr[i], n: v };
                                                    patchNested("manifesto", "chapters", arr);
                                                }}
                                                testid={`editor-manifesto-n-${i}`} />
                                            <TextInput label="Title"
                                                value={c.title || ""}
                                                onChange={(v) => {
                                                    const arr = [...(draft.manifesto?.chapters || [])];
                                                    arr[i] = { ...arr[i], title: v };
                                                    patchNested("manifesto", "chapters", arr);
                                                }}
                                                testid={`editor-manifesto-title-${i}`} />
                                            <TextArea label="Body"
                                                value={c.body || ""}
                                                onChange={(v) => {
                                                    const arr = [...(draft.manifesto?.chapters || [])];
                                                    arr[i] = { ...arr[i], body: v };
                                                    patchNested("manifesto", "chapters", arr);
                                                }}
                                                testid={`editor-manifesto-body-${i}`} />
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {active === "founder" && (
                            <SectionCard title="Founder" hint="Founder story and plaque.">
                                <div className="grid grid-cols-3 gap-4">
                                    <TextInput label="Section eyebrow"
                                        value={draft.founder?.eyebrow || ""}
                                        onChange={(v) => patch("founder", { eyebrow: v })}
                                        testid="editor-founder-eyebrow" />
                                    <TextInput label="Plaque label"
                                        value={draft.founder?.plaque_label || ""}
                                        onChange={(v) => patch("founder", { plaque_label: v })}
                                        testid="editor-founder-plaque" />
                                    <TextInput label="Est. label"
                                        value={draft.founder?.est_label || ""}
                                        onChange={(v) => patch("founder", { est_label: v })}
                                        testid="editor-founder-est" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <TextInput label="Name"
                                        value={draft.founder?.name || ""}
                                        onChange={(v) => patch("founder", { name: v })}
                                        testid="editor-founder-name" />
                                    <TextInput label="Title / credentials"
                                        value={draft.founder?.title || ""}
                                        onChange={(v) => patch("founder", { title: v })}
                                        testid="editor-founder-title" />
                                </div>
                                <TextInput label="Subtitle"
                                    value={draft.founder?.subtitle || ""}
                                    onChange={(v) => patch("founder", { subtitle: v })}
                                    testid="editor-founder-subtitle" />
                                <div className="grid grid-cols-3 gap-4">
                                    <TextInput label="Heading line 1"
                                        value={draft.founder?.heading_line1 || ""}
                                        onChange={(v) => patch("founder", { heading_line1: v })}
                                        testid="editor-founder-h1" />
                                    <TextInput label="Heading line 2"
                                        value={draft.founder?.heading_line2 || ""}
                                        onChange={(v) => patch("founder", { heading_line2: v })}
                                        testid="editor-founder-h2" />
                                    <TextInput label="Italic word"
                                        value={draft.founder?.heading_italic || ""}
                                        onChange={(v) => patch("founder", { heading_italic: v })}
                                        testid="editor-founder-italic" />
                                </div>
                                <div className="mt-4 space-y-3">
                                    <div className="label text-white/60">Bio paragraphs</div>
                                    {(draft.founder?.bio || []).map((p, i) => (
                                        <div key={i} className="flex gap-2">
                                            <textarea
                                                className="field"
                                                rows={3}
                                                value={p}
                                                data-testid={`editor-founder-bio-${i}`}
                                                onChange={(e) => {
                                                    const arr = [...(draft.founder?.bio || [])];
                                                    arr[i] = e.target.value;
                                                    patchNested("founder", "bio", arr);
                                                }}
                                            />
                                            <button
                                                onClick={() => {
                                                    const arr = [...(draft.founder?.bio || [])];
                                                    arr.splice(i, 1);
                                                    patchNested("founder", "bio", arr);
                                                }}
                                                className="shrink-0 border border-white/15 px-3 text-white/60 hover:border-red-400 hover:text-red-400"
                                                aria-label="Remove"
                                                data-testid={`editor-founder-bio-remove-${i}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() =>
                                            patchNested("founder", "bio", [...(draft.founder?.bio || []), ""])
                                        }
                                        className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 label text-white/70 hover:border-gold hover:text-gold"
                                        data-testid="editor-founder-bio-add"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add paragraph
                                    </button>
                                </div>
                                <div className="mt-6 space-y-3">
                                    <div className="label text-white/60">Highlight stats</div>
                                    {(draft.founder?.stats || []).map((s, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input
                                                className="field"
                                                placeholder="Small label"
                                                value={s.k || ""}
                                                data-testid={`editor-founder-stat-k-${i}`}
                                                onChange={(e) => {
                                                    const arr = [...(draft.founder?.stats || [])];
                                                    arr[i] = { ...arr[i], k: e.target.value };
                                                    patchNested("founder", "stats", arr);
                                                }}
                                            />
                                            <input
                                                className="field"
                                                placeholder="Big italic value"
                                                value={s.v || ""}
                                                data-testid={`editor-founder-stat-v-${i}`}
                                                onChange={(e) => {
                                                    const arr = [...(draft.founder?.stats || [])];
                                                    arr[i] = { ...arr[i], v: e.target.value };
                                                    patchNested("founder", "stats", arr);
                                                }}
                                            />
                                            <button
                                                onClick={() => {
                                                    const arr = [...(draft.founder?.stats || [])];
                                                    arr.splice(i, 1);
                                                    patchNested("founder", "stats", arr);
                                                }}
                                                className="shrink-0 border border-white/15 px-3 text-white/60 hover:border-red-400 hover:text-red-400"
                                                aria-label="Remove stat"
                                                data-testid={`editor-founder-stat-remove-${i}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() =>
                                            patchNested("founder", "stats", [
                                                ...(draft.founder?.stats || []),
                                                { k: "", v: "" },
                                            ])
                                        }
                                        className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 label text-white/70 hover:border-gold hover:text-gold"
                                        data-testid="editor-founder-stat-add"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add stat
                                    </button>
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <TextInput label="Button label"
                                        value={draft.founder?.cta_label || ""}
                                        onChange={(v) => patch("founder", { cta_label: v })}
                                        testid="editor-founder-cta" />
                                    <TextInput label="Note beside button"
                                        value={draft.founder?.cta_note || ""}
                                        onChange={(v) => patch("founder", { cta_note: v })}
                                        testid="editor-founder-cta-note" />
                                </div>
                            </SectionCard>
                        )}

                        {active === "services" && (
                            <ServicesEditor draft={draft} setDraft={setDraft} />
                        )}

                        {active === "consultation" && (
                            <SectionCard title="Consultation" hint="Copy for the consultation form section.">
                                <TextInput label="Eyebrow"
                                    value={draft.consultation?.eyebrow || ""}
                                    onChange={(v) => patch("consultation", { eyebrow: v })}
                                    testid="editor-consult-eyebrow" />
                                <div className="grid grid-cols-3 gap-4">
                                    <TextInput label="Heading line 1"
                                        value={draft.consultation?.heading_line1 || ""}
                                        onChange={(v) => patch("consultation", { heading_line1: v })}
                                        testid="editor-consult-h1" />
                                    <TextInput label="Heading line 2"
                                        value={draft.consultation?.heading_line2 || ""}
                                        onChange={(v) => patch("consultation", { heading_line2: v })}
                                        testid="editor-consult-h2" />
                                    <TextInput label="Italic word"
                                        value={draft.consultation?.heading_italic || ""}
                                        onChange={(v) => patch("consultation", { heading_italic: v })}
                                        testid="editor-consult-italic" />
                                </div>
                                <TextArea label="Body"
                                    value={draft.consultation?.body || ""}
                                    onChange={(v) => patch("consultation", { body: v })}
                                    testid="editor-consult-body" />
                                <TextInput label="Tag line"
                                    value={draft.consultation?.tag || ""}
                                    onChange={(v) => patch("consultation", { tag: v })}
                                    testid="editor-consult-tag" />
                                <div className="grid grid-cols-3 gap-4">
                                    <TextInput label="Duration"
                                        value={draft.consultation?.duration || ""}
                                        onChange={(v) => patch("consultation", { duration: v })}
                                        testid="editor-consult-duration" />
                                    <TextInput label="Includes"
                                        value={draft.consultation?.includes || ""}
                                        onChange={(v) => patch("consultation", { includes: v })}
                                        testid="editor-consult-includes" />
                                    <TextInput label="Cost"
                                        value={draft.consultation?.cost || ""}
                                        onChange={(v) => patch("consultation", { cost: v })}
                                        testid="editor-consult-cost" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <TextInput label="Submit button"
                                        value={draft.consultation?.submit_label || ""}
                                        onChange={(v) => patch("consultation", { submit_label: v })}
                                        testid="editor-consult-submit" />
                                    <TextInput label="Reply note"
                                        value={draft.consultation?.reply_note || ""}
                                        onChange={(v) => patch("consultation", { reply_note: v })}
                                        testid="editor-consult-reply" />
                                </div>
                            </SectionCard>
                        )}

                        {active === "mission" && (
                            <SectionCard title="Mission statement" hint="Shown in the footer.">
                                <textarea
                                    className="field"
                                    rows={6}
                                    value={draft.mission || ""}
                                    onChange={(e) => setDraft({ ...draft, mission: e.target.value })}
                                    data-testid="editor-mission"
                                />
                            </SectionCard>
                        )}

                        {active === "contact" && (
                            <SectionCard title="Contact & hours" hint="Displayed in the footer + phone dial-out.">
                                <div className="grid grid-cols-2 gap-4">
                                    <TextInput label="Email"
                                        value={draft.contact?.email || ""}
                                        onChange={(v) => patch("contact", { email: v })}
                                        testid="editor-contact-email" />
                                    <TextInput label="Phone (dial number)"
                                        value={draft.contact?.phone || ""}
                                        onChange={(v) => patch("contact", { phone: v })}
                                        testid="editor-contact-phone" />
                                </div>
                                <TextInput label="Phone display"
                                    value={draft.contact?.phone_display || ""}
                                    onChange={(v) => patch("contact", { phone_display: v })}
                                    testid="editor-contact-phone-display" />
                                <TextInput label="Address line 1"
                                    value={draft.contact?.address_line_1 || ""}
                                    onChange={(v) => patch("contact", { address_line_1: v })}
                                    testid="editor-contact-addr1" />
                                <TextInput label="Address line 2"
                                    value={draft.contact?.address_line_2 || ""}
                                    onChange={(v) => patch("contact", { address_line_2: v })}
                                    testid="editor-contact-addr2" />
                                <div className="mt-4 space-y-3">
                                    <div className="label text-white/60">Hours</div>
                                    {(draft.contact?.hours || []).map((h, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input
                                                className="field"
                                                value={h}
                                                data-testid={`editor-contact-hours-${i}`}
                                                onChange={(e) => {
                                                    const arr = [...(draft.contact?.hours || [])];
                                                    arr[i] = e.target.value;
                                                    patchNested("contact", "hours", arr);
                                                }}
                                            />
                                            <button
                                                onClick={() => {
                                                    const arr = [...(draft.contact?.hours || [])];
                                                    arr.splice(i, 1);
                                                    patchNested("contact", "hours", arr);
                                                }}
                                                className="shrink-0 border border-white/15 px-3 text-white/60 hover:border-red-400 hover:text-red-400"
                                                aria-label="Remove hour"
                                                data-testid={`editor-contact-hours-remove-${i}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() =>
                                            patchNested("contact", "hours", [...(draft.contact?.hours || []), ""])
                                        }
                                        className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 label text-white/70 hover:border-gold hover:text-gold"
                                        data-testid="editor-contact-hours-add"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add hours line
                                    </button>
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <TextInput label="Instagram URL"
                                        value={draft.contact?.social?.instagram || ""}
                                        onChange={(v) => patch("contact", { social: { ...(draft.contact?.social || {}), instagram: v } })}
                                        testid="editor-contact-instagram" />
                                    <TextInput label="Facebook URL"
                                        value={draft.contact?.social?.facebook || ""}
                                        onChange={(v) => patch("contact", { social: { ...(draft.contact?.social || {}), facebook: v } })}
                                        testid="editor-contact-facebook" />
                                </div>
                            </SectionCard>
                        )}

                        {active === "legal" && (
                            <SectionCard title="Legal metadata" hint="Used in privacy, terms, cookies, accessibility pages and the footer copyright.">
                                <TextInput label="Business name"
                                    value={draft.legal?.business_name || ""}
                                    onChange={(v) => patch("legal", { business_name: v })}
                                    testid="editor-legal-biz" />
                                <TextInput label="Owner"
                                    value={draft.legal?.owner || ""}
                                    onChange={(v) => patch("legal", { owner: v })}
                                    testid="editor-legal-owner" />
                                <TextInput label="Jurisdiction"
                                    value={draft.legal?.jurisdiction || ""}
                                    onChange={(v) => patch("legal", { jurisdiction: v })}
                                    testid="editor-legal-jurisdiction" />
                                <TextInput label="Effective date"
                                    value={draft.legal?.effective_date || ""}
                                    onChange={(v) => patch("legal", { effective_date: v })}
                                    testid="editor-legal-date" />
                            </SectionCard>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Live preview toggle */}
                <div className="mt-10 border-t border-white/10 pt-6">
                    <button
                        onClick={() => setPreview((p) => !p)}
                        data-testid="editor-preview-toggle"
                        className="label link-underline text-white/60"
                    >
                        {preview ? "Hide live preview" : "Show live preview"}
                    </button>
                    {preview && (
                        <div className="mt-4 aspect-[16/10] w-full overflow-hidden border border-gold/25">
                            <iframe
                                src="/"
                                title="Live site preview"
                                className="h-full w-full bg-ink"
                                data-testid="editor-preview-iframe"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ----- Services editor (nested) -----
function ServicesEditor({ draft, setDraft }) {
    const cats = draft.services?.categories || [];

    function setCats(next) {
        setDraft({ ...draft, services: { ...(draft.services || {}), categories: next } });
    }

    return (
        <SectionCard title="Services & prices" hint="Reorder, rename, and reprice every treatment. Changes appear immediately on the live site.">
            <div className="grid grid-cols-2 gap-4">
                <input
                    className="field"
                    placeholder="Eyebrow"
                    value={draft.services?.eyebrow || ""}
                    onChange={(e) =>
                        setDraft({ ...draft, services: { ...(draft.services || {}), eyebrow: e.target.value } })
                    }
                    data-testid="editor-services-eyebrow"
                />
                <input
                    className="field"
                    placeholder="Heading line 1"
                    value={draft.services?.heading_line1 || ""}
                    onChange={(e) =>
                        setDraft({ ...draft, services: { ...(draft.services || {}), heading_line1: e.target.value } })
                    }
                    data-testid="editor-services-h1"
                />
                <input
                    className="field"
                    placeholder="Italic word"
                    value={draft.services?.heading_italic || ""}
                    onChange={(e) =>
                        setDraft({ ...draft, services: { ...(draft.services || {}), heading_italic: e.target.value } })
                    }
                    data-testid="editor-services-italic"
                />
                <input
                    className="field"
                    placeholder="Heading line 2"
                    value={draft.services?.heading_line2 || ""}
                    onChange={(e) =>
                        setDraft({ ...draft, services: { ...(draft.services || {}), heading_line2: e.target.value } })
                    }
                    data-testid="editor-services-h2"
                />
            </div>
            <TextArea
                label="Section subtitle"
                value={draft.services?.subtitle || ""}
                onChange={(v) =>
                    setDraft({ ...draft, services: { ...(draft.services || {}), subtitle: v } })
                }
                testid="editor-services-subtitle"
            />
            <TextArea
                label="Closing note under every category"
                value={draft.services?.footer_note || ""}
                onChange={(v) =>
                    setDraft({ ...draft, services: { ...(draft.services || {}), footer_note: v } })
                }
                testid="editor-services-footer-note"
            />
            <TextInput
                label="Note beside the Book button"
                value={draft.services?.cta_note || ""}
                onChange={(v) =>
                    setDraft({ ...draft, services: { ...(draft.services || {}), cta_note: v } })
                }
                testid="editor-services-cta-note"
            />

            <div className="mt-8 space-y-8">
                {cats.map((c, ci) => (
                    <div key={c.id || ci} className="border border-white/10 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="label text-gold">
                                    {c.number} — {c.label}
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-3">
                            <TextInput label="Number"
                                value={c.number || ""}
                                onChange={(v) => {
                                    const next = [...cats];
                                    next[ci] = { ...c, number: v };
                                    setCats(next);
                                }}
                                testid={`editor-cat-${ci}-number`}
                            />
                            <TextInput label="Label"
                                value={c.label || ""}
                                onChange={(v) => {
                                    const next = [...cats];
                                    next[ci] = { ...c, label: v };
                                    setCats(next);
                                }}
                                testid={`editor-cat-${ci}-label`}
                            />
                            <TextInput label="Blurb"
                                value={c.blurb || ""}
                                onChange={(v) => {
                                    const next = [...cats];
                                    next[ci] = { ...c, blurb: v };
                                    setCats(next);
                                }}
                                testid={`editor-cat-${ci}-blurb`}
                            />
                        </div>
                        <ImageInput
                            label="Category image"
                            value={c.image || ""}
                            onChange={(v) => {
                                const next = [...cats];
                                next[ci] = { ...c, image: v };
                                setCats(next);
                            }}
                            testid={`editor-cat-${ci}-image`}
                            aspect="4/5"
                        />
                        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                            {(c.items || []).map((it, ii) => (
                                <div key={ii} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-center">
                                    <input
                                        className="field"
                                        placeholder="Name"
                                        value={it.name || ""}
                                        data-testid={`editor-item-${ci}-${ii}-name`}
                                        onChange={(e) => {
                                            const next = [...cats];
                                            const items = [...(next[ci].items || [])];
                                            items[ii] = { ...it, name: e.target.value };
                                            next[ci] = { ...c, items };
                                            setCats(next);
                                        }}
                                    />
                                    <input
                                        className="field"
                                        placeholder="Price"
                                        value={it.price || ""}
                                        data-testid={`editor-item-${ci}-${ii}-price`}
                                        onChange={(e) => {
                                            const next = [...cats];
                                            const items = [...(next[ci].items || [])];
                                            items[ii] = { ...it, price: e.target.value };
                                            next[ci] = { ...c, items };
                                            setCats(next);
                                        }}
                                    />
                                    <input
                                        className="field"
                                        placeholder="Unit"
                                        value={it.unit || ""}
                                        data-testid={`editor-item-${ci}-${ii}-unit`}
                                        onChange={(e) => {
                                            const next = [...cats];
                                            const items = [...(next[ci].items || [])];
                                            items[ii] = { ...it, unit: e.target.value };
                                            next[ci] = { ...c, items };
                                            setCats(next);
                                        }}
                                    />
                                    <input
                                        className="field"
                                        placeholder="Note"
                                        value={it.note || ""}
                                        data-testid={`editor-item-${ci}-${ii}-note`}
                                        onChange={(e) => {
                                            const next = [...cats];
                                            const items = [...(next[ci].items || [])];
                                            items[ii] = { ...it, note: e.target.value };
                                            next[ci] = { ...c, items };
                                            setCats(next);
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const next = [...cats];
                                            const items = [...(next[ci].items || [])];
                                            items.splice(ii, 1);
                                            next[ci] = { ...c, items };
                                            setCats(next);
                                        }}
                                        aria-label="Remove item"
                                        data-testid={`editor-item-${ci}-${ii}-remove`}
                                        className="border border-white/15 px-3 py-1.5 text-white/60 hover:border-red-400 hover:text-red-400"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                    <textarea
                                        className="field col-span-full"
                                        rows={2}
                                        placeholder="Description"
                                        value={it.description || ""}
                                        data-testid={`editor-item-${ci}-${ii}-description`}
                                        onChange={(e) => {
                                            const next = [...cats];
                                            const items = [...(next[ci].items || [])];
                                            items[ii] = { ...it, description: e.target.value };
                                            next[ci] = { ...c, items };
                                            setCats(next);
                                        }}
                                    />
                                </div>
                            ))}
                            <button
                                onClick={() => {
                                    const next = [...cats];
                                    const items = [...(next[ci].items || []), { name: "New service", price: "", unit: "", note: "" }];
                                    next[ci] = { ...c, items };
                                    setCats(next);
                                }}
                                className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 label text-white/70 hover:border-gold hover:text-gold"
                                data-testid={`editor-cat-${ci}-add-item`}
                            >
                                <Plus className="h-3.5 w-3.5" /> Add service
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
}

// ----- Small UI helpers -----
function SectionCard({ title, hint, children }) {
    return (
        <div className="border border-white/10 p-6 sm:p-8">
            <h2 className="font-serif text-3xl italic text-white">{title}</h2>
            {hint && <div className="mt-2 text-sm text-white/50">{hint}</div>}
            <div className="mt-8 space-y-4">{children}</div>
        </div>
    );
}
function TextInput({ label, value, onChange, testid }) {
    return (
        <label className="block">
            <span className="label mb-2 block text-white/50">{label}</span>
            <input
                className="field"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                data-testid={testid}
            />
        </label>
    );
}
function TextArea({ label, value, onChange, testid }) {
    return (
        <label className="block">
            <span className="label mb-2 block text-white/50">{label}</span>
            <textarea
                className="field"
                rows={3}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                data-testid={testid}
            />
        </label>
    );
}
function VideoInput({ label, value, onChange, testid }) {
    const fileRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const backendOrigin = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
    const resolveUrl = (u) =>
        !u ? "" : u.startsWith("/api/") ? `${backendOrigin}${u}` : u;

    async function onFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("video/")) {
            toast.error("Please pick a video file.");
            return;
        }
        if (file.size > 40 * 1024 * 1024) {
            toast.error("Video too large. Maximum 40 MB.");
            return;
        }
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const token = localStorage.getItem("obw_token");
            const { data } = await axios.post(`${API}/uploads/video`, fd, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            onChange(data.url);
            toast.success("Video uploaded.");
        } catch (err) {
            const msg = err?.response?.data?.detail || "Upload failed.";
            toast.error(typeof msg === "string" ? msg : "Upload failed.");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    return (
        <div className="block" data-testid={`vidinput-${testid}`}>
            <div className="label mb-2 text-white/50">{label}</div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div
                    className="flex-shrink-0 overflow-hidden border border-gold/30 bg-white/5"
                    style={{ width: 128 }}
                    data-testid={`vidinput-${testid}-preview`}
                >
                    {value ? (
                        <video
                            src={resolveUrl(value)}
                            muted
                            loop
                            playsInline
                            autoPlay
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="grid h-20 w-full place-items-center text-white/30">
                            <Film className="h-6 w-6" strokeWidth={1.4} />
                        </div>
                    )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            data-testid={`vidinput-${testid}-upload`}
                            className="inline-flex items-center gap-2 border border-gold bg-gold px-4 py-2 label text-ink transition-transform hover:translate-y-[-1px] disabled:opacity-50"
                        >
                            <Upload className="h-3.5 w-3.5" />
                            {uploading ? "Uploading…" : value ? "Replace video" : "Upload video"}
                        </button>
                        {value && (
                            <button
                                type="button"
                                onClick={() => onChange("")}
                                data-testid={`vidinput-${testid}-clear`}
                                className="inline-flex items-center gap-2 border border-white/20 px-4 py-2 label text-white/70 hover:border-white/40 hover:text-white"
                            >
                                <X className="h-3.5 w-3.5" /> Remove
                            </button>
                        )}
                        <input
                            ref={fileRef}
                            type="file"
                            accept="video/*"
                            onChange={onFile}
                            data-testid={`vidinput-${testid}-file`}
                            className="hidden"
                        />
                    </div>
                    <div className="label text-white/40">MP4, WebM or MOV · max 40 MB</div>
                    <input
                        className="field"
                        placeholder="Or paste a video URL…"
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        data-testid={`vidinput-${testid}-url`}
                    />
                </div>
            </div>
        </div>
    );
}

function ImageInput({ label, value, onChange, testid, aspect = "3/4" }) {
    const fileRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const backendOrigin =
        (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");

    // Convert internal /api/uploads/... paths to fully-qualified URLs so the
    // image preview loads through Kubernetes ingress correctly.
    const resolveUrl = (u) => {
        if (!u) return "";
        if (u.startsWith("http") || u.startsWith("data:")) return u;
        if (u.startsWith("/api/")) return `${backendOrigin}${u}`;
        return u;
    };

    async function onFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please pick an image file.");
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            toast.error("Image too large. Maximum 8 MB.");
            return;
        }
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const token = localStorage.getItem("obw_token");
            const { data } = await axios.post(`${API}/uploads/image`, fd, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            onChange(data.url);
            toast.success("Image uploaded.");
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.message || "Upload failed.";
            toast.error(typeof msg === "string" ? msg : "Upload failed.");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    return (
        <div className="block" data-testid={`imginput-${testid}`}>
            <div className="label mb-2 text-white/50">{label}</div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                {/* Single preview (or empty state) */}
                <div
                    className="flex-shrink-0 border border-gold/30 bg-white/5"
                    style={{ width: 128, aspectRatio: aspect }}
                    data-testid={`imginput-${testid}-preview`}
                >
                    {value ? (
                        <img
                            src={resolveUrl(value)}
                            alt="preview"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="grid h-full w-full place-items-center text-white/30">
                            <ImageIcon className="h-6 w-6" strokeWidth={1.4} />
                        </div>
                    )}
                </div>

                <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            data-testid={`imginput-${testid}-upload`}
                            className="inline-flex items-center gap-2 border border-gold bg-gold px-4 py-2 label text-ink transition-transform hover:translate-y-[-1px] disabled:opacity-50"
                        >
                            <Upload className="h-3.5 w-3.5" />
                            {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
                        </button>
                        {value && (
                            <button
                                type="button"
                                onClick={() => onChange("")}
                                data-testid={`imginput-${testid}-clear`}
                                className="inline-flex items-center gap-2 border border-white/20 px-4 py-2 label text-white/70 hover:border-white/40 hover:text-white"
                            >
                                <X className="h-3.5 w-3.5" />
                                Remove
                            </button>
                        )}
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            onChange={onFile}
                            data-testid={`imginput-${testid}-file`}
                            className="hidden"
                        />
                    </div>
                    <div className="label text-white/40">
                        JPEG, PNG, WEBP, GIF or SVG · max 8 MB
                    </div>
                    <input
                        className="field"
                        placeholder="Or paste an image URL…"
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        data-testid={`imginput-${testid}-url`}
                    />
                </div>
            </div>
        </div>
    );
}

function Toggle({ label, value, onChange, testid }) {
    return (
        <div className="flex items-center justify-between gap-4 py-2">
            <div className="label text-white/70">{label}</div>
            <button
                type="button"
                role="switch"
                aria-checked={value}
                onClick={() => onChange(!value)}
                data-testid={testid}
                className={`h-6 w-11 border transition-colors ${
                    value ? "border-gold bg-gold" : "border-white/20 bg-transparent"
                }`}
            >
                <span
                    className={`block h-5 w-5 transition-transform ${
                        value ? "translate-x-5 bg-ink" : "translate-x-0.5 bg-white/60"
                    }`}
                />
            </button>
        </div>
    );
}

// Compute a nested diff so we only persist overrides (shared with the live editor).
