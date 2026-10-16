"use client";

import { useState } from "react";

const links = [
  { href: "#about", label: "About" },
  { href: "#education", label: "Education" },
  { href: "#projects", label: "Projects" },
  { href: "#experience", label: "Experience" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/60 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 md:px-10">
        <a
          href="#top"
          className="py-2 text-sm font-medium tracking-tight text-foreground transition-colors hover:text-brand"
          onClick={() => setOpen(false)}
        >
          Michael Jhosh T. Abundabar
        </a>

        <nav aria-label="Sections" className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
        >
          <span
            className={
              "h-px w-5 bg-foreground transition-transform duration-200 " +
              (open ? "translate-y-[3.5px] rotate-45" : "")
            }
          />
          <span
            className={
              "h-px w-5 bg-foreground transition-transform duration-200 " +
              (open ? "-translate-y-[3.5px] -rotate-45" : "")
            }
          />
        </button>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Sections"
        className={
          "overflow-hidden border-line/60 bg-surface transition-[max-height] duration-300 md:hidden " +
          (open ? "max-h-72 border-b" : "max-h-0")
        }
      >
        <div className="flex flex-col px-6 py-2">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
