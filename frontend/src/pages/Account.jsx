import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { API } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useContent } from "../lib/contentContext";
import { useSeo } from "../lib/seo";
import { LogOut, Calendar, ArrowRight } from "lucide-react";

const statusColor = {
    new: "text-gold border-gold/50",
    contacted: "text-white/80 border-white/30",
    scheduled: "text-gold border-gold/50",
    completed: "text-white/60 border-white/20",
    cancelled: "text-white/40 border-white/15",
};

export default function Account() {
    useSeo({
        title: "My Account — Overall Beauty & Wellness",
        description: "Your appointments.",
        path: "/account",
        noindex: true,
    });
    const { user, signout, authHeader } = useAuth();
    const { content } = useContent();
    const LOGO_URL = content.brand?.logo_url;
    const nav = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await axios.get(`${API}/consultations/mine`, {
                    headers: authHeader(),
                });
                setRows(data);
            } catch (e) {
                toast.error("Failed to load your appointments.");
            } finally {
                setLoading(false);
            }
        })();
    }, [authHeader]);

    return (
        <div className="grain min-h-screen bg-ink text-white" data-testid="account-page">
            <PortalHeader
                onSignOut={() => {
                    signout();
                    nav("/");
                }}
            />

            <main className="mx-auto max-w-6xl px-4 py-14 sm:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <div className="label text-gold">My account</div>
                    <h1 className="mt-3 font-serif text-4xl italic sm:text-5xl">
                        Welcome, {user?.first_name}.
                    </h1>
                    <p className="mt-3 max-w-xl text-white/60">
                        Your consultations, appointments, and personalized
                        treatment plans — all in one place.
                    </p>
                </motion.div>

                <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <SummaryCard label="Total requests" value={rows.length} />
                    <SummaryCard
                        label="Upcoming"
                        value={
                            rows.filter((r) =>
                                ["new", "scheduled"].includes(r.status),
                            ).length
                        }
                    />
                    <SummaryCard
                        label="Completed"
                        value={
                            rows.filter((r) => r.status === "completed").length
                        }
                    />
                </div>

                <section className="mt-14">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <div className="label text-gold">Appointments</div>
                            <div className="mt-2 font-serif text-2xl italic">
                                Your consultation history
                            </div>
                        </div>
                        <Link
                            to="/book"
                            data-testid="account-book-more"
                            className="hidden items-center gap-3 border border-gold px-5 py-3 label text-gold transition-colors hover:bg-gold hover:text-ink sm:inline-flex"
                        >
                            Book new
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="border border-white/10 p-10 text-center label text-white/50">
                            Loading…
                        </div>
                    ) : rows.length === 0 ? (
                        <div
                            className="border border-white/10 p-12 text-center"
                            data-testid="account-empty"
                        >
                            <Calendar className="mx-auto h-6 w-6 text-gold" />
                            <div className="mt-4 font-serif text-2xl italic">
                                No consultations yet.
                            </div>
                            <div className="mt-2 text-white/60">
                                Book your complimentary consultation with
                                Crystal.
                            </div>
                            <Link
                                to="/book"
                                data-testid="account-book-first"
                                className="mt-8 inline-flex items-center gap-3 border border-gold bg-gold px-6 py-3 label text-ink hover:translate-y-[-2px] transition-transform"
                            >
                                Book consultation
                            </Link>
                        </div>
                    ) : (
                        <ul className="divide-y divide-white/10 border-y border-white/10">
                            {rows.map((r, i) => (
                                <motion.li
                                    key={r.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-[1fr_auto_auto]"
                                    data-testid={`account-row-${r.id}`}
                                >
                                    <div>
                                        <div className="font-serif text-xl italic">
                                            {r.service_interest ||
                                                "Complimentary consultation"}
                                        </div>
                                        <div className="mt-1 text-sm text-white/50">
                                            {r.preferred_date || "—"}
                                            {r.preferred_time
                                                ? ` · ${r.preferred_time}`
                                                : ""}
                                        </div>
                                    </div>
                                    <div
                                        className={`self-start border px-3 py-1 label ${statusColor[r.status] || statusColor.new}`}
                                    >
                                        {r.status}
                                    </div>
                                    <div className="text-right text-sm text-white/40">
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </div>
                                </motion.li>
                            ))}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    );
}

function SummaryCard({ label, value }) {
    return (
        <div className="border border-white/10 p-8 transition-colors hover:border-gold/40">
            <div className="label text-white/50">{label}</div>
            <div className="mt-3 font-serif text-5xl italic text-gold">
                {value}
            </div>
        </div>
    );
}

function PortalHeader({ onSignOut }) {
    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
                <Link
                    to="/"
                    className="flex items-center gap-3"
                    data-testid="portal-back-home"
                >
                    <img
                        src={LOGO_URL}
                        alt="Overall Beauty & Wellness"
                        className="h-14 w-auto object-contain"
                    />
                </Link>
                <button
                    onClick={onSignOut}
                    data-testid="portal-signout"
                    className="inline-flex items-center gap-2 border border-white/15 px-4 py-2 label text-white/70 transition-colors hover:border-gold hover:text-gold"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                </button>
            </div>
        </header>
    );
}
