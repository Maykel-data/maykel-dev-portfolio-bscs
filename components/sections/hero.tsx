"use client";

import Image from "next/image";
import { profile } from "@/data/portfolio";
import HalftoneName from "@/components/hero/halftone-name";
import PersonalNote from "@/components/hero/personal-note";
import { ScrambleText } from "@/components/ui/scramble-text";
import { Mail } from "lucide-react";

const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (process.env.NODE_ENV === "production" ? "/maykel-dev-portfolio-bscs" : "");

/**
 * Hero section — social-profile composition:
 * circular gold-ringed portrait (with personal note bubble) at the top,
 * centered interactive halftone name, status chip, role, intro, social
 * links, and a separate lower CTA area for the existing actions.
 */
export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[92svh] flex-col justify-center px-6 pt-28 pb-8 md:px-10 md:pb-12"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">

        {/* Top-center circular portrait with a refined gold ring */}
        <div className="relative">
          <div className="rounded-full bg-[conic-gradient(from_180deg,#f7cf7f,#ffb454_30%,#a06514_55%,#ffb454_75%,#f7cf7f)] p-[3px] shadow-[0_0_0_7px_rgba(255,180,84,0.07),0_12px_48px_-12px_rgba(255,180,84,0.55)]">
            <div className="relative h-36 w-36 overflow-hidden rounded-full sm:h-44 sm:w-44 md:h-52 md:w-52">
              <Image
                src={`${basePath}/images/profile-id.jpg`}
                alt="Portrait of Michael Jhosh T. Abundabar"
                fill
                priority
                sizes="(max-width: 640px) 144px, (max-width: 768px) 176px, 208px"
                className="object-cover"
              />
            </div>
          </div>
          <PersonalNote />
        </div>

        {/* Accessible heading — interactive halftone name, now centered */}
        <h1 className="mt-7 w-full md:mt-9">
          <span className="sr-only">{profile.name}</span>
          <HalftoneName
            lines={["Michael Jhosh T.", "Abundabar"]}
            dotGap={3.8}
            radius={80}
            maxFontSize={84}
            ink="#eae7de"
            warm="#ffb454"
            align="center"
          />
        </h1>

        {/* Availability status line */}
        <div className="mt-4 inline-flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            <ScrambleText
              className="font-mono text-xs text-muted-foreground"
              speed={14}
              delay={950}
            >
              {`${profile.availability} / ${profile.location}`}
            </ScrambleText>
          </span>
        </div>

        {/* Education and professional identity */}
        <p className="mt-5 text-lg text-foreground/90 md:text-xl">
          <ScrambleText
            className="font-sans"
            speed={16}
            delay={200}
          >
            {`${profile.role} at ${profile.school}.`}
          </ScrambleText>
        </p>

        {/* Short intro / tagline */}
        <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
          <ScrambleText
            className="font-sans text-sm md:text-base leading-relaxed text-muted-foreground"
            speed={10}
            delay={500}
          >
            {profile.intro}
          </ScrambleText>
        </p>

        {/* Social links */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0z" />
            </svg>
            LinkedIn
          </a>
          <a
            href={`mailto:${profile.email}`}
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Email
          </a>
        </div>

        {/* Separate lower CTA area — existing actions, moved out of the identity block */}
        <div className="mt-12 w-full">
          <div
            aria-hidden="true"
            className="mx-auto mb-8 h-px w-40 bg-line"
          />
          <div className="flex flex-wrap items-center justify-center gap-4">
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
        </div>
      </div>
    </section>
  );
}
