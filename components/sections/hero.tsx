"use client";

import Image from "next/image";
import { profile } from "@/data/portfolio";
import HalftoneName from "@/components/hero/halftone-name";
import { ScrambleText } from "@/components/ui/scramble-text";

/**
 * Hero section:
 * Left: Interactive halftone name with spring physics and brand amber warming.
 * Right: Michael's professional portrait with transparent background, subtle amber halo, and bottom fade.
 */
export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[92svh] flex-col justify-center px-6 pt-28 pb-8 md:px-10 md:pb-12"
    >


      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:gap-14 md:grid-cols-[1.24fr_0.96fr]">
        <div className="relative z-10 flex flex-col items-start">
          {/* Accessible heading with high-resolution interactive halftone dots */}
          <h1 className="w-full">
            <span className="sr-only">{profile.name}</span>
            <HalftoneName
              lines={["Michael Jhosh T.", "Abundabar"]}
              dotGap={3.8}
              radius={80}
              maxFontSize={84}
              ink="#eae7de"
              warm="#ffb454"
              align="left"
            />
          </h1>

          <p className="mt-5 text-lg text-foreground/90 md:text-xl">
            <ScrambleText
              className="font-sans"
              speed={16}
              delay={200}
            >
              {`${profile.role} at ${profile.school}.`}
            </ScrambleText>
          </p>

          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            <ScrambleText
              className="font-sans text-sm md:text-base leading-relaxed text-muted-foreground"
              speed={10}
              delay={500}
            >
              {profile.intro}
            </ScrambleText>
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#projects"
              className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              View projects
            </a>
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full border border-line px-6 py-3 text-sm font-medium transition-colors hover:border-foreground/40"
            >
              Download CV
            </a>
          </div>

          <p className="mt-8 font-mono text-xs text-muted-foreground">
            <ScrambleText
              className="font-mono text-xs text-muted-foreground"
              speed={14}
              delay={950}
            >
              {`${profile.availability} / ${profile.location}`}
            </ScrambleText>
          </p>
        </div>

        {/* Right column: Cutout portrait with ambient backlight and seamless bottom fade */}
        <div className="relative flex items-end justify-center h-[46vh] min-h-[340px] md:h-[65vh] w-full">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute h-[72%] w-[88%] rounded-full bg-[radial-gradient(circle_at_50%_48%,rgba(255,180,84,0.18),rgba(234,231,222,0.05)_45%,transparent_70%)] blur-3xl"
          />

          <div className="relative h-full w-full max-w-[460px] [mask-image:linear-gradient(to_bottom,black_84%,transparent_100%)]">
            <Image
              src="/images/michael-transparent.png"
              alt="Portrait of Michael Jhosh T. Abundabar"
              fill
              priority
              sizes="(max-width: 768px) 85vw, 42vw"
              className="object-contain object-bottom drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
