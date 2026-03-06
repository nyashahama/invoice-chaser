import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Ticker from "@/components/Ticker";
import HowItWorks from "@/components/HowItWorks";
import ToneSelector from "@/components/ToneSelector";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <Stats />
      <Ticker />
      <HowItWorks />
      <ToneSelector />
      <Features />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </>
  );
}
