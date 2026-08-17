import LegalPage, { LegalSection } from "./LegalPage";
import { useContent } from "../lib/contentContext";

export default function Cookies() {
    const { content } = useContent();
    const email = content.contact.email;
    return (
        <LegalPage
            eyebrow="Cookies"
            title="Cookie Policy"
            updated={content.legal.effective_date}
        >
            <p>
                We use a small number of cookies and similar technologies to
                help our site function and to improve your experience.
                Cookies are tiny text files stored in your browser.
            </p>
            <LegalSection title="Categories we use">
                <ul className="list-disc space-y-2 pl-6 text-white/70">
                    <li>
                        <b className="text-white/90">Strictly necessary.</b>{" "}
                        Required for the site to function (session, security,
                        booking form protection).
                    </li>
                    <li>
                        <b className="text-white/90">Preferences.</b>{" "}
                        Remember settings like the dismissed launch banner.
                    </li>
                    <li>
                        <b className="text-white/90">Analytics.</b> Aggregate,
                        anonymized usage to improve the site. We do not use
                        third-party advertising cookies.
                    </li>
                </ul>
            </LegalSection>
            <LegalSection title="Managing cookies">
                <p>
                    You can control or delete cookies in your browser
                    settings. Blocking strictly necessary cookies may affect
                    site functionality.
                </p>
            </LegalSection>
            <LegalSection title="Contact">
                <p>
                    Questions? Reach us at{" "}
                    <a
                        href={`mailto:${email}`}
                        className="link-underline text-gold"
                    >
                        {email}
                    </a>
                    .
                </p>
            </LegalSection>
        </LegalPage>
    );
}
