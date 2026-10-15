"use client";

import { ContainerScroll } from "@/components/animations/container-scroll";
import { profile, skills } from "@/data/portfolio";
import { SplineScene } from "@/components/background/spline-scene";

/**
 * Scroll-linked about section. The left of the card features the interactive
 * 3D robot following the cursor, paired with Michael's verified skills and qualifications.
 */
export default function AboutPhoto() {
  return (
    <section id="about" className="relative scroll-mt-24">
      <ContainerScroll
        titleComponent={
          <>
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">About me</h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {profile.about}
            </p>
          </>
        }
      >
        <div className="flex h-full w-full flex-col md:flex-row">
          <div className="relative h-72 w-full md:h-full md:w-[46%] overflow-hidden rounded-xl bg-surface/60 border border-line/30 flex items-center justify-center">
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="h-full w-full"
            />
          </div>

          <dl className="flex h-full w-full flex-col justify-center gap-5 p-6 md:w-[54%] md:p-10">
            <FactRow term="Education" detail="BS Computer Science, Quezon City University (2023 — present)" />
            <FactRow term="Focus" detail="Backend development and quality assurance" />
            <FactRow term="Languages" detail={skills.languages.join(", ")} />
            <FactRow term="Tools" detail={skills.tools.join(", ")} />
            <FactRow term="Currently" detail={profile.availability} />
          </dl>
        </div>
      </ContainerScroll>
    </section>
  );
}

function FactRow({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="border-b border-line pb-4 last:border-b-0 last:pb-0">
      <dt className="font-mono text-xs text-muted-foreground">{term}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-foreground/90 md:text-base">{detail}</dd>
    </div>
  );
}
