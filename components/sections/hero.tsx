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
 * centered interactive halftone name, role, intro, social links
 * (LinkedIn, Email, GitHub, Facebook), a widened divider, and the
 * availability status line sitting beneath it.
 */
export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[92svh] flex-col justify-center overflow-x-clip px-6 pt-28 pb-8 md:px-10 md:pb-12"
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
          <a
            href={(profile as { github?: string }).github ?? "https://github.com/Maykel-data"}
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
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            GitHub
          </a>
          <a
            href={(profile as { facebook?: string }).facebook ?? "https://www.facebook.com/Maykeel.jhs"}
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
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </a>
        </div>

        {/* Widened divider with the availability status line beneath it */}
        <div className="mt-10 w-full">
          <div
            aria-hidden="true"
            className="mx-auto h-px w-full max-w-xl bg-linear-to-r from-transparent via-line to-transparent"
          />
          <div className="mt-6 flex items-center justify-center gap-2">
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
        </div>
      </div>
    </section>
  );
}
