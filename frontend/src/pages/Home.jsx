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

export default function Home() {
    useLenis();
    return (
        <main
            className="grain relative bg-ink text-white"
            data-testid="home-page"
        >
            <ScrollProgress />
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
