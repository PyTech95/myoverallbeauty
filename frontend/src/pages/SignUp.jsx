import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth, formatApiErrorDetail } from "../lib/auth";
import AuthShell from "../lib/AuthShell";

export default function SignUp() {
    const { register } = useAuth();
    const nav = useNavigate();
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
    });
    const [busy, setBusy] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        if (form.password.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        setBusy(true);
        try {
            const u = await register(form);
            toast.success(`Welcome, ${u.first_name}.`);
            nav("/account", { replace: true });
        } catch (err) {
            toast.error(formatApiErrorDetail(err?.response?.data?.detail));
        } finally {
            setBusy(false);
        }
    }

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    return (
        <AuthShell
            title="Create your account"
            subtitle="Join Overall Beauty & Wellness"
            footer={
                <div className="text-sm text-white/60">
                    Already have an account?{" "}
                    <Link
                        to="/signin"
                        data-testid="signup-to-signin"
                        className="link-underline text-gold"
                    >
                        Sign in
                    </Link>
                </div>
            }
        >
            <form
                onSubmit={onSubmit}
                className="grid grid-cols-2 gap-x-6 gap-y-2"
                data-testid="signup-form"
            >
                <label className="block">
                    <span className="label mb-2 block text-white/50">
                        First name
                    </span>
                    <input
                        required
                        className="field"
                        value={form.first_name}
                        onChange={set("first_name")}
                        data-testid="signup-first-name"
                    />
                </label>
                <label className="block">
                    <span className="label mb-2 block text-white/50">
                        Last name
                    </span>
                    <input
                        required
                        className="field"
                        value={form.last_name}
                        onChange={set("last_name")}
                        data-testid="signup-last-name"
                    />
                </label>
                <label className="col-span-2 block pt-4">
                    <span className="label mb-2 block text-white/50">
                        Email
                    </span>
                    <input
                        type="email"
                        required
                        className="field"
                        value={form.email}
                        onChange={set("email")}
                        data-testid="signup-email"
                    />
                </label>
                <label className="col-span-2 block pt-4">
                    <span className="label mb-2 block text-white/50">
                        Phone (optional)
                    </span>
                    <input
                        type="tel"
                        className="field"
                        value={form.phone}
                        onChange={set("phone")}
                        data-testid="signup-phone"
                    />
                </label>
                <label className="col-span-2 block pt-4">
                    <span className="label mb-2 block text-white/50">
                        Password (min 6)
                    </span>
                    <input
                        type="password"
                        required
                        minLength={6}
                        className="field"
                        value={form.password}
                        onChange={set("password")}
                        data-testid="signup-password"
                    />
                </label>
                <button
                    type="submit"
                    disabled={busy}
                    data-testid="signup-submit"
                    className="col-span-2 mt-8 inline-flex w-full items-center justify-center border border-gold bg-gold px-6 py-4 text-[11px] tracking-[0.24em] uppercase font-medium text-ink transition-transform duration-500 hover:translate-y-[-2px] disabled:opacity-60"
                >
                    {busy ? "Creating…" : "Create account"}
                </button>
            </form>
        </AuthShell>
    );
}
