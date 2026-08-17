import LegalPage, { LegalSection } from "./LegalPage";
import { useContent } from "../lib/contentContext";

export default function Terms() {
    const { content } = useContent();
    const biz = content.legal.business_name;
    const owner = content.legal.owner;
    const jurisdiction = content.legal.jurisdiction;
    return (
        <LegalPage
            eyebrow="Legal"
            title="Terms of Service"
            seoPath="/terms"
            seoDescription="Terms governing consultations, bookings, deposits, cancellations and pricing at Overall Beauty & Wellness."
            updated={content.legal.effective_date}
        >
            <p>
                Welcome to {biz}. These Terms of Service ("Terms") govern your
                use of our website and services. By using the site or
                requesting services, you agree to these Terms.
            </p>

            <LegalSection title="Services & consultation">
                <p>
                    Complimentary consultations are informational and are not
                    a substitute for a full medical evaluation. Treatment
                    decisions are made on a case-by-case basis by {owner} and
                    are subject to medical suitability. We reserve the right
                    to decline services when in our professional judgment a
                    treatment is not appropriate.
                </p>
            </LegalSection>

            <LegalSection title="Bookings, deposits & cancellations">
                <p>
                    Complimentary consultations may be rescheduled with at
                    least 24 hours' notice. Repeated no-shows may require a
                    deposit to secure future bookings. Any deposit policies
                    for specific treatments will be communicated at booking.
                </p>
            </LegalSection>

            <LegalSection title="Pricing">
                <p>
                    Prices displayed are starting-at prices and are subject
                    to change. Final pricing is provided in your personalized
                    treatment plan following consultation. Promotional pricing
                    is available for a limited time and cannot be combined
                    with other offers unless expressly stated.
                </p>
            </LegalSection>

            <LegalSection title="Client responsibilities">
                <p>
                    You agree to provide accurate personal and medical
                    information and to follow pre- and post-treatment
                    instructions. Failure to do so may affect your safety and
                    outcomes.
                </p>
            </LegalSection>

            <LegalSection title="Intellectual property">
                <p>
                    All content on this site — including text, imagery,
                    layout, and the {biz} brand — is owned by {biz} and may
                    not be reproduced without permission.
                </p>
            </LegalSection>

            <LegalSection title="Disclaimer & limitation of liability">
                <p>
                    Aesthetic and wellness services carry inherent risks that
                    will be discussed at consultation. To the fullest extent
                    permitted by law, {biz} disclaims implied warranties and
                    is not liable for indirect or consequential damages.
                </p>
            </LegalSection>

            <LegalSection title="Governing law">
                <p>
                    These Terms are governed by the laws of {jurisdiction},
                    without regard to conflict-of-law principles.
                </p>
            </LegalSection>

            <LegalSection title="Changes">
                <p>
                    We may update these Terms. The current version, with
                    effective date, will always be posted on this page.
                </p>
            </LegalSection>
        </LegalPage>
    );
}
