import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Search, Trash2, Users, ChevronDown, Download } from "lucide-react";
import { useAuth } from "../lib/auth";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const RSVP_STATUSES = ["going", "maybe", "cancelled"];

const pill = {
    going: "border-gold/60 text-gold",
    maybe: "border-white/30 text-white/70",
    cancelled: "border-red-400/40 text-red-300",
};

export default function RsvpPanel({ authHeader }) {
    const { user, ready } = useAuth();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState("all");

    async function load() {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/rsvps`, { headers: authHeader() });
            setRows(data);
        } catch {
            toast.error("Failed to load RSVPs.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!ready || !user) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, user]);

    const counts = useMemo(() => {
        const c = { all: rows.length };
        for (const s of RSVP_STATUSES) c[s] = rows.filter((r) => r.status === s).length;
        return c;
    }, [rows]);

    const attendees = useMemo(
        () =>
            rows
                .filter((r) => r.status === "going")
                .reduce((n, r) => n + (Number(r.guests) || 1), 0),
        [rows],
    );

    const filtered = useMemo(
        () =>
            rows.filter((r) => {
                if (filter !== "all" && r.status !== filter) return false;
                if (!q) return true;
                return `${r.name} ${r.email} ${r.phone || ""} ${r.event || ""}`
                    .toLowerCase()
                    .includes(q.toLowerCase());
            }),
        [rows, q, filter],
    );

    async function setStatus(id, status) {
        try {
            await axios.patch(
                `${API}/rsvps/${id}/status`,
                { status },
                { headers: authHeader() },
            );
            setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
            toast.success("RSVP updated");
        } catch {
            toast.error("Failed to update RSVP");
        }
    }

    async function remove(id) {
        if (!window.confirm("Delete this RSVP?")) return;
        try {
            await axios.delete(`${API}/rsvps/${id}`, { headers: authHeader() });
            setRows((r) => r.filter((x) => x.id !== id));
            toast.success("RSVP deleted");
        } catch {
            toast.error("Failed to delete RSVP");
        }
    }

    function exportCsv() {
        const head = ["Name", "Email", "Phone", "Guests", "Event", "Status", "Date"];
        const lines = [head.join(",")].concat(
            filtered.map((r) =>
                [
                    r.name,
                    r.email,
                    r.phone || "",
                    r.guests,
                    r.event || "",
                    r.status,
                    r.created_at,
                ]
                    .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                    .join(","),
            ),
        );
        const blob = new Blob([lines.join("\n")], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "rsvps.csv";
        a.click();
        URL.revokeObjectURL(a.href);
    }

    return (
        <>
            <div className="label text-gold">Event guest list</div>
            <h1 className="mt-3 font-serif text-4xl italic sm:text-5xl">RSVPs</h1>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <Stat label="All" value={counts.all} active={filter === "all"} onClick={() => setFilter("all")} testid="rsvp-stat-all" />
                {RSVP_STATUSES.map((s) => (
                    <Stat
                        key={s}
                        label={s}
                        value={counts[s]}
                        active={filter === s}
                        onClick={() => setFilter(s)}
                        testid={`rsvp-stat-${s}`}
                    />
                ))}
                <div className="border border-gold/40 bg-gold/[0.06] p-5" data-testid="rsvp-attendees">
                    <div className="label flex items-center gap-2 text-white/50">
                        <Users className="h-3.5 w-3.5" /> Heads coming
                    </div>
                    <div className="mt-2 font-serif text-3xl italic text-gold">
                        {attendees}
                    </div>
                </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-white/10 py-4">
                <button
                    onClick={exportCsv}
                    data-testid="rsvp-export"
                    className="inline-flex items-center gap-2 border border-white/15 px-3 py-1.5 label text-white/70 hover:border-gold hover:text-gold"
                >
                    <Download className="h-3.5 w-3.5" /> Export CSV
                </button>
                <div className="ml-auto flex items-center gap-2 border border-white/15 px-3 py-1.5">
                    <Search className="h-3.5 w-3.5 text-white/50" />
                    <input
                        className="w-56 bg-transparent text-sm outline-none placeholder:text-white/30"
                        placeholder="Search name, email, event…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        data-testid="rsvp-search"
                    />
                </div>
            </div>

            {loading ? (
                <div className="mt-10 border border-white/10 p-10 text-center label text-white/50">
                    Loading…
                </div>
            ) : filtered.length === 0 ? (
                <div className="mt-10 border border-white/10 p-10 text-center label text-white/50">
                    No RSVPs yet.
                </div>
            ) : (
                <div className="mt-10 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="text-left text-white/40">
                                {["Guest", "Contact", "Guests", "Event", "RSVP'd", "Status", ""].map(
                                    (h) => (
                                        <th
                                            key={h}
                                            className="label border-b border-white/10 py-4 pr-6 font-medium"
                                        >
                                            {h}
                                        </th>
                                    ),
                                )}
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
                                    data-testid={`rsvp-row-${r.id}`}
                                >
                                    <td className="py-5 pr-6 font-serif text-lg italic text-white">
                                        {r.name}
                                    </td>
                                    <td className="py-5 pr-6">
                                        <a
                                            href={`mailto:${r.email}`}
                                            className="link-underline text-gold"
                                        >
                                            {r.email}
                                        </a>
                                        <div className="mt-1 text-xs text-white/50">
                                            {r.phone || "—"}
                                        </div>
                                    </td>
                                    <td className="py-5 pr-6 text-white/80">{r.guests}</td>
                                    <td className="py-5 pr-6 text-white/70">
                                        {r.event || "—"}
                                    </td>
                                    <td className="py-5 pr-6 text-white/50">
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="py-5 pr-6">
                                        <div className="relative inline-flex">
                                            <select
                                                value={r.status}
                                                onChange={(e) => setStatus(r.id, e.target.value)}
                                                data-testid={`rsvp-status-${r.id}`}
                                                className={`appearance-none border bg-transparent px-3 py-1.5 pr-8 label ${pill[r.status]}`}
                                            >
                                                {RSVP_STATUSES.map((s) => (
                                                    <option
                                                        key={s}
                                                        value={s}
                                                        className="bg-ink text-white"
                                                    >
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-current" />
                                        </div>
                                    </td>
                                    <td className="py-5 pr-6">
                                        <button
                                            onClick={() => remove(r.id)}
                                            aria-label="Delete RSVP"
                                            data-testid={`rsvp-delete-${r.id}`}
                                            className="border border-white/15 p-2 text-white/50 hover:border-red-400 hover:text-red-400"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
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

function Stat({ label, value, active, onClick, testid }) {
    return (
        <button
            onClick={onClick}
            data-testid={testid}
            data-active={active}
            className={`border p-5 text-left transition-colors ${
                active ? "border-gold/60 bg-gold/[0.06]" : "border-white/10 hover:border-white/25"
            }`}
        >
            <div className="label text-white/50">{label}</div>
            <div className="mt-2 font-serif text-3xl italic text-gold">{value}</div>
        </button>
    );
}
