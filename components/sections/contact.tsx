import { profile } from "@/data/portfolio";

export default function Contact() {
  return (
    <section id="contact" className="px-6 py-28 md:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Contact</h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Open to internships and junior developer roles. Email is the fastest way to reach me.
        </p>

        <div className="mt-10">
          <a
            href={"mailto:" + profile.email}
            className="text-2xl font-semibold tracking-tight break-all transition-colors hover:text-brand md:text-4xl"
          >
            {profile.email}
          </a>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 font-mono text-sm">
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            LinkedIn
          </a>
          <a
            href={profile.resumeUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Download CV
          </a>
        </div>
      </div>
    </section>
  );
}
