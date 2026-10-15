"use client";

import { useEffect, useRef, useState } from "react";
import GlassFolder from "@/components/portfolio/project-folder";
import { projectFolders } from "@/data/portfolio";

/** Measures its own width so folders scale cleanly from 320px up. */
function FolderSlot({
  children,
}: {
  children: (width: number) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(340);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => setWidth(Math.min(360, Math.max(240, el.clientWidth)));
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex w-full justify-center">
      {children(width)}
    </div>
  );
}

/**
 * Project gallery as glass folders. Folders with no documented links are
 * shown honestly — their sheets are not clickable.
 */
export default function Projects() {
  return (
    <section id="projects" className="relative px-6 py-28 md:px-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1.1px, transparent 1.4px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="relative mx-auto w-full max-w-5xl">
        <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Projects</h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Projects are kept in folders. Hover to lift the cover, click to open one — projects
          with a public page link out directly.
        </p>

        <div className="mt-16 grid grid-cols-1 items-end justify-items-center gap-x-14 gap-y-12 md:grid-cols-2">
          {projectFolders.map((folder, index) => (
            <FolderSlot key={folder.id}>
              {(width) => (
                <GlassFolder
                  label={folder.label}
                  art={folder.art}
                  seed={index === 0 ? 3 : 11}
                  appearDelay={index * 160}
                  width={width}
                  projects={folder.projects.map((project) => ({
                    id: project.id,
                    title: project.title,
                    meta: project.meta,
                    art: project.art,
                    href: project.href,
                  }))}
                />
              )}
            </FolderSlot>
          ))}
        </div>
      </div>
    </section>
  );
}
