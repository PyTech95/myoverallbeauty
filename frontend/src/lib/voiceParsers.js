/**
 * Small utilities to turn spoken text into structured booking data.
 */

const YES_WORDS = [
    "yes", "yeah", "yep", "sure", "please", "ok", "okay", "go", "let's go",
    "alright", "help", "assist", "book with", "with you", "with eva",
    "guide", "walk me", "you do it",
];
const NO_WORDS = [
    "no", "nope", "nah", "myself", "on my own", "self", "self book", "self-book",
    "i can", "i'll do", "not now", "later", "skip", "close",
    "don't need", "do not need", "dismiss", "cancel",
];

export function classifyYesNo(text) {
    const t = String(text || "").toLowerCase();
    if (!t) return "unknown";
    const isNo = NO_WORDS.some((w) => t.includes(w));
    const isYes = YES_WORDS.some((w) => t.includes(w));
    if (isNo && !isYes) return "no";
    if (isYes && !isNo) return "yes";
    if (isNo && isYes) {
        // whichever appears first wins
        const iNo = Math.min(
            ...NO_WORDS.map((w) => t.indexOf(w)).filter((i) => i >= 0),
        );
        const iYes = Math.min(
            ...YES_WORDS.map((w) => t.indexOf(w)).filter((i) => i >= 0),
        );
        return iNo < iYes ? "no" : "yes";
    }
    return "unknown";
}

/**
 * Match spoken text to one of the available time slots.
 * Slots look like "9:00 AM" / "1:30 PM"
 */
export function matchTimeSlot(text, slots) {
    const t = String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!t || !slots?.length) return null;

    // Direct number+meridiem: "9 am", "9:30 am", "10:15pm"
    const re =
        /\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|morning|afternoon|evening)?/i;
    const m = t.match(re);
    if (m) {
        let hh = parseInt(m[1], 10);
        const mm = m[2] ? parseInt(m[2], 10) : 0;
        let mer = (m[3] || "").toLowerCase();
        if (mer.startsWith("morning")) mer = "am";
        else if (mer.startsWith("afternoon") || mer.startsWith("evening"))
            mer = "pm";
        // Infer meridiem if not stated
        if (!mer) {
            if (hh >= 1 && hh <= 6) mer = "pm";
            else if (hh >= 7 && hh <= 11) mer = "am";
            else mer = "pm"; // 12 = pm
        }
        if (mer.startsWith("p") && hh < 12) hh += 12;
        if (mer.startsWith("a") && hh === 12) hh = 0;
        const canonical = `${((hh % 12) || 12)}:${String(mm).padStart(2, "0")} ${
            hh < 12 ? "AM" : "PM"
        }`;
        // Try to find exact match in slots
        const exact = slots.find(
            (s) => s.toLowerCase() === canonical.toLowerCase(),
        );
        if (exact) return exact;
        // Otherwise pick closest slot within 45 min
        const target = hh * 60 + mm;
        let best = null;
        let bestDiff = Infinity;
        for (const s of slots) {
            const sm = s.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (!sm) continue;
            let sh = parseInt(sm[1], 10);
            const smin = parseInt(sm[2], 10);
            const smer = sm[3].toLowerCase();
            if (smer === "pm" && sh < 12) sh += 12;
            if (smer === "am" && sh === 12) sh = 0;
            const smTotal = sh * 60 + smin;
            const diff = Math.abs(smTotal - target);
            if (diff < bestDiff) {
                bestDiff = diff;
                best = s;
            }
        }
        return bestDiff <= 45 ? best : null;
    }

    // Fallback substring — e.g. "the ten one"
    return slots.find((s) => t.includes(s.toLowerCase())) || null;
}

/** Best-effort email parser: normalize spoken "at"/"dot" and pick out an email. */
export function parseEmail(text) {
    if (!text) return "";
    let t = String(text).toLowerCase();
    t = t.replace(/\s+at\s+/g, "@");
    t = t.replace(/\s+dot\s+/g, ".");
    t = t.replace(/\s+underscore\s+/g, "_");
    t = t.replace(/\s+dash\s+/g, "-");
    t = t.replace(/\s+hyphen\s+/g, "-");
    t = t.replace(/\s+/g, "");
    const m = t.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
    return m ? m[0] : "";
}

/** Extract phone digits from speech, tolerating "oh"→0, "double five"→55 etc. */
export function parsePhone(text) {
    if (!text) return "";
    let t = String(text).toLowerCase();
    t = t.replace(/oh /g, "0 ");
    t = t.replace(/plus/g, "+");
    t = t.replace(/dash|hyphen/g, "-");
    // spoken digit words
    const map = {
        zero: "0", one: "1", two: "2", three: "3", four: "4",
        five: "5", six: "6", seven: "7", eight: "8", nine: "9",
        ten: "10",
    };
    t = t.replace(
        /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten)\b/g,
        (w) => map[w] || w,
    );
    const digits = t.replace(/[^0-9+]/g, "");
    // Normalize double leading +
    return digits.slice(0, 20);
}

/** Very light-touch name extractor. */
export function parseName(text) {
    if (!text) return { first: "", last: "" };
    let t = String(text).trim();
    // Strip common fillers
    t = t.replace(/^(my name is|i'm|i am|it's|this is)\s+/i, "");
    // Grab first two capitalized-ish tokens
    const parts = t.split(/\s+/).filter(Boolean).slice(0, 3);
    if (parts.length === 0) return { first: "", last: "" };
    const cap = (s) =>
        s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase().replace(/[^\p{L}'-]/gu, "");
    if (parts.length === 1) return { first: cap(parts[0]), last: "" };
    return { first: cap(parts[0]), last: cap(parts.slice(1).join(" ")) };
}
