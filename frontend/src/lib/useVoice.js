import { useCallback, useEffect, useRef, useState } from "react";

// Lightweight wrapper around the browser's Web Speech APIs.
// - Speech synthesis (Eva speaks)
// - Speech recognition (Eva listens) — Chrome / Edge / Safari (webkit)
// Falls back gracefully when APIs are missing (browsers without support).

export function useVoice({ voiceName = null } = {}) {
    const [supported, setSupported] = useState({
        speak: false,
        listen: false,
    });
    const [listening, setListening] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [transcript, setTranscript] = useState("");
    const recognitionRef = useRef(null);
    const preferredVoiceRef = useRef(null);
    const onFinalRef = useRef(null);

    useEffect(() => {
        const canSpeak =
            typeof window !== "undefined" && "speechSynthesis" in window;
        const SpeechRec =
            typeof window !== "undefined" &&
            (window.SpeechRecognition || window.webkitSpeechRecognition);
        setSupported({ speak: !!canSpeak, listen: !!SpeechRec });

        // Voice loader — some browsers load voices async
        if (canSpeak) {
            const pickVoice = () => {
                const voices = window.speechSynthesis.getVoices();
                if (!voices?.length) return;
                const preferred =
                    (voiceName &&
                        voices.find(
                            (v) =>
                                v.name.toLowerCase().includes(
                                    voiceName.toLowerCase(),
                                ),
                        )) ||
                    voices.find((v) => /Samantha|Aria|Ava|Zira|Joanna|Google US English/i.test(v.name)) ||
                    voices.find((v) => v.lang?.startsWith("en"));
                if (preferred) preferredVoiceRef.current = preferred;
            };
            pickVoice();
            window.speechSynthesis.onvoiceschanged = pickVoice;
        }

        if (SpeechRec) {
            const rec = new SpeechRec();
            rec.lang = "en-US";
            rec.interimResults = false;
            rec.continuous = false;
            rec.maxAlternatives = 1;
            rec.onresult = (e) => {
                const text = e.results?.[0]?.[0]?.transcript || "";
                setTranscript(text);
                if (onFinalRef.current) onFinalRef.current(text);
            };
            rec.onerror = () => setListening(false);
            rec.onend = () => setListening(false);
            recognitionRef.current = rec;
        }
        return () => {
            try {
                recognitionRef.current?.abort?.();
                window.speechSynthesis?.cancel?.();
            } catch {}
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [voiceName]);

    const speak = useCallback(
        (text, { onEnd } = {}) =>
            new Promise((resolve) => {
                if (!supported.speak || !text) return resolve();
                try {
                    window.speechSynthesis.cancel();
                    const utter = new SpeechSynthesisUtterance(text);
                    if (preferredVoiceRef.current)
                        utter.voice = preferredVoiceRef.current;
                    utter.rate = 1.02;
                    utter.pitch = 1.03;
                    utter.volume = 1;
                    utter.onstart = () => setSpeaking(true);
                    utter.onend = () => {
                        setSpeaking(false);
                        onEnd?.();
                        resolve();
                    };
                    utter.onerror = () => {
                        setSpeaking(false);
                        resolve();
                    };
                    window.speechSynthesis.speak(utter);
                } catch {
                    setSpeaking(false);
                    resolve();
                }
            }),
        [supported.speak],
    );

    const stopSpeaking = useCallback(() => {
        try {
            window.speechSynthesis?.cancel?.();
        } catch {}
        setSpeaking(false);
    }, []);

    const listen = useCallback(
        (onFinal) =>
            new Promise((resolve) => {
                if (!supported.listen || !recognitionRef.current)
                    return resolve("");
                setTranscript("");
                onFinalRef.current = (text) => {
                    onFinal?.(text);
                    resolve(text);
                };
                try {
                    setListening(true);
                    recognitionRef.current.start();
                } catch {
                    setListening(false);
                    resolve("");
                }
            }),
        [supported.listen],
    );

    const stopListening = useCallback(() => {
        try {
            recognitionRef.current?.stop?.();
        } catch {}
        setListening(false);
    }, []);

    return {
        supported,
        listening,
        speaking,
        transcript,
        speak,
        stopSpeaking,
        listen,
        stopListening,
    };
}
