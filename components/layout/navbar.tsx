"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValueEvent,
  useScroll,
  type Variants,
} from "framer-motion";
import { Menu, X } from "lucide-react";

import { RandomLetterSwap } from "@/components/ui/random-letter-swap";
import { profile } from "@/data/portfolio";
import { cn } from "@/lib/utils";

const links = [
  { href: "#about", id: "about", label: "About" },
  { href: "#education", id: "education", label: "Education" },
  { href: "#projects", id: "projects", label: "Projects" },
  { href: "#experience", id: "experience", label: "Experience" },
  { href: "#contact", id: "contact", label: "Contact" },
];

const COLLAPSE_AT = 150;
const EXPAND_DELTA = 80;
const SPY_LINE = 0.35;
const SPY_DEADZONE = 32;
const DESKTOP_QUERY = "(min-width: 768px)";

const containerVariants: Variants = {
  expanded: {
    width: "auto",
    transition: { type: "spring", damping: 22, stiffness: 280 },
  },
  collapsed: {
    width: "3rem",
    transition: { type: "spring", damping: 24, stiffness: 320 },
  },
};

const listVariants: Variants = {
  expanded: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.22, ease: "easeOut", delay: 0.08 },
  },
  collapsed: {
    opacity: 0,
    x: -10,
    transition: { duration: 0.14, ease: "easeIn" },
  },
};

const indicatorTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
} as const;

/**
 * Floating capsule navigation.
 * - Desktop (md+): full capsule with the section links; scrolls down past
 *   `COLLAPSE_AT` into a compact hamburger circle, scrolls back up (or returns
 *   to the top) into the expanded capsule.
 * - Mobile: the capsule stays a hamburger circle; tapping opens a floating
 *   panel, scrolling down dismisses it.
 * - The active section drives a shared `layoutId` "tubelight" indicator that
 *   springs between links, kept flicker-free by a scroll-spy dead zone.
 */
export default function Navbar() {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  // Null until mounted so SSR and the first client render always agree.
  const [desktop, setDesktop] = useState<boolean | null>(null);

  const activeRef = useRef<string | null>(null);
  const lastY = useRef(0);
  const collapsedAtY = useRef(0);
  const focusFirstLink = useRef(false);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  // Mirror state for the scroll handler: scroll events can arrive before
  // React commits the previous state change, so the decision must never read
  // possibly-stale state from the closure.
  const collapsedRef = useRef(false);
  const menuOpenRef = useRef(false);

  const { scrollY } = useScroll();

  const setCollapsedSync = useCallback((value: boolean) => {
    collapsedRef.current = value;
    setCollapsed(value);
  }, []);

  const setMenuOpenSync = useCallback(
    (value: boolean | ((v: boolean) => boolean)) => {
      menuOpenRef.current =
        typeof value === "function" ? value(menuOpenRef.current) : value;
      setMenuOpen(value);
    },
    [],
  );

  const setActiveSection = useCallback((id: string | null) => {
    if (activeRef.current === id) return;
    activeRef.current = id;
    setActive(id);
  }, []);

  // Scroll spy: the active section is the last one whose top passed the
  // viewport line. A dead zone around the boundary stops scroll jitter from
  // flickering the indicator between neighbouring sections.
  const spy = useCallback(() => {
    const line = window.innerHeight * SPY_LINE;
    let candidate: string | null = null;
    let candidateIdx = -1;
    for (let i = 0; i < links.length; i++) {
      const el = document.getElementById(links[i].id);
      if (el && el.getBoundingClientRect().top <= line) {
        candidate = links[i].id;
        candidateIdx = i;
      }
    }
    const currentIdx = activeRef.current
      ? links.findIndex((l) => l.id === activeRef.current)
      : -1;
    if (candidateIdx !== currentIdx) {
      const boundaryIdx = Math.max(candidateIdx, currentIdx);
      const boundary =
        boundaryIdx >= 0
          ? document.getElementById(links[boundaryIdx].id)
          : null;
      if (boundary) {
        const top = boundary.getBoundingClientRect().top;
        const entering = candidateIdx > currentIdx;
        if (entering ? top > line - SPY_DEADZONE : top < line + SPY_DEADZONE) {
          return; // inside the dead zone — keep the current section
        }
      }
    }
    setActiveSection(candidate);
  }, [setActiveSection]);

  useEffect(() => {
    spy();
    const onResize = () => spy();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [spy]);

  // Breakpoint tracking; also restores sane state when crossing breakpoints.
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const read = () => {
      setDesktop(mq.matches);
      setMenuOpenSync(false);
      if (!mq.matches) setCollapsedSync(false);
      else if (window.scrollY > COLLAPSE_AT) setCollapsedSync(true);
      spy();
    };
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, [spy, setCollapsedSync, setMenuOpenSync]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpenSync(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, setMenuOpenSync]);

  // Move focus to the first link when the menu was expanded via the button,
  // since the button unmounts.
  useEffect(() => {
    if (!collapsed && focusFirstLink.current && firstLinkRef.current) {
      focusFirstLink.current = false;
      firstLinkRef.current.focus();
    }
  }, [collapsed]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    spy();
    const previous = lastY.current;
    if (window.matchMedia(DESKTOP_QUERY).matches) {
      if (!collapsedRef.current && latest > previous && latest > COLLAPSE_AT) {
        collapsedAtY.current = latest;
        setCollapsedSync(true);
      } else if (
        collapsedRef.current &&
        (latest <= COLLAPSE_AT ||
          (latest < previous && collapsedAtY.current - latest > EXPAND_DELTA))
      ) {
        setCollapsedSync(false);
      }
    } else if (
      menuOpenRef.current &&
      latest > previous &&
      latest > COLLAPSE_AT
    ) {
      setMenuOpenSync(false);
    }
    lastY.current = latest;
  });

  const capsuleExpanded = desktop !== false && !collapsed;
  const isMobile = desktop === false;
  const showMenuIcon = isMobile ? !menuOpen : collapsed;
  const showCloseIcon = isMobile && menuOpen;

  const selectSection = (id: string) => {
    activeRef.current = id;
    setActive(id);
  };

  return (
    <MotionConfig reducedMotion="user">
      {/* No transform on this layer: transformed ancestors become the
          containing block for fixed children (the backdrop must cover the
          viewport). Centering is done with flex instead. */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center">
        <AnimatePresence>
          {menuOpen && isMobile && (
            <motion.div
              key="nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpenSync(false)}
              className="pointer-events-auto fixed inset-0 z-0 bg-black/40 md:hidden"
            />
          )}
        </AnimatePresence>
        <div className="pointer-events-auto relative z-10">
          <motion.nav
            id="site-nav"
            aria-label="Sections"
            initial={false}
            animate={capsuleExpanded ? "expanded" : "collapsed"}
            variants={containerVariants}
            className={cn(
              "relative z-20 flex h-12 min-w-12 items-center justify-center overflow-hidden rounded-full border border-line/60 bg-background/80 shadow-lg shadow-black/30 backdrop-blur-md",
              (collapsed || isMobile) &&
                "transition-transform hover:scale-105 active:scale-95",
            )}
          >
            {/* Expanded capsule contents — desktop only, fully removed from
              interaction while collapsed via `inert`. */}
            <motion.div
              variants={listVariants}
              inert={!capsuleExpanded}
              className={cn(
                "hidden items-center gap-1 pr-1.5 pl-1.5 md:flex",
                !capsuleExpanded && "pointer-events-none",
              )}
            >
              <a
                href="#top"
                onClick={() => setActiveSection(null)}
                className="hidden pr-3 text-sm font-medium tracking-tight text-foreground transition-colors hover:text-brand lg:block"
              >
                {profile.name}
              </a>
              <span
                aria-hidden="true"
                className="mr-2 hidden h-4 w-px bg-line lg:block"
              />
              <ul className="flex items-center gap-1">
                {links.map((link, i) => {
                  const isActive = active === link.id;
                  return (
                    <li key={link.href}>
                      <a
                        ref={i === 0 ? firstLinkRef : undefined}
                        href={link.href}
                        onClick={() => selectSection(link.id)}
                        className={cn(
                          "relative block rounded-full px-3.5 py-1.5 text-sm transition-colors",
                          isActive
                            ? "text-brand"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="nav-indicator"
                            transition={indicatorTransition}
                            initial={false}
                            className="pointer-events-none absolute inset-0 rounded-full bg-brand/10"
                          >
                            <span
                              aria-hidden="true"
                              className="absolute inset-x-3 bottom-0 h-px bg-brand/90"
                            />
                            <span
                              aria-hidden="true"
                              className="absolute inset-x-1.5 bottom-0 h-1 rounded-full bg-brand/30 blur-[3px]"
                            />
                          </motion.span>
                        )}
                        <RandomLetterSwap label={link.label} />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </motion.div>

            {/* Collapsed-state icons */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            >
              <motion.span
                animate={{
                  opacity: showMenuIcon ? 1 : 0,
                  scale: showMenuIcon ? 1 : 0.75,
                }}
                transition={{ duration: 0.18 }}
                className="absolute"
              >
                <Menu className="h-5 w-5 text-foreground" />
              </motion.span>
              <motion.span
                animate={{
                  opacity: showCloseIcon ? 1 : 0,
                  scale: showCloseIcon ? 1 : 0.75,
                }}
                transition={{ duration: 0.18 }}
                className="absolute"
              >
                <X className="h-5 w-5 text-foreground" />
              </motion.span>
            </div>
          </motion.nav>

          {(isMobile || collapsed) && (
            <button
              type="button"
              className="absolute inset-0 z-30 rounded-full"
              aria-label={
                isMobile
                  ? menuOpen
                    ? "Close menu"
                    : "Open menu"
                  : "Expand navigation"
              }
              aria-expanded={isMobile ? menuOpen : false}
              aria-controls={isMobile ? "mobile-nav" : "site-nav"}
              onClick={
                isMobile
                  ? () => setMenuOpenSync((v) => !v)
                  : () => {
                      focusFirstLink.current = true;
                      setCollapsedSync(false);
                    }
              }
            />
          )}

          <AnimatePresence>
            {menuOpen && isMobile && (
              <motion.div
                key="mobile-panel"
                id="mobile-nav"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="absolute top-14 left-1/2 z-30 w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl border border-line/60 bg-background/95 p-2 shadow-xl shadow-black/40 backdrop-blur-md md:hidden"
              >
                <a
                  href="#top"
                  onClick={() => {
                    setActiveSection(null);
                    setMenuOpenSync(false);
                  }}
                  className="block rounded-xl px-4 py-3 text-sm font-medium tracking-tight text-foreground transition-colors hover:text-brand"
                >
                  {profile.name}
                </a>
                <div aria-hidden="true" className="mx-4 my-1 h-px bg-line" />
                <ul>
                  {links.map((link) => {
                    const isActive = active === link.id;
                    return (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          onClick={() => {
                            selectSection(link.id);
                            setMenuOpenSync(false);
                          }}
                          className={cn(
                            "relative block rounded-xl px-4 py-3 text-sm transition-colors",
                            isActive
                              ? "text-brand"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="nav-indicator-mobile"
                              transition={indicatorTransition}
                              initial={false}
                              className="pointer-events-none absolute inset-1 rounded-lg bg-brand/10"
                            >
                              <span
                                aria-hidden="true"
                                className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-brand/90"
                              />
                              <span
                                aria-hidden="true"
                                className="absolute inset-y-1 left-0 w-1.5 rounded-full bg-brand/30 blur-[3px]"
                              />
                            </motion.span>
                          )}
                          <RandomLetterSwap label={link.label} />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}
