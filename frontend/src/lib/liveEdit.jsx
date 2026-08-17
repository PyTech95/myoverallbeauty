import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Pencil, Save, X } from "lucide-react";
import { useAuth } from "./auth";
import { useContent } from "./contentContext";
import { DEFAULT_CONTENT, computeDiff, setPath } from "./defaultContent";

const SEL = "[data-edit]";

// Tiny store so other components (e.g. the FAQ page) can show add/remove
// controls while the live editor is active.
let editingState = false;
const listeners = new Set();
function setEditingState(v) {
    editingState = v;
    listeners.forEach((fn) => fn(v));
}
export function useLiveEditing() {
    const [v, setV] = useState(editingState);
    useEffect(() => {
        listeners.add(setV);
        setV(editingState);
        return () => listeners.delete(setV);
    }, []);
    return v;
}

export default function LiveEditToolbar() {
    const { user } = useAuth();
    const { content, saveOverrides } = useContent();
    const loc = useLocation();
    const [editing, setEditing] = useState(false);
    const [count, setCount] = useState(0);
    const [saving, setSaving] = useState(false);
    const changes = useRef({});
    const originals = useRef(new Map());

    const isStaff = user?.role === "staff";
    const hidden = loc.pathname.startsWith("/studio");

    useEffect(() => {
        setEditingState(editing);
    }, [editing]);

    const arm = useCallback((el) => {
        if (el.dataset.leArmed === "1") return;
        el.dataset.leArmed = "1";
        originals.current.set(el, el.innerText);
        el.setAttribute("contenteditable", "plaintext-only");
        el.setAttribute("spellcheck", "false");
        el.classList.add("le-editable");
    }, []);

    const disarm = useCallback((restore) => {
        document.querySelectorAll('[data-le-armed="1"]').forEach((el) => {
            if (restore && originals.current.has(el)) {
                el.innerText = originals.current.get(el);
            }
            el.removeAttribute("contenteditable");
            el.removeAttribute("data-le-armed");
            el.classList.remove("le-editable");
        });
        originals.current = new Map();
        changes.current = {};
        setCount(0);
    }, []);

    // Arm existing + future editable nodes while editing
    useEffect(() => {
        if (!editing) return;
        document.querySelectorAll(SEL).forEach(arm);
        const obs = new MutationObserver(() => {
            document.querySelectorAll(SEL).forEach(arm);
        });
        obs.observe(document.body, { childList: true, subtree: true });

        const onInput = (e) => {
            const el = e.target.closest?.(SEL);
            if (!el) return;
            changes.current[el.dataset.edit] = el.innerText.trim();
            setCount(Object.keys(changes.current).length);
        };
        const onKey = (e) => {
            if (e.key === "Enter" && e.target.closest?.(SEL)) e.preventDefault();
        };
        document.addEventListener("input", onInput, true);
        document.addEventListener("keydown", onKey, true);
        return () => {
            obs.disconnect();
            document.removeEventListener("input", onInput, true);
            document.removeEventListener("keydown", onKey, true);
        };
    }, [editing, arm]);

    // Leaving edit mode via route change
    useEffect(() => {
        if (editing) {
            setEditing(false);
            disarm(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loc.pathname]);

    async function save() {
        const paths = Object.keys(changes.current);
        if (!paths.length) {
            setEditing(false);
            disarm(false);
            return;
        }
        setSaving(true);
        try {
            let next = content;
            for (const p of paths) next = setPath(next, p, changes.current[p]);
            await saveOverrides(computeDiff(DEFAULT_CONTENT, next) || {});
            toast.success(
                `${paths.length} ${paths.length === 1 ? "edit" : "edits"} published.`,
            );
            setEditing(false);
            disarm(false);
        } catch (e) {
            toast.error("Could not save. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    if (!isStaff || hidden) return null;

    return (
        <div
            className="fixed bottom-24 right-4 z-[80] flex flex-col items-end gap-2 lg:bottom-6 lg:right-6"
            data-testid="live-edit-toolbar"
        >
            {editing && (
                <div className="max-w-[220px] border border-gold/40 bg-black/90 px-3 py-2 text-[11px] leading-relaxed text-white/70 backdrop-blur-xl">
                    Click any highlighted text on the page and type to change it.
                    {count > 0 && (
                        <span className="mt-1 block text-gold">
                            {count} unsaved {count === 1 ? "change" : "changes"}
                        </span>
                    )}
                </div>
            )}
            <div className="flex items-center gap-2">
                {editing ? (
                    <>
                        <button
                            onClick={() => {
                                setEditing(false);
                                disarm(true);
                            }}
                            data-testid="live-edit-cancel"
                            className="inline-flex items-center gap-2 border border-white/25 bg-black/90 px-4 py-3 text-[10px] tracking-[0.24em] uppercase text-white/70 backdrop-blur-xl transition-colors hover:border-white/60 hover:text-white"
                        >
                            <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                        <button
                            onClick={save}
                            disabled={saving}
                            data-testid="live-edit-save"
                            className="inline-flex items-center gap-2 border border-gold bg-gold px-5 py-3 text-[10px] tracking-[0.24em] uppercase font-medium text-ink transition-transform hover:translate-y-[-1px] disabled:opacity-50"
                        >
                            <Save className="h-3.5 w-3.5" />
                            {saving ? "Publishing…" : "Publish"}
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setEditing(true)}
                        data-testid="live-edit-start"
                        className="inline-flex items-center gap-2 border border-gold/60 bg-black/90 px-5 py-3 text-[10px] tracking-[0.24em] uppercase text-gold backdrop-blur-xl transition-colors hover:bg-gold hover:text-ink"
                    >
                        <Pencil className="h-3.5 w-3.5" /> Edit this page
                    </button>
                )}
            </div>
        </div>
    );
}
