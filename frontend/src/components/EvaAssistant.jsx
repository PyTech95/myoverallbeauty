import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Volume2, VolumeX, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useVoice } from "../lib/useVoice";
import {
    classifyYesNo,
    matchTimeSlot,
    parseEmail,
    parsePhone,
    parseName,
} from "../lib/voiceParsers";
import { useContent } from "../lib/contentContext";
import { submitConsultation } from "../lib/api";

const STEP = {
    INTRO: "intro",
    PICK_TIME: "pick_time",
    ASK_NAME: "ask_name",
    ASK_EMAIL: "ask_email",
    ASK_PHONE: "ask_phone",
    ASK_SERVICE: "ask_service",
    CONFIRM: "confirm",
    BOOKING: "booking",
    DONE: "done",
};

function formatDate(d) {
    return d?.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
    });
}

export default function EvaAssistant({
    open,
    onClose,
    selectedDate,
    slots,
    onBooked,
}) {
    const { content } = useContent();
    const {
        supported,
        listening,
        speaking,
        speak,
        stopSpeaking,
        listen,
        stopListening,
    } = useVoice();

    const [step, setStep] = useState(STEP.INTRO);
    const [messages, setMessages] = useState([]);
    const [muted, setMuted] = useState(false);
    const [typing, setTyping] = useState("");
    const [caption, setCaption] = useState("");
    const [collected, setCollected] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        service_interest: "",
        preferred_time: "",
    });
    const scrollRef = useRef(null);
    const startedRef = useRef(false);

    // Reset when opened
    useEffect(() => {
        if (!open) {
            stopSpeaking();
            stopListening();
            setStep(STEP.INTRO);
            setMessages([]);
            setCollected({
                first_name: "",
                last_name: "",
                email: "",
                phone: "",
                service_interest: "",
                preferred_time: "",
            });
            startedRef.current = false;
            return;
        }
        // Auto-scroll
    }, [open, stopSpeaking, stopListening]);

    // Kick off intro (needs user gesture — the click that opened Eva counts as one)
    useEffect(() => {
        if (!open || startedRef.current) return;
        startedRef.current = true;
        const dateStr = formatDate(selectedDate);
        const intro =
            `Hi, I'm Eva, your booking assistant. I see you're looking at ${dateStr}. ` +
            `Would you like me to book it for you, or would you rather book yourself?`;
        addAssistant(intro);
        setTimeout(() => sayAndListen(intro, handleIntroReply), 400);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    function addAssistant(text) {
        setMessages((m) => [...m, { who: "eva", text }]);
    }
    function addUser(text) {
        setMessages((m) => [...m, { who: "user", text }]);
    }

    async function sayAndListen(text, onReply) {
        setCaption(text);
        if (!muted && supported.speak) await speak(text);
        setCaption("");
        if (supported.listen) {
            const heard = await listen();
            if (heard && heard.trim()) {
                addUser(heard);
                onReply?.(heard);
            }
        }
    }

    async function say(text) {
        setCaption(text);
        if (!muted && supported.speak) await speak(text);
        setCaption("");
    }

    // === Turn handlers ===
    function handleIntroReply(text) {
        const cls = classifyYesNo(text);
        if (cls === "no") {
            const bye =
                "No problem — I'll close and let you book yourself. See you soon.";
            addAssistant(bye);
            say(bye);
            setTimeout(onClose, 1800);
            return;
        }
        // Yes or unknown → proceed
        setStep(STEP.PICK_TIME);
        askTime();
    }

    function askTime() {
        if (!slots?.length) {
            const line = "There aren't any open times on that day. Let's pick another date together.";
            addAssistant(line);
            say(line);
            setTimeout(onClose, 2200);
            return;
        }
        const preview = slots.slice(0, 4).join(", ");
        const line = `Great. Available times are ${preview}${slots.length > 4 ? ", and more." : "."} Which time works?`;
        addAssistant(line);
        sayAndListen(line, handleTimeReply);
    }

    function handleTimeReply(text) {
        const m = matchTimeSlot(text, slots);
        if (!m) {
            const line = `I didn't catch a time. Could you say something like "10 AM" or "2 PM"?`;
            addAssistant(line);
            sayAndListen(line, handleTimeReply);
            return;
        }
        setCollected((c) => ({ ...c, preferred_time: m }));
        setStep(STEP.ASK_NAME);
        const line = `Perfect — ${m}. Could I have your full name?`;
        addAssistant(line);
        sayAndListen(line, handleNameReply);
    }

    function handleNameReply(text) {
        const { first, last } = parseName(text);
        if (!first) {
            const line = "Sorry, I didn't catch that. Could you say your first and last name?";
            addAssistant(line);
            sayAndListen(line, handleNameReply);
            return;
        }
        setCollected((c) => ({ ...c, first_name: first, last_name: last }));
        setStep(STEP.ASK_EMAIL);
        const line = `Thanks, ${first}. What's the best email — you can say "name at gmail dot com".`;
        addAssistant(line);
        sayAndListen(line, handleEmailReply);
    }

    function handleEmailReply(text) {
        const em = parseEmail(text);
        if (!em) {
            const line = "I couldn't parse that email. Could you spell it or type it below?";
            addAssistant(line);
            sayAndListen(line, handleEmailReply);
            return;
        }
        setCollected((c) => ({ ...c, email: em }));
        setStep(STEP.ASK_PHONE);
        const line = "Got it. And a phone number where we can reach you?";
        addAssistant(line);
        sayAndListen(line, handlePhoneReply);
    }

    function handlePhoneReply(text) {
        const ph = parsePhone(text);
        if (!ph || ph.replace(/[^0-9]/g, "").length < 7) {
            const line = "Could you say that phone number again? Just the digits.";
            addAssistant(line);
            sayAndListen(line, handlePhoneReply);
            return;
        }
        setCollected((c) => ({ ...c, phone: ph }));
        setStep(STEP.CONFIRM);
        const line =
            `Wonderful. To confirm — ${collected.first_name || parseName(messages.at(-2)?.text || "").first} ` +
            `on ${formatDate(selectedDate)} at ${collected.preferred_time || "—"}, ` +
            `and I'll send confirmation to ${collected.email || ""}. Shall I book it now?`;
        // rebuild using latest values (state async)
        const finalLine =
            `Wonderful. To confirm — booking on ${formatDate(selectedDate)} at ${collected.preferred_time || ""}${collected.preferred_time ? "" : ""}. ` +
            `Shall I go ahead and book it?`;
        addAssistant(finalLine);
        sayAndListen(finalLine, handleConfirmReply);
    }

    async function handleConfirmReply(text) {
        const cls = classifyYesNo(text);
        if (cls === "no") {
            const line = "OK, I'll stop here. You can close me anytime.";
            addAssistant(line);
            say(line);
            setTimeout(onClose, 1800);
            return;
        }
        await doBooking();
    }

    async function doBooking() {
        setStep(STEP.BOOKING);
        const submitting = "Booking now…";
        addAssistant(submitting);
        try {
            await submitConsultation({
                first_name: collected.first_name,
                last_name: collected.last_name,
                email: collected.email,
                phone: collected.phone,
                service_interest: collected.service_interest || "",
                preferred_date: toISODate(selectedDate),
                preferred_time: collected.preferred_time,
                message: "Booked with Eva, the voice assistant.",
            });
            setStep(STEP.DONE);
            const done = `You're on the calendar, ${collected.first_name}! A confirmation is on its way to ${collected.email}.`;
            addAssistant(done);
            say(done);
            onBooked?.({ ...collected, date: selectedDate });
            setTimeout(onClose, 4200);
        } catch (err) {
            const errMsg = err?.response?.data?.detail || "Something went wrong booking that slot.";
            const line = typeof errMsg === "string" ? errMsg : "Something went wrong booking that slot.";
            addAssistant(line);
            say(line);
            setStep(STEP.CONFIRM);
        }
    }

    function toISODate(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${dd}`;
    }

    // Handle typed input (fallback)
    function submitTyped() {
        const t = typing.trim();
        if (!t) return;
        setTyping("");
        addUser(t);
        switch (step) {
            case STEP.INTRO:
                return handleIntroReply(t);
            case STEP.PICK_TIME:
                return handleTimeReply(t);
            case STEP.ASK_NAME:
                return handleNameReply(t);
            case STEP.ASK_EMAIL:
                return handleEmailReply(t);
            case STEP.ASK_PHONE:
                return handlePhoneReply(t);
            case STEP.CONFIRM:
                return handleConfirmReply(t);
            default:
                return;
        }
    }

    // Manual mic
    function toggleMic() {
        if (listening) {
            stopListening();
            return;
        }
        listen((heard) => {
            if (!heard) return;
            addUser(heard);
            switch (step) {
                case STEP.INTRO:
                    return handleIntroReply(heard);
                case STEP.PICK_TIME:
                    return handleTimeReply(heard);
                case STEP.ASK_NAME:
                    return handleNameReply(heard);
                case STEP.ASK_EMAIL:
                    return handleEmailReply(heard);
                case STEP.ASK_PHONE:
                    return handlePhoneReply(heard);
                case STEP.CONFIRM:
                    return handleConfirmReply(heard);
                default:
                    return;
            }
        });
    }

    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    key="eva-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6"
                    onClick={onClose}
                    data-testid="eva-backdrop"
                >
                    <motion.div
                        key="eva-modal"
                        initial={{ opacity: 0, y: 30, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        transition={{
                            duration: 0.5,
                            ease: [0.2, 0.8, 0.2, 1],
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md overflow-hidden border border-gold/40 bg-ink shadow-[0_40px_120px_-30px_rgba(212,175,55,0.35)]"
                        data-testid="eva-modal"
                    >
                        {/* Ambient glow */}
                        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl" />

                        <button
                            onClick={onClose}
                            aria-label="Close assistant"
                            data-testid="eva-close"
                            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center border border-white/15 text-white/60 transition-colors hover:border-gold hover:text-gold"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="relative flex flex-col items-center gap-2 border-b border-white/10 px-6 py-8 text-center">
                            <EvaAvatar
                                listening={listening}
                                speaking={speaking}
                            />
                            <div className="mt-4 flex items-center gap-2 label text-gold">
                                <Sparkles className="h-3.5 w-3.5" />
                                Voice Assistant
                            </div>
                            <div className="font-serif text-3xl italic text-white">
                                Eva
                            </div>
                            <div className="mt-1 text-xs text-white/50">
                                {selectedDate
                                    ? formatDate(selectedDate)
                                    : "Booking with you"}
                                {" "}·{" "}
                                {listening
                                    ? "listening…"
                                    : speaking
                                      ? "speaking…"
                                      : "ready"}
                            </div>
                        </div>

                        {/* Live caption while Eva is speaking */}
                        <AnimatePresence>
                            {caption && (
                                <motion.div
                                    key="eva-caption"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.3 }}
                                    className="border-b border-gold/25 bg-gold/[0.06] px-6 py-4"
                                    data-testid="eva-caption"
                                    role="status"
                                    aria-live="polite"
                                >
                                    <div className="label mb-1 flex items-center gap-2 text-gold">
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inset-0 animate-ping rounded-full bg-gold/70" />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                                        </span>
                                        Eva is saying
                                    </div>
                                    <div className="font-serif text-base italic leading-snug text-white sm:text-lg">
                                        {caption}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Transcript */}
                        <div
                            ref={scrollRef}
                            className="max-h-[38vh] overflow-y-auto px-5 py-5"
                            data-testid="eva-transcript"
                        >
                            {messages.length === 0 && (
                                <div className="text-center text-sm text-white/40">
                                    Eva is loading her voice…
                                </div>
                            )}
                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`mb-3 flex ${
                                        m.who === "eva" ? "justify-start" : "justify-end"
                                    }`}
                                >
                                    <div
                                        className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                                            m.who === "eva"
                                                ? "border border-gold/40 bg-white/[0.03] text-white"
                                                : "border border-white/15 bg-white/[0.06] text-white/85"
                                        }`}
                                    >
                                        {m.text}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Composer */}
                        <div className="border-t border-white/10 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={toggleMic}
                                    disabled={!supported.listen}
                                    data-testid="eva-mic"
                                    aria-label={
                                        listening ? "Stop listening" : "Talk to Eva"
                                    }
                                    className={`relative grid h-11 w-11 place-items-center border transition-colors ${
                                        listening
                                            ? "border-gold bg-gold text-ink"
                                            : "border-white/20 text-white/80 hover:border-gold hover:text-gold"
                                    } disabled:opacity-40`}
                                >
                                    {listening ? (
                                        <MicOff className="h-4 w-4" />
                                    ) : (
                                        <Mic className="h-4 w-4" />
                                    )}
                                    {listening && (
                                        <motion.span
                                            animate={{
                                                scale: [1, 1.6],
                                                opacity: [0.6, 0],
                                            }}
                                            transition={{
                                                duration: 1.2,
                                                repeat: Infinity,
                                            }}
                                            className="pointer-events-none absolute inset-0 border border-gold"
                                        />
                                    )}
                                </button>

                                <input
                                    value={typing}
                                    onChange={(e) => setTyping(e.target.value)}
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && submitTyped()
                                    }
                                    placeholder={
                                        supported.listen
                                            ? "…or type your reply"
                                            : "Type your reply"
                                    }
                                    className="flex-1 border-b border-white/15 bg-transparent px-1 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold"
                                    data-testid="eva-input"
                                />

                                <button
                                    onClick={submitTyped}
                                    disabled={!typing.trim()}
                                    data-testid="eva-send"
                                    aria-label="Send"
                                    className="grid h-11 w-11 place-items-center border border-white/20 text-white/80 transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
                                >
                                    <Send className="h-4 w-4" />
                                </button>

                                <button
                                    onClick={() => setMuted((v) => !v)}
                                    disabled={!supported.speak}
                                    data-testid="eva-mute"
                                    aria-label={muted ? "Unmute Eva" : "Mute Eva"}
                                    className={`grid h-11 w-11 place-items-center border transition-colors ${
                                        muted
                                            ? "border-white/25 text-white/40"
                                            : "border-white/20 text-white/80 hover:border-gold hover:text-gold"
                                    } disabled:opacity-40`}
                                >
                                    {muted ? (
                                        <VolumeX className="h-4 w-4" />
                                    ) : (
                                        <Volume2 className="h-4 w-4" />
                                    )}
                                </button>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] tracking-[0.24em] uppercase text-white/40">
                                <span>Voice + text — reply either way</span>
                                <button
                                    onClick={onClose}
                                    data-testid="eva-dismiss"
                                    className="link-underline"
                                >
                                    Book myself
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}

function EvaAvatar({ listening, speaking }) {
    return (
        <div className="relative grid h-24 w-24 place-items-center">
            <motion.span
                animate={{ scale: listening || speaking ? [1, 1.35, 1] : 1 }}
                transition={{
                    duration: 1.8,
                    repeat: listening || speaking ? Infinity : 0,
                    ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full border border-gold/40"
            />
            <motion.span
                animate={{ scale: listening ? [1, 1.6, 1] : speaking ? [1, 1.45, 1] : 1, opacity: listening || speaking ? [0.4, 0.9, 0.4] : 1 }}
                transition={{
                    duration: 2.4,
                    repeat: listening || speaking ? Infinity : 0,
                    ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full border border-gold/25"
            />
            <div className="relative grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-dark text-ink shadow-[0_0_40px_rgba(212,175,55,0.6)]">
                <span className="font-serif text-3xl italic">E</span>
            </div>
        </div>
    );
}
