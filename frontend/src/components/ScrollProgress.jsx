import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 120,
        damping: 30,
        mass: 0.4,
    });
    return (
        <motion.div
            style={{ scaleX }}
            className="fixed left-0 right-0 top-0 z-[80] h-[2px] origin-left bg-gold"
            data-testid="scroll-progress"
        />
    );
}
