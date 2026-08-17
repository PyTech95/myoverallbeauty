import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import {
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    Calendar,
    Clock,
    User,
    Check,
    Sparkles,
} from "lucide-react";
import { API } from "../../lib/api";
import { submitConsultation } from "../../lib/api";
import { useContent } from "../../lib/contentContext";
import EvaAssistant from "../EvaAssistant";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function toISODate(d) {
    // local time YYYY-MM-DD
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const dd = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

function buildMonthGrid(year, month) {
    // Monday-first month grid, always 6 weeks × 7 days.
    const first = new Date(year, month, 1);
    // JS: Sun=0..Sat=6 → shift so Mon=0
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - offset);
    const days = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
    }
    return days;
}

export default function Booking() {
    const { content } = useContent();
    const C = content.consultation;

    const today = useMemo(() => {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return t;
    }, []);

    const [cfg, setCfg] = useState(null);
    const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(null);
    const [slots, setSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedTime, setSelectedTime] = useState(null);
    const [step, setStep] = useState(1);
    const [evaOpen, setEvaOpen] = useState(false);
    const [evaOffered, setEvaOffered] = useState(false);
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        service_interest: "",
        message: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        axios
            .get(`${API}/schedule/config`)
            .then((r) => setCfg(r.data))
            .catch(() => setCfg(null));
    }, []);

    // Fetch availability when date changes
    useEffect(() => {
        if (!selectedDate) return;
        setSlotsLoading(true);
        setSelectedTime(null);
        axios
            .get(`${API}/schedule/availability`, {
                params: { date: toISODate(selectedDate) },
            })
            .then((r) => {
                const avail = r.data.available || [];
                setSlots(avail);
                // Offer Eva once, on first successful date+slots load
                if (avail.length > 0 && !evaOffered) {
                    setEvaOffered(true);
                    // small delay lets the slot list render first
                    setTimeout(() => setEvaOpen(true), 350);
                }
            })
            .catch(() => setSlots([]))
            .finally(() => setSlotsLoading(false));
    }, [selectedDate]);

    const days = useMemo(
        () => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()),
        [cursor],
    );

    const isDateBookable = (d) => {
        if (!cfg) return false;
        if (d < today) return false;
        const maxDate = new Date(today);
        maxDate.setDate(today.getDate() + (cfg.advance_days || 60));
        if (d > maxDate) return false;
        // JS weekday: Sun=0..Sat=6 → convert to Mon=0..Sun=6
        const wd = (d.getDay() + 6) % 7;
        if (!(cfg.working_days || []).includes(wd)) return false;
        if ((cfg.blackout_dates || []).includes(toISODate(d))) return false;
        return true;
    };

    async function onConfirm() {
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
            await submitConsultation({
                ...form,
                preferred_date: toISODate(selectedDate),
                preferred_time: selectedTime,
            });
            setDone(true);
            toast.success("Appointment booked.");
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                "Something went wrong. Please try again.";
            toast.error(typeof msg === "string" ? msg : "Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    function resetAll() {
        setDone(false);
        setStep(1);
        setSelectedDate(null);
        setSelectedTime(null);
        setForm({
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            service_interest: "",
            message: "",
        });
    }

    return (
        <section
            id="consultation"
            className="relative overflow-hidden bg-ink py-20 sm:py-24 lg:py-32"
            data-testid="booking-section"
        >
            <div className="pointer-events-none absolute -left-40 top-1/3 h-[500px] w-[500px] rounded-full bg-gold/[.06] blur-[140px]" />
            <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="max-w-3xl"
                >
                    <div className="label mb-6 flex items-center gap-3 text-gold">
                        <span className="h-px w-10 bg-gold/60" />
                        {C.eyebrow}
                    </div>
                    <h2 className="font-serif text-4xl leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
                        Book your{" "}
                        <em className="italic text-gold-gradient animate-shimmer">
                            complimentary
                        </em>{" "}
                        consultation.
                    </h2>
                    <p className="mt-6 max-w-xl text-white/70">{C.body}</p>
                    <div className="mt-3 font-serif text-xl italic text-gold sm:text-2xl">
                        {C.tag}
                    </div>
                </motion.div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="relative mt-12 border border-white/10 bg-white/[0.02] backdrop-blur-sm lg:mt-16"
                    data-testid="booking-card"
                >
                    {/* Stepper */}
                    <div className="grid grid-cols-3 border-b border-white/10">
                        {[
                            { n: 1, icon: Calendar, label: "Date & time" },
                            { n: 2, icon: User, label: "Your details" },
                            { n: 3, icon: Check, label: "Confirmation" },
                        ].map((s) => (
                            <div
                                key={s.n}
                                data-active={step === s.n}
                                data-testid={`booking-step-${s.n}`}
                                className={`flex items-center justify-center gap-3 border-r border-white/10 py-4 label transition-colors last:border-r-0 ${
                                    step === s.n
                                        ? "text-gold"
                                        : step > s.n
                                          ? "text-white/70"
                                          : "text-white/30"
                                }`}
                            >
                                <span
                                    className={`grid h-6 w-6 place-items-center border text-[10px] ${
                                        step === s.n
                                            ? "border-gold bg-gold text-ink"
                                            : step > s.n
                                              ? "border-gold text-gold"
                                              : "border-white/30 text-white/40"
                                    }`}
                                >
                                    {step > s.n ? (
                                        <Check className="h-3 w-3" />
                                    ) : (
                                        s.n
                                    )}
                                </span>
                                <span className="hidden sm:inline">
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && !done && (
                            <motion.div
                                key="step-1"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.35 }}
                                className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr]"
                            >
                                {/* Calendar */}
                                <div
                                    className="border-b border-white/10 p-6 sm:p-10 lg:border-b-0 lg:border-r"
                                    style={{ perspective: "1400px" }}
                                    data-testid="cal-container"
                                >
                                    <div className="mx-auto max-w-md">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="label text-gold">
                                                Select a date
                                            </div>
                                            <div className="mt-2 font-serif text-2xl italic text-white sm:text-3xl">
                                                {MONTHS[cursor.getMonth()]}{" "}
                                                {cursor.getFullYear()}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() =>
                                                    setCursor(
                                                        new Date(
                                                            cursor.getFullYear(),
                                                            cursor.getMonth() - 1,
                                                            1,
                                                        ),
                                                    )
                                                }
                                                disabled={
                                                    cursor.getFullYear() ===
                                                        today.getFullYear() &&
                                                    cursor.getMonth() <=
                                                        today.getMonth()
                                                }
                                                data-testid="cal-prev"
                                                className="grid h-10 w-10 place-items-center border border-white/15 text-white/60 transition-colors hover:border-gold hover:text-gold disabled:opacity-30 disabled:hover:border-white/15"
                                                aria-label="Previous month"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setCursor(
                                                        new Date(
                                                            cursor.getFullYear(),
                                                            cursor.getMonth() + 1,
                                                            1,
                                                        ),
                                                    )
                                                }
                                                data-testid="cal-next"
                                                className="grid h-10 w-10 place-items-center border border-white/15 text-white/60 transition-colors hover:border-gold hover:text-gold"
                                                aria-label="Next month"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <motion.div
                                        initial={{ rotateX: 12, rotateY: -6, opacity: 0.2 }}
                                        animate={{ rotateX: 0, rotateY: 0, opacity: 1 }}
                                        transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                                        style={{ transformStyle: "preserve-3d" }}
                                        className="mt-8"
                                        data-testid="cal-3d"
                                    >
                                    <div className="grid grid-cols-7 gap-1 label text-white/60">
                                        {DOW.map((d) => (
                                            <div key={d} className="py-2 text-center">
                                                {d}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-1 grid grid-cols-7 gap-1.5">
                                        {days.map((d, i) => {
                                            const inMonth =
                                                d.getMonth() === cursor.getMonth();
                                            const bookable =
                                                inMonth && isDateBookable(d);
                                            const isToday =
                                                toISODate(d) === toISODate(today);
                                            const isSelected =
                                                selectedDate &&
                                                toISODate(d) ===
                                                    toISODate(selectedDate);
                                            return (
                                                <motion.button
                                                    key={i}
                                                    disabled={!bookable}
                                                    onClick={() =>
                                                        bookable &&
                                                        setSelectedDate(d)
                                                    }
                                                    whileHover={
                                                        bookable && !isSelected
                                                            ? {
                                                                  y: -3,
                                                                  rotateX: -8,
                                                                  scale: 1.04,
                                                              }
                                                            : undefined
                                                    }
                                                    whileTap={
                                                        bookable
                                                            ? { scale: 0.96 }
                                                            : undefined
                                                    }
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 300,
                                                        damping: 22,
                                                    }}
                                                    style={{
                                                        transformStyle: "preserve-3d",
                                                    }}
                                                    data-testid={`cal-day-${toISODate(d)}`}
                                                    data-active={isSelected}
                                                    className={`relative aspect-square border text-sm font-medium transition-colors duration-300 sm:text-base ${
                                                        isSelected
                                                            ? "border-gold bg-gold text-ink shadow-[0_14px_28px_-12px_rgba(212,175,55,0.75)]"
                                                            : bookable
                                                              ? "border-white/20 bg-white/[0.04] text-white hover:border-gold hover:bg-gold/15 hover:text-gold shadow-[0_6px_14px_-12px_rgba(0,0,0,0.9)]"
                                                              : inMonth
                                                                ? "border-white/5 bg-white/[0.02] text-white/25"
                                                                : "border-transparent text-white/15"
                                                    }`}
                                                >
                                                    <span
                                                        className={`absolute inset-0 grid place-items-center font-serif italic ${
                                                            isSelected ? "text-ink" : ""
                                                        }`}
                                                    >
                                                        {d.getDate()}
                                                    </span>
                                                    {isToday && !isSelected && (
                                                        <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold" />
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                    </motion.div>

                                    <div className="mt-6 flex flex-wrap gap-4 text-xs text-white/50">
                                        <LegendDot color="border-gold bg-gold" text="Selected" />
                                        <LegendDot color="border-gold/60 bg-transparent" text="Available" />
                                        <LegendDot color="border-transparent bg-white/5" text="Unavailable" />
                                    </div>
                                    </div>
                                </div>

                                {/* Times */}
                                <div className="p-6 sm:p-10">
                                    <div className="label text-gold">
                                        Available times
                                    </div>
                                    <div className="mt-2 font-serif text-2xl italic text-white sm:text-3xl">
                                        {selectedDate
                                            ? selectedDate.toLocaleDateString(
                                                  undefined,
                                                  {
                                                      weekday: "long",
                                                      month: "long",
                                                      day: "numeric",
                                                  },
                                              )
                                            : "Pick a date"}
                                    </div>

                                    <div className="mt-8">
                                        {!selectedDate ? (
                                            <div className="border border-white/10 p-8 text-center label text-white/40">
                                                Select a date on the calendar
                                            </div>
                                        ) : slotsLoading ? (
                                            <div className="label text-white/40">
                                                Loading times…
                                            </div>
                                        ) : slots.length === 0 ? (
                                            <div className="border border-white/10 p-8 text-center label text-white/50">
                                                No available times on this day
                                            </div>
                                        ) : (
                                            <div
                                                className="grid grid-cols-2 gap-2 sm:grid-cols-2"
                                                data-testid="slots-container"
                                            >
                                                {slots.map((t) => (
                                                    <button
                                                        key={t}
                                                        onClick={() =>
                                                            setSelectedTime(t)
                                                        }
                                                        data-testid={`slot-${t.replace(/[: ]/g, "")}`}
                                                        data-active={
                                                            selectedTime === t
                                                        }
                                                        className={`group flex items-center justify-between border px-4 py-3 label transition-all duration-300 ${
                                                            selectedTime === t
                                                                ? "border-gold bg-gold text-ink"
                                                                : "border-white/15 text-white/80 hover:border-gold hover:text-gold"
                                                        }`}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {t}
                                                        </span>
                                                        {selectedTime === t && (
                                                            <Check className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-10 flex flex-wrap items-center gap-4">
                                        <button
                                            disabled={
                                                !selectedDate || !selectedTime
                                            }
                                            onClick={() => setStep(2)}
                                            data-testid="booking-next-1"
                                            className="group inline-flex items-center gap-3 border border-gold bg-gold px-6 py-3.5 text-[10px] tracking-[0.24em] uppercase font-medium text-ink transition-transform hover:translate-y-[-1px] disabled:opacity-40 sm:px-7 sm:py-4"
                                        >
                                            Continue
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </button>
                                        {selectedTime && (
                                            <div className="label text-white/50">
                                                {selectedDate?.toLocaleDateString(
                                                    undefined,
                                                    { month: "short", day: "numeric" },
                                                )}{" "}
                                                · {selectedTime}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && !done && (
                            <motion.div
                                key="step-2"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.35 }}
                                className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr]"
                            >
                                {/* Summary */}
                                <aside className="border-b border-white/10 bg-white/[0.02] p-6 sm:p-10 lg:border-b-0 lg:border-r">
                                    <div className="label text-gold">Summary</div>
                                    <div className="mt-2 font-serif text-2xl italic text-white sm:text-3xl">
                                        Complimentary consultation
                                    </div>
                                    <ul className="mt-8 space-y-4 text-white/80">
                                        <li className="flex items-start gap-3">
                                            <Calendar className="mt-0.5 h-4 w-4 text-gold" />
                                            <div>
                                                <div className="label text-white/40">
                                                    Date
                                                </div>
                                                <div className="font-serif text-lg italic">
                                                    {selectedDate?.toLocaleDateString(
                                                        undefined,
                                                        {
                                                            weekday: "long",
                                                            month: "long",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <Clock className="mt-0.5 h-4 w-4 text-gold" />
                                            <div>
                                                <div className="label text-white/40">
                                                    Time
                                                </div>
                                                <div className="font-serif text-lg italic">
                                                    {selectedTime} ·{" "}
                                                    {cfg?.slot_duration_min ||
                                                        45}{" "}
                                                    min
                                                </div>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <User className="mt-0.5 h-4 w-4 text-gold" />
                                            <div>
                                                <div className="label text-white/40">
                                                    With
                                                </div>
                                                <div className="font-serif text-lg italic">
                                                    {content.founder.name}
                                                </div>
                                                <div className="label text-white/40">
                                                    {content.founder.title}
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                    <button
                                        onClick={() => setStep(1)}
                                        data-testid="booking-back-1"
                                        className="mt-8 label link-underline text-white/60 hover:text-white"
                                    >
                                        ← Change date & time
                                    </button>
                                </aside>

                                <div className="p-6 sm:p-10">
                                    <div className="label text-gold">
                                        Your details
                                    </div>
                                    <div className="mt-2 font-serif text-2xl italic text-white sm:text-3xl">
                                        Let's get to know you.
                                    </div>

                                    <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                                        <FormField label="First name*" testid="c-first-name">
                                            <input
                                                className="field"
                                                required
                                                value={form.first_name}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        first_name: e.target.value,
                                                    })
                                                }
                                                data-testid="c-input-first-name"
                                            />
                                        </FormField>
                                        <FormField label="Last name*" testid="c-last-name">
                                            <input
                                                className="field"
                                                required
                                                value={form.last_name}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        last_name: e.target.value,
                                                    })
                                                }
                                                data-testid="c-input-last-name"
                                            />
                                        </FormField>
                                        <FormField label="Email*" testid="c-email">
                                            <input
                                                type="email"
                                                className="field"
                                                required
                                                value={form.email}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        email: e.target.value,
                                                    })
                                                }
                                                data-testid="c-input-email"
                                            />
                                        </FormField>
                                        <FormField label="Phone*" testid="c-phone">
                                            <input
                                                type="tel"
                                                className="field"
                                                required
                                                value={form.phone}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        phone: e.target.value,
                                                    })
                                                }
                                                data-testid="c-input-phone"
                                            />
                                        </FormField>
                                        <FormField
                                            label="Service interest"
                                            testid="c-service"
                                            full
                                        >
                                            <select
                                                className="field appearance-none [color-scheme:dark]"
                                                value={form.service_interest}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        service_interest:
                                                            e.target.value,
                                                    })
                                                }
                                                data-testid="c-input-service"
                                            >
                                                <option value="">
                                                    Select a service…
                                                </option>
                                                {content.services.categories.flatMap(
                                                    (cat) =>
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
                                        </FormField>
                                        <FormField
                                            label="Anything we should know?"
                                            testid="c-message"
                                            full
                                        >
                                            <textarea
                                                className="field"
                                                rows={3}
                                                value={form.message}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        message: e.target.value,
                                                    })
                                                }
                                                data-testid="c-input-message"
                                            />
                                        </FormField>
                                    </div>

                                    <div className="mt-8 flex flex-wrap items-center gap-4">
                                        <button
                                            onClick={onConfirm}
                                            disabled={submitting}
                                            data-testid="c-submit"
                                            className="group inline-flex items-center gap-3 border border-gold bg-gold px-6 py-3.5 text-[10px] tracking-[0.24em] uppercase font-medium text-ink transition-transform hover:translate-y-[-1px] disabled:opacity-40 sm:px-7 sm:py-4"
                                        >
                                            {submitting ? "Booking…" : "Confirm booking"}
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </button>
                                        <div className="label text-white/40">
                                            No credit card required
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {done && (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="p-8 text-center sm:p-16"
                                data-testid="booking-confirmation"
                            >
                                <div className="mx-auto grid h-16 w-16 place-items-center border border-gold text-gold">
                                    <Check className="h-8 w-8" />
                                </div>
                                <div className="label mt-6 text-gold">
                                    Confirmed
                                </div>
                                <h3 className="mt-3 font-serif text-4xl italic text-white sm:text-5xl">
                                    You're on the calendar, {form.first_name}.
                                </h3>
                                <p className="mx-auto mt-4 max-w-lg text-white/70">
                                    Your complimentary consultation is booked
                                    for{" "}
                                    <b>
                                        {selectedDate?.toLocaleDateString(
                                            undefined,
                                            {
                                                weekday: "long",
                                                month: "long",
                                                day: "numeric",
                                            },
                                        )}
                                    </b>{" "}
                                    at <b>{selectedTime}</b>. A confirmation
                                    has been sent to <b>{form.email}</b>.
                                </p>
                                <button
                                    onClick={resetAll}
                                    data-testid="booking-reset"
                                    className="mt-10 label link-underline text-gold"
                                >
                                    Book another
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Persistent "Talk to Eva" trigger */}
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8">
                    <div className="flex items-center gap-3 text-sm text-white/60">
                        <Sparkles className="h-4 w-4 text-gold" />
                        Prefer to book by voice? Eva — our AI assistant — can walk you through it.
                    </div>
                    <button
                        onClick={() => {
                            if (!selectedDate) {
                                toast.error("Please pick a date first so Eva knows when to book.");
                                return;
                            }
                            setEvaOpen(true);
                        }}
                        data-testid="booking-open-eva"
                        className="group inline-flex items-center gap-3 border border-gold px-5 py-3 label text-gold transition-colors hover:bg-gold hover:text-ink"
                    >
                        Talk to Eva
                        <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
                    </button>
                </div>
            </div>

            <EvaAssistant
                open={evaOpen}
                onClose={() => setEvaOpen(false)}
                selectedDate={selectedDate}
                slots={slots}
                onBooked={() => {
                    setDone(true);
                }}
            />
        </section>
    );
}

function FormField({ label, testid, full = false, children }) {
    return (
        <label
            className={`block ${full ? "sm:col-span-2" : ""} pt-4`}
            data-testid={`field-${testid}`}
        >
            <span className="label mb-2 block text-white/45">{label}</span>
            {children}
        </label>
    );
}

function LegendDot({ color, text }) {
    return (
        <div className="flex items-center gap-2">
            <span className={`inline-block h-3 w-3 border ${color}`} />
            {text}
        </div>
    );
}
