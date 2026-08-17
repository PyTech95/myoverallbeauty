import { useLenis } from "../lib/useLenis";
import AnnouncementBar from "../components/AnnouncementBar";
import Nav from "../components/Nav";
import Hero from "../components/sections/Hero";
import Manifesto from "../components/sections/Manifesto";
import Marquee from "../components/sections/Marquee";
import Services from "../components/sections/Services";
import Founder from "../components/sections/Founder";
import Booking from "../components/sections/Booking";
import Testimonials from "../components/sections/Testimonials";
import Footer from "../components/sections/Footer";
import ScrollProgress from "../components/ScrollProgress";
import PromoVideo from "../components/PromoVideo";
import { useContent } from "../lib/contentContext";
import { useSeo } from "../lib/seo";

export default function Home() {
    useLenis();
    const { content } = useContent();
    useSeo({
        title: "Overall Beauty & Wellness — Aesthetic & Wellness Med Spa in Farmingdale, NY",
        description:
            "Boutique med spa in Farmingdale, NY. Botox, Xeomin, lip filler, Sculptra, Radiesse, microneedling with PRP, PDO threads, hydrodermabrasion and IV hydration by Crystal G. Marrero, FNP-C. Book a complimentary consultation.",
        path: "/",
        jsonLd: {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: (content.faq?.items || []).slice(0, 4).map((it) => ({
                "@type": "Question",
                name: it.q,
                acceptedAnswer: { "@type": "Answer", text: it.a },
            })),
        },
    });
    return (
        <main
            className="grain relative bg-ink text-white"
            data-testid="home-page"
        >
            <ScrollProgress />
            <PromoVideo />
            <AnnouncementBar />
            <Nav />
            <Hero />
            <Manifesto />
            <Marquee />
            <Services />
            <Founder />
            <Booking />
            <Testimonials />
            <Footer />
        </main>
    );
}
