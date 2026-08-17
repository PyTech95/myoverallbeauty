import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth, formatApiErrorDetail } from "../lib/auth";
import AuthShell from "../lib/AuthShell";

export default function SignIn() {
    const { login } = useAuth();
    const nav = useNavigate();
    const loc = useLocation();
    const from = loc.state?.from || null;
    const [form, setForm] = useState({ email: "", password: "" });
    const [busy, setBusy] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setBusy(true);
        try {
            const u = await login(form.email, form.password);
            toast.success(`Welcome back, ${u.first_name}.`);
            const dest =
                from || (u.role === "staff" ? "/studio" : "/account");
            nav(dest, { replace: true });
        } catch (err) {
            toast.error(formatApiErrorDetail(err?.response?.data?.detail));
        } finally {
            setBusy(false);
        }
    }

    return (
        <AuthShell
            title="Sign in to your account"
            subtitle="Welcome back"
            footer={
                <div className="text-sm text-white/60">
                    New here?{" "}
                    <Link
                        to="/signup"
                        data-testid="signin-to-signup"
                        className="link-underline text-gold"
                    >
                        Create an account
                    </Link>
                </div>
            }
        >
            <form
                onSubmit={onSubmit}
                className="space-y-6"
                data-testid="signin-form"
            >
                <label className="block">
                    <span className="label mb-2 block text-white/50">
                        Email
                    </span>
                    <input
                        type="email"
                        required
                        className="field"
                        value={form.email}
                        onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                        }
                        data-testid="signin-email"
                    />
                </label>
                <label className="block">
                    <span className="label mb-2 block text-white/50">
                        Password
                    </span>
                    <input
                        type="password"
                        required
                        className="field"
                        value={form.password}
                        onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                        }
                        data-testid="signin-password"
                    />
                </label>
                <button
                    type="submit"
                    disabled={busy}
                    data-testid="signin-submit"
                    className="group relative inline-flex w-full items-center justify-center gap-4 border border-gold bg-gold px-6 py-4 text-[11px] tracking-[0.24em] uppercase font-medium text-ink transition-transform duration-500 hover:translate-y-[-2px] disabled:opacity-60"
                >
                    {busy ? "Signing in…" : "Sign in"}
                </button>
            </form>
        </AuthShell>
    );
}
