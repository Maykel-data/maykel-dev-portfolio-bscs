import ClosingCurtain from "@/components/animations/closing-curtain";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Hero from "@/components/sections/hero";
import AboutPhoto from "@/components/sections/about-photo";
import Education from "@/components/sections/education";
import Projects from "@/components/sections/projects";
import Experience from "@/components/sections/experience";
import Contact from "@/components/sections/contact";
import { GlobalSpotlight } from "@/components/ui/spotlight";

export default function Home() {
  return (
    <ClosingCurtain>
      <GlobalSpotlight size={540} />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <AboutPhoto />
        <Education />
        <Projects />
        <Experience />
        <Contact />
      </main>
      <Footer />
    </ClosingCurtain>
  );
}

