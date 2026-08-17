import LegalPage, { LegalSection } from "./LegalPage";
import { useContent } from "../lib/contentContext";

export default function Privacy() {
    const { content } = useContent();
    const biz = content.legal.business_name;
    const email = content.contact.email;
    return (
        <LegalPage
            eyebrow="Privacy"
            title="Privacy Policy"
            updated={content.legal.effective_date}
        >
            <p>
                {biz} ("we", "us", "our") respects your privacy. This policy
                explains what personal information we collect, how we use it,
                and the choices you have. By using our website or services,
                you consent to the practices described here.
            </p>

            <LegalSection title="Information we collect">
                <p>
                    We collect information you provide when you request a
                    complimentary consultation, contact us, or create an
                    account: your name, email address, phone number, preferred
                    dates/times, and any notes you choose to share. If you
                    become a client, we also collect the medical and treatment
                    information required to deliver safe, personalized care.
                </p>
                <p>
                    We may collect limited technical information automatically
                    (IP address, browser type, pages visited) to secure and
                    improve the site.
                </p>
            </LegalSection>

            <LegalSection title="How we use your information">
                <p>
                    We use your information to schedule consultations, provide
                    care, respond to inquiries, send appointment confirmations,
                    and comply with our legal and professional obligations. We
                    never sell your personal information.
                </p>
            </LegalSection>

            <LegalSection title="Sharing">
                <p>
                    We share information only with trusted service providers
                    that help us operate the practice (secure hosting, email
                    delivery, appointment tools), and where required by law.
                    All such providers are bound by confidentiality
                    obligations.
                </p>
            </LegalSection>

            <LegalSection title="Your choices">
                <p>
                    You may request to access, correct, or delete your
                    personal information at any time by contacting us at{" "}
                    <a
                        href={`mailto:${email}`}
                        className="link-underline text-gold"
                    >
                        {email}
                    </a>
                    . You may also unsubscribe from marketing emails using the
                    link in each message; transactional and appointment
                    communications will still be sent.
                </p>
            </LegalSection>

            <LegalSection title="Security">
                <p>
                    We use industry-standard technical and organizational
                    measures to protect your information. No transmission
                    over the internet is 100% secure — please contact us
                    immediately if you suspect a security issue.
                </p>
            </LegalSection>

            <LegalSection title="Contact">
                <p>
                    Questions about this policy? Contact {biz} at{" "}
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
