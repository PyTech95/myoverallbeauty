import LegalPage, { LegalSection } from "./LegalPage";
import { useContent } from "../lib/contentContext";

export default function Accessibility() {
    const { content } = useContent();
    const biz = content.legal.business_name;
    const email = content.contact.email;
    return (
        <LegalPage
            eyebrow="Accessibility"
            title="Accessibility Statement"
            seoPath="/accessibility"
            seoDescription="Our commitment to an accessible website and practice at Overall Beauty & Wellness in Farmingdale, NY."
            updated={content.legal.effective_date}
        >
            <p>
                {biz} is committed to providing an inclusive experience for
                every visitor. We strive to meet WCAG 2.1 AA standards across
                our website and to continuously improve the accessibility of
                our services.
            </p>
            <LegalSection title="What we do">
                <ul className="list-disc space-y-2 pl-6 text-white/70">
                    <li>
                        Semantic, keyboard-navigable interface with visible
                        focus states.
                    </li>
                    <li>Alternative text for meaningful imagery.</li>
                    <li>
                        Color contrast ratios that meet AA standards for body
                        text.
                    </li>
                    <li>
                        Responsive layouts that work across screen readers and
                        assistive devices.
                    </li>
                </ul>
            </LegalSection>
            <LegalSection title="Reporting an issue">
                <p>
                    Encountered a barrier? We want to hear from you. Please
                    email{" "}
                    <a
                        href={`mailto:${email}`}
                        className="link-underline text-gold"
                    >
                        {email}
                    </a>{" "}
                    with a description of the issue and, if possible, the
                    page URL. We aim to respond within 5 business days.
                </p>
            </LegalSection>
            <LegalSection title="Ongoing improvement">
                <p>
                    Accessibility is a process, not a destination. We
                    regularly review and refine our site to ensure everyone
                    can experience {biz} with ease and dignity.
                </p>
            </LegalSection>
        </LegalPage>
    );
}
