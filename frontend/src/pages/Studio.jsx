import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { API } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useContent } from "../lib/contentContext";
import { useSeo } from "../lib/seo";
import { LogOut, Search, ChevronDown, LayoutDashboard, Wand2 } from "lucide-react";
import StudioEditor from "./StudioEditor";

const STATUSES = ["new", "contacted", "scheduled", "completed", "cancelled"];
const statusPill = {
    new: "text-gold border-gold/50",
    contacted: "text-white/80 border-white/30",
    scheduled: "text-gold border-gold/50",
    completed: "text-white/50 border-white/20",
    cancelled: "text-white/40 border-white/15",
};

export default function Studio() {
    useSeo({
        title: "Studio — Overall Beauty & Wellness",
        description: "Staff panel.",
        path: "/studio",
        noindex: true,
    });
    const { user, signout, authHeader } = useAuth();
    const { content } = useContent();
    const LOGO_URL = content.brand?.logo_url;
    const nav = useNavigate();
    const [sp, setSp] = useSearchParams();
    const tab = sp.get("tab") === "editor" ? "editor" : "bookings";

    return (
        <div className="grain min-h-screen bg-ink text-white" data-testid="studio-page">
            <header className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur-xl">
                <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-8">
                    <div className="flex items-center gap-4">
                        <Link to="/" data-testid="studio-back-home">
                            <img src={LOGO_URL} alt="" className="h-14 w-auto object-contain" />
                        </Link>
                        <div className="hidden border-l border-white/10 pl-4 sm:block">
                            <div className="label text-gold">Studio</div>
                            <div className="text-xs text-white/60">
                                Signed in as {user?.first_name} {user?.last_name}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={() => setSp({ tab: "bookings" })}
                            data-testid="studio-tab-bookings"
                            data-active={tab === "bookings"}
                            className={`inline-flex items-center gap-2 border px-3 py-2 label transition-colors sm:px-4 ${
                                tab === "bookings"
                                    ? "border-gold text-gold"
                                    : "border-white/15 text-white/60 hover:border-white/40 hover:text-white"
                            }`}
                        >
                            <LayoutDashboard className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Bookings</span>
                        </button>
                        <button
                            onClick={() => setSp({ tab: "editor" })}
                            data-testid="studio-tab-editor"
                            data-active={tab === "editor"}
                            className={`inline-flex items-center gap-2 border px-3 py-2 label transition-colors sm:px-4 ${
                                tab === "editor"
                                    ? "border-gold text-gold"
                                    : "border-white/15 text-white/60 hover:border-white/40 hover:text-white"
                            }`}
                        >
                            <Wand2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Editor</span>
                        </button>
                        <button
                            onClick={() => {
                                signout();
                                nav("/");
                            }}
                            data-testid="studio-signout"
                            className="inline-flex items-center gap-2 border border-white/15 px-3 py-2 label text-white/70 hover:border-gold hover:text-gold sm:px-4"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Sign out</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8 sm:py-14">
                <AnimatePresence mode="wait">
                    {tab === "bookings" ? (
                        <motion.div
                            key="bookings"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.35 }}
                        >
                            <BookingsPanel authHeader={authHeader} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="editor"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.35 }}
                        >
                            <StudioEditor />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

function BookingsPanel({ authHeader }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState("all");

    async function load() {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/consultations`, {
                headers: authHeader(),
            });
            setRows(data);
        } catch {
            toast.error("Failed to load consultations.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(() => {
        return rows.filter((r) => {
            if (filter !== "all" && r.status !== filter) return false;
            if (!q) return true;
            const s = `${r.first_name} ${r.last_name} ${r.email} ${r.phone} ${r.service_interest || ""}`.toLowerCase();
            return s.includes(q.toLowerCase());
        });
    }, [rows, q, filter]);

    async function updateStatus(id, status) {
        try {
            await axios.patch(
                `${API}/consultations/${id}/status`,
                { status },
                { headers: authHeader() },
            );
            setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
            toast.success("Status updated");
        } catch {
            toast.error("Failed to update status");
        }
    }

    const counts = useMemo(() => {
        const c = { all: rows.length };
        for (const s of STATUSES)
            c[s] = rows.filter((r) => r.status === s).length;
        return c;
    }, [rows]);

    return (
        <>
            <div className="label text-gold">Booking studio</div>
            <h1 className="mt-3 font-serif text-4xl italic sm:text-5xl">Consultations</h1>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="All" value={counts.all} active={filter === "all"} onClick={() => setFilter("all")} testid="studio-stat-all" />
                {STATUSES.map((s) => (
                    <StatCard key={s} label={s} value={counts[s]} active={filter === s} onClick={() => setFilter(s)} testid={`studio-stat-${s}`} />
                ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-white/10 py-4">
                <button
                    onClick={() => setFilter("all")}
                    data-active={filter === "all"}
                    data-testid="studio-filter-all"
                    className={`link-underline label ${filter === "all" ? "text-gold" : "text-white/60 hover:text-white"}`}
                >
                    All · {counts.all}
                </button>
                {STATUSES.map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        data-active={filter === s}
                        data-testid={`studio-filter-${s}`}
                        className={`link-underline label ${filter === s ? "text-gold" : "text-white/60 hover:text-white"}`}
                    >
                        {s} · {counts[s]}
                    </button>
                ))}
                <div className="ml-auto flex items-center gap-2 border border-white/15 px-3 py-1.5">
                    <Search className="h-3.5 w-3.5 text-white/50" />
                    <input
                        className="w-56 bg-transparent text-sm outline-none placeholder:text-white/30"
                        placeholder="Search name, email, service…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        data-testid="studio-search"
                    />
                </div>
            </div>

            {loading ? (
                <div className="mt-10 border border-white/10 p-10 text-center label text-white/50">Loading…</div>
            ) : filtered.length === 0 ? (
                <div className="mt-10 border border-white/10 p-10 text-center label text-white/50">
                    No consultations match your filters.
                </div>
            ) : (
                <div className="mt-10 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="text-left text-white/40">
                                {["Client", "Contact", "Service", "Preferred", "Requested", "Status"].map((h) => (
                                    <th key={h} className="label border-b border-white/10 py-4 pr-6 font-medium">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r, i) => (
                                <motion.tr
                                    key={r.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.02 }}
                                    className="border-b border-white/5 hover:bg-white/[0.03]"
                                    data-testid={`studio-row-${r.id}`}
                                >
                                    <td className="py-5 pr-6">
                                        <div className="font-serif text-lg italic text-white">
                                            {r.first_name} {r.last_name}
                                        </div>
                                        {r.message && (
                                            <div className="mt-1 max-w-xs truncate text-xs text-white/40">{r.message}</div>
                                        )}
                                    </td>
                                    <td className="py-5 pr-6">
                                        <a href={`mailto:${r.email}`} className="link-underline text-gold">{r.email}</a>
                                        <div className="mt-1 text-xs text-white/50">{r.phone}</div>
                                    </td>
                                    <td className="py-5 pr-6 text-white/80">{r.service_interest || "—"}</td>
                                    <td className="py-5 pr-6 text-white/70">
                                        {r.preferred_date || "—"}
                                        {r.preferred_time ? ` · ${r.preferred_time}` : ""}
                                    </td>
                                    <td className="py-5 pr-6 text-white/50">
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="py-5 pr-6">
                                        <div className="relative inline-flex">
                                            <select
                                                value={r.status}
                                                onChange={(e) => updateStatus(r.id, e.target.value)}
                                                data-testid={`studio-status-${r.id}`}
                                                className={`appearance-none border bg-transparent px-3 py-1.5 pr-8 label ${statusPill[r.status]}`}
                                            >
                                                {STATUSES.map((s) => (
                                                    <option key={s} value={s} className="bg-ink text-white">
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-current" />
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

function StatCard({ label, value, active, onClick, testid }) {
    return (
        <button
            onClick={onClick}
            data-testid={testid}
            data-active={active}
            className={`border p-5 text-left transition-colors ${
                active
                    ? "border-gold/60 bg-gold/[0.06]"
                    : "border-white/10 hover:border-white/25"
            }`}
        >
            <div className="label text-white/50">{label}</div>
            <div className="mt-2 font-serif text-3xl italic text-gold">{value}</div>
        </button>
    );
}
