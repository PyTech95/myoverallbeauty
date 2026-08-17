import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, MapPin, Phone } from "lucide-react";
import { useContent } from "../../lib/contentContext";

export default function Footer() {
    const { content } = useContent();
    const C = content.contact;
    const F = content.footer || {};
    const brand = content.brand || {};
    const links = content.nav?.links || [];
    return (
        <footer
            id="contact"
            className="relative overflow-hidden bg-ink pt-20 sm:pt-24 lg:pt-32"
            data-testid="footer-section"
        >
            <div className="mx-auto max-w-[1600px] px-4 sm:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="mb-16 grid grid-cols-1 gap-8 border-y border-white/10 py-10 sm:mb-24 sm:gap-10 sm:py-14 lg:grid-cols-[auto_1fr] lg:gap-16"
                >
                    <div className="label text-gold" data-edit="footer.mission_label">
                        {F.mission_label}
                    </div>
                    <p
                        className="font-serif text-xl italic leading-[1.3] text-white sm:text-2xl lg:text-4xl"
                        data-edit="mission"
                    >
                        {content.mission}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                    <div>
                        <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="h-24 w-auto object-contain sm:h-32"
                        />
                        <div
                            className="mt-4 max-w-xs text-sm text-white/50"
                            data-edit="brand.blurb"
                        >
                            {brand.blurb}
                        </div>
                    </div>

                    <div>
                        <div className="label text-white/40" data-edit="footer.explore_label">
                            {F.explore_label}
                        </div>
                        <ul className="mt-6 space-y-3">
                            {links.map((x, i) => (
                                <li key={`${x.href}-${i}`}>
                                    <a
                                        href={x.href}
                                        className="link-underline font-serif text-lg italic text-white/80 hover:text-gold sm:text-xl"
                                        data-testid={`footer-link-${(x.label || "").toLowerCase()}`}
                                    >
                                        {x.label}
                                    </a>
                                </li>
                            ))}
                            <li>
                                <Link
                                    to="/faq"
                                    className="link-underline font-serif text-lg italic text-white/80 hover:text-gold sm:text-xl"
                                    data-testid="footer-link-faq"
                                >
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <div className="label text-white/40" data-edit="footer.contact_label">
                            {F.contact_label}
                        </div>
                        <ul className="mt-6 space-y-4 text-white/80">
                            <li className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-gold" />
                                <a
                                    href={`mailto:${C.email}`}
                                    className="link-underline break-all"
                                    data-testid="footer-email"
                                >
                                    {C.email}
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-gold" />
                                <a
                                    href={`tel:${(C.phone || "").replace(/[^+0-9]/g, "")}`}
                                    data-testid="footer-phone"
                                    className="link-underline"
                                >
                                    {C.phone_display || C.phone}
                                </a>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="mt-1 h-4 w-4 text-gold" />
                                <span data-testid="footer-address">
                                    <span data-edit="contact.address_line_1">
                                        {C.address_line_1}
                                    </span>
                                    <br />
                                    <span data-edit="contact.address_line_2">
                                        {C.address_line_2}
                                    </span>
                                </span>
                            </li>
                        </ul>
                        <div className="mt-6">
                            <div className="label text-white/40" data-edit="footer.legal_label">
                                {F.legal_label}
                            </div>
                            <ul className="mt-3 space-y-2 text-sm text-white/60">
                                <li>
                                    <Link
                                        to="/faq"
                                        data-testid="footer-legal-faq"
                                        className="link-underline"
                                    >
                                        FAQ
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/privacy"
                                        data-testid="footer-privacy"
                                        className="link-underline"
                                    >
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/terms"
                                        data-testid="footer-terms"
                                        className="link-underline"
                                    >
                                        Terms of Service
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/accessibility"
                                        data-testid="footer-accessibility"
                                        className="link-underline"
                                    >
                                        Accessibility
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/cookies"
                                        data-testid="footer-cookies"
                                        className="link-underline"
                                    >
                                        Cookie Policy
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div>
                        <div className="label text-white/40" data-edit="footer.follow_label">
                            {F.follow_label}
                        </div>
                        <div className="mt-6 flex gap-3">
                            {[
                                { Icon: Instagram, label: "Instagram", href: C.social?.instagram || "#" },
                                { Icon: Facebook, label: "Facebook", href: C.social?.facebook || "#" },
                            ].map(({ Icon, label, href }) => (
                                <a
                                    key={label}
                                    href={href}
                                    aria-label={label}
                                    data-testid={`footer-social-${label.toLowerCase()}`}
                                    className="grid h-11 w-11 place-items-center border border-white/15 text-white/60 transition-colors hover:border-gold hover:text-gold"
                                >
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                        <div className="mt-10 label text-white/40" data-edit="footer.hours_label">
                            {F.hours_label}
                        </div>
                        <div className="mt-3 space-y-1 text-white/80">
                            {(C.hours || []).map((h, i) => (
                                <div key={i} data-edit={`contact.hours.${i}`}>
                                    {h}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-16 select-none overflow-hidden sm:mt-24">
                    <div
                        className="font-serif text-[19vw] italic leading-[0.85] tracking-tight text-white/[.06]"
                        data-edit="brand.watermark"
                    >
                        {brand.watermark}
                    </div>
                </div>

                <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-white/10 py-8 pb-32 text-sm text-white/40 sm:flex-row sm:items-center sm:pb-8">
                    <div>
                        © {new Date().getFullYear()}{" "}
                        <span data-edit="legal.business_name">
                            {content.legal.business_name}
                        </span>{" "}
                        · All rights reserved.
                    </div>
                    <div className="label">
                        <span data-edit="legal.owner">{content.legal.owner}</span> ·{" "}
                        <span data-edit="footer.credit">{F.credit}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
