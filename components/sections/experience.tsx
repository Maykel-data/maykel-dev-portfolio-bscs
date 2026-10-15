import { award, certifications, experience } from "@/data/portfolio";
import { WorksWheel, type WorksWheelItem } from "@/components/ui/works-wheel";

/** Work, leadership, research award, and interactive 3D drum wheel for verified certifications. */
export default function Experience() {
  const certItems: WorksWheelItem[] = certifications.map((cert) => ({
    title: cert.name,
    image: cert.image || "",
    issuer: cert.issuer,
    date: cert.date,
    href: cert.href,
  }));

  return (
    <section id="experience" className="px-6 py-28 md:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
          Experience &amp; certifications
        </h2>

        <div className="mt-14 grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.1fr_1.1fr] lg:gap-14">
          {/* Left Column: Work & Leadership + Award */}
          <div className="flex flex-col gap-12">
            <div>
              <h3 className="text-lg font-medium tracking-tight">Work &amp; leadership</h3>
              <ul className="mt-6">
                {experience.map((entry) => (
                  <li
                    key={entry.id}
                    className="border-t border-line py-6 first:border-t-0 first:pt-0"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <p className="font-medium text-foreground">{entry.role}</p>
                      <p className="font-mono text-xs text-muted-foreground">{entry.period}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{entry.org}</p>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/85">
                      {entry.detail}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Award aligned with Experience */}
            <div className="border-t border-line pt-8">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-medium tracking-tight">Award &amp; recognition</h3>
                <span className="font-mono text-xs text-muted-foreground">{award.year}</span>
              </div>
              <figure className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xs">
                <blockquote className="text-sm leading-relaxed text-foreground/90 font-serif italic">
                  “{award.title}”
                </blockquote>
                <figcaption className="mt-3 font-mono text-xs text-muted-foreground flex items-center gap-2">
                  <span className="inline-block size-1.5 rounded-full bg-emerald-400/80" />
                  {award.result}
                </figcaption>
              </figure>
            </div>
          </div>

          {/* Right Column: 3D Drum Wheel for Certifications */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-lg font-medium tracking-tight">Certifications</h3>
              <span className="font-mono text-xs text-muted-foreground">
                {certifications.length} Credentials
              </span>
            </div>

            <div className="mt-3 h-[460px] md:h-[490px] w-full">
              <WorksWheel
                items={certItems}
                label="Certifications"
                action="Verify"
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
