import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { submitConsultation } from "../../lib/api";
import { useContent } from "../../lib/contentContext";

const TIMES = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
];

export default function Consultation() {
    const { content } = useContent();
    const C = content.consultation;
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        service_interest: "",
        preferred_date: "",
        preferred_time: "",
        message: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    async function onSubmit(e) {
        e.preventDefault();
        if (
            !form.first_name ||
            !form.last_name ||
            !form.email ||
            !form.phone
        ) {
            toast.error("Please complete the required fields.");
            return;
        }
        setSubmitting(true);
        try {
            await submitConsultation(form);
            setDone(true);
            toast.success("Consultation request received.");
        } catch (err) {
            toast.error(
                err?.response?.data?.detail?.[0]?.msg ||
                    "Something went wrong. Please try again.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    const today = new Date().toISOString().slice(0, 10);

    return (
        <section
            id="consultation"
            className="relative overflow-hidden bg-ink py-20 sm:py-24 lg:py-40"
            data-testid="consultation-section"
        >
            <div className="pointer-events-none absolute -left-40 top-1/3 h-[500px] w-[500px] rounded-full bg-gold/[.06] blur-[140px]" />
            <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
                <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9 }}
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <div className="label mb-6 flex items-center gap-3 text-gold">
                            <span className="h-px w-10 bg-gold/60" />
                            <span data-edit="consultation.eyebrow">{C.eyebrow}</span>
                        </div>
                        <h2 className="font-serif text-4xl leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
                            <span data-edit="consultation.heading_line1">
                                {C.heading_line1}
                            </span>{" "}
                            <br />
                            <span data-edit="consultation.heading_line2">
                                {C.heading_line2}
                            </span>{" "}
                            <em
                                className="italic text-gold-gradient animate-shimmer"
                                data-edit="consultation.heading_italic"
                            >
                                {C.heading_italic}
                            </em>
                        </h2>
                        <div className="mt-8 space-y-5 text-white/70">
                            <p data-edit="consultation.body">{C.body}</p>
                            <p
                                className="font-serif text-xl italic text-gold sm:text-2xl"
                                data-edit="consultation.tag"
                            >
                                {C.tag}
                            </p>
                        </div>
                        <div className="mt-12 space-y-4 border-t border-white/10 pt-8">
                            {[
                                { k: "Duration", v: C.duration, path: "consultation.duration" },
                                {
                                    k: "With",
                                    v: content.founder.name + ", " + content.founder.title,
                                },
                                { k: "Includes", v: C.includes, path: "consultation.includes" },
                                { k: "Cost", v: C.cost, path: "consultation.cost" },
                            ].map((s) => (
                                <div
                                    key={s.k}
                                    className="grid grid-cols-[110px_1fr] items-baseline gap-3 sm:grid-cols-[120px_1fr] sm:gap-4"
                                >
                                    <div className="label text-white/40">
                                        {s.k}
                                    </div>
                                    <div
                                        className="font-serif text-lg italic text-white sm:text-xl"
                                        data-edit={s.path}
                                    >
                                        {s.v}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="relative"
                    >
                        <div className="pointer-events-none absolute -top-8 right-0 font-serif text-8xl italic text-gold/10 select-none">
                            &ldquo;
                        </div>
                        {done ? (
                            <div className="border border-gold/40 p-8 sm:p-10 lg:p-14">
                                <div className="label text-gold">
                                    Request received
                                </div>
                                <h3 className="mt-4 font-serif text-3xl italic text-white sm:text-4xl">
                                    Thank you, {form.first_name}.
                                </h3>
                                <p className="mt-4 text-white/70">
                                    Crystal will personally reach out to
                                    confirm your consultation. A confirmation
                                    has been sent to <b>{form.email}</b>.
                                </p>
                                <button
                                    onClick={() => {
                                        setDone(false);
                                        setForm({
                                            first_name: "",
                                            last_name: "",
                                            email: "",
                                            phone: "",
                                            service_interest: "",
                                            preferred_date: "",
                                            preferred_time: "",
                                            message: "",
                                        });
                                    }}
                                    data-testid="consultation-reset"
                                    className="mt-8 label text-gold link-underline"
                                >
                                    Submit another
                                </button>
                            </div>
                        ) : (
                            <form
                                onSubmit={onSubmit}
                                data-testid="consultation-form"
                                className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2"
                            >
                                <Field label="First name*" testid="c-first-name">
                                    <input
                                        className="field"
                                        required
                                        value={form.first_name}
                                        onChange={set("first_name")}
                                        data-testid="c-input-first-name"
                                    />
                                </Field>
                                <Field label="Last name*" testid="c-last-name">
                                    <input
                                        className="field"
                                        required
                                        value={form.last_name}
                                        onChange={set("last_name")}
                                        data-testid="c-input-last-name"
                                    />
                                </Field>
                                <Field label="Email*" testid="c-email">
                                    <input
                                        type="email"
                                        className="field"
                                        required
                                        value={form.email}
                                        onChange={set("email")}
                                        data-testid="c-input-email"
                                    />
                                </Field>
                                <Field label="Phone*" testid="c-phone">
                                    <input
                                        type="tel"
                                        className="field"
                                        required
                                        value={form.phone}
                                        onChange={set("phone")}
                                        data-testid="c-input-phone"
                                    />
                                </Field>
                                <Field
                                    label="Service interest"
                                    testid="c-service"
                                    full
                                >
                                    <select
                                        className="field appearance-none [color-scheme:dark]"
                                        value={form.service_interest}
                                        onChange={set("service_interest")}
                                        data-testid="c-input-service"
                                    >
                                        <option value="">
                                            Select a service…
                                        </option>
                                        {content.services.categories.flatMap((cat) =>
                                            cat.items.map((it) => (
                                                <option
                                                    key={`${cat.id}-${it.name}`}
                                                    value={`${cat.label} — ${it.name}`}
                                                >
                                                    {`${cat.label} — ${it.name}`}
                                                </option>
                                            )),
                                        )}
                                    </select>
                                </Field>
                                <Field label="Preferred date" testid="c-date">
                                    <input
                                        type="date"
                                        min={today}
                                        className="field [color-scheme:dark]"
                                        value={form.preferred_date}
                                        onChange={set("preferred_date")}
                                        data-testid="c-input-date"
                                    />
                                </Field>
                                <Field label="Preferred time" testid="c-time">
                                    <select
                                        className="field appearance-none [color-scheme:dark]"
                                        value={form.preferred_time}
                                        onChange={set("preferred_time")}
                                        data-testid="c-input-time"
                                    >
                                        <option value="">Select time…</option>
                                        {TIMES.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field
                                    label="Anything we should know?"
                                    testid="c-message"
                                    full
                                >
                                    <textarea
                                        className="field"
                                        rows={4}
                                        value={form.message}
                                        onChange={set("message")}
                                        data-testid="c-input-message"
                                    />
                                </Field>

                                <div className="col-span-full mt-6 flex flex-wrap items-center gap-6">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        data-testid="c-submit"
                                        className="group relative inline-flex items-center gap-4 border border-gold bg-gold px-6 py-3.5 text-[11px] tracking-[0.24em] uppercase font-medium text-ink transition-transform duration-500 hover:translate-y-[-2px] disabled:opacity-60 sm:px-8 sm:py-4"
                                    >
                                        {submitting ? "Sending…" : C.submit_label}
                                        <span className="h-px w-8 bg-ink transition-all duration-500 group-hover:w-12" />
                                    </button>
                                    <div className="label text-white/40">
                                        {C.reply_note}
                                    </div>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

function Field({ label, children, full = false, testid = "" }) {
    return (
        <label
            className={`block ${full ? "sm:col-span-2" : ""} pt-6`}
            data-testid={`field-${testid}`}
        >
            <span className="label mb-2 block text-white/45">{label}</span>
            {children}
        </label>
    );
}
