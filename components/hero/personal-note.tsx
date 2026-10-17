"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, MessageCircle } from "lucide-react";

/**
 * Personal note — authentic Messenger Notes UI attached to the hero portrait.
 * Styled as a floating thought bubble directly above the profile photo with
 * the signature thought trail dots, 60-character limit, and quick emoji support.
 */

const NOTE_KEY = "michael-portfolio:personal-note";
const NOTE_EVENT = "michael-portfolio:note-updated";
const MAX_LENGTH = 60; // Exact Messenger Notes 60-character limit
const DEFAULT_NOTE = "okii 💭";

/** SHA-256 hex digest of the owner-chosen initial passphrase. */
const PASSWORD_DIGEST =
  "70c0fa31563cbae6a41ce47feffbd3f067a0de1d028aca184b348aaafeeabbb6";

type Mode = "closed" | "locked" | "editor";

function readSavedNote(): string {
  try {
    return window.localStorage.getItem(NOTE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeSavedNote(value: string): boolean {
  try {
    window.localStorage.setItem(NOTE_KEY, value);
    window.dispatchEvent(new Event(NOTE_EVENT));
    return true;
  } catch {
    return false;
  }
}

/** Same-tab updates via NOTE_EVENT, cross-tab updates via the storage event. */
function subscribeToNote(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(NOTE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(NOTE_EVENT, callback);
  };
}

async function sha256Hex(text: string): Promise<string | null> {
  try {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(text)
    );
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const QUICK_EMOJIS = ["💭", "✨", "🚀", "💻", "🔥", "☕", "🥺", "🫡"];

export default function PersonalNote() {
  const [mode, setMode] = useState<Mode>("closed");
  const [draft, setDraft] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Saved note comes straight from localStorage (server snapshot: none).
  const rawNote = useSyncExternalStore(
    subscribeToNote,
    () => readSavedNote(),
    () => ""
  );

  const bubbleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setMode("closed");
    setPassword("");
    setError(null);
    setChecking(false);
    setSavedNotice(false);
    setShowPassword(false);
    bubbleRef.current?.focus();
  }, []);

  // Lock background scroll while the dialog is open.
  useEffect(() => {
    if (mode === "closed") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mode]);

  // Move focus into the dialog whenever it (re)opens or switches state.
  useEffect(() => {
    if (mode === "closed") return;
    firstFieldRef.current?.focus();
  }, [mode]);

  const openNote = () => {
    setDraft(rawNote || DEFAULT_NOTE);
    setPassword("");
    setError(null);
    setSavedNotice(false);
    setMode("locked");
  };

  const unlock = async () => {
    if (checking || !password) return;
    setChecking(true);
    setError(null);
    const digest = await sha256Hex(password);
    if (digest === PASSWORD_DIGEST) {
      setPassword("");
      setMode("editor");
    } else {
      setPassword("");
      setError(
        digest === null
          ? "Notes unlock needs a secure (https) connection."
          : "Incorrect password."
      );
    }
    setChecking(false);
  };

  const save = () => {
    if (draft === rawNote) return;
    if (writeSavedNote(draft)) {
      setSavedNotice(true);
      setError(null);
    } else {
      setSavedNotice(false);
      setError("Couldn't save on this device.");
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const items = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE)
    ).filter((el) => el.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const displayNote = rawNote.trim() || DEFAULT_NOTE;

  return (
    <>
      <style>{`
        @keyframes messenger-float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3.5px);
          }
        }
        .animate-messenger-note {
          animation: messenger-float 3.2s ease-in-out infinite;
        }
      `}</style>

      {/* Messenger Note Floating Thought Bubble */}
      <div className="absolute -top-7 right-[-8px] sm:-top-9 sm:right-[-12px] md:-top-11 md:right-[-16px] z-20 pointer-events-auto">
        <button
          ref={bubbleRef}
          type="button"
          onClick={openNote}
          aria-haspopup="dialog"
          aria-expanded={mode !== "closed"}
          aria-label="Messenger note"
          title="Click to view or edit note"
          className="group relative flex flex-col items-start cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 animate-messenger-note"
        >
          {/* Main Bubble */}
          <div className="relative max-w-[145px] sm:max-w-[185px] rounded-[18px] sm:rounded-[20px] border border-white/12 bg-[#25272a]/95 px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-[0_8px_24px_rgba(0,0,0,0.55),0_2px_6px_rgba(0,0,0,0.3)] backdrop-blur-md">
            <p className="font-sans text-[11.5px] sm:text-[13px] font-medium leading-tight text-white/95 text-center break-words select-none">
              {displayNote}
            </p>

            {/* Thought trail - larger connector circle */}
            <div className="absolute -bottom-1.5 left-4 size-2.5 rounded-full border border-white/10 bg-[#25272a] shadow-sm" />

            {/* Thought trail - smaller connector circle */}
            <div className="absolute -bottom-3 left-2.5 size-1.5 rounded-full border border-white/10 bg-[#25272a] shadow-sm" />
          </div>
        </button>
      </div>

      {mode !== "closed" &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            onKeyDown={onKeyDown}
          >
            <div
              className="absolute inset-0 bg-black/75 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150"
              onClick={close}
              aria-hidden="true"
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="personal-note-title"
              className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#1e2022] p-6 shadow-2xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-150"
            >
              {/* Header with Messenger style */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex size-7 items-center justify-center rounded-full bg-brand/15 text-brand">
                  <MessageCircle className="size-4" />
                </div>
                <div>
                  <h2
                    id="personal-note-title"
                    className="text-base font-semibold tracking-tight text-white/95"
                  >
                    Messenger Note
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Thought bubble for your profile avatar
                  </p>
                </div>
              </div>

              {/* Live Note Bubble Preview in Modal */}
              <div className="my-5 flex flex-col items-center justify-center py-3 px-4 rounded-2xl bg-[#141517] border border-white/5">
                <div className="relative mb-3">
                  <div className="relative max-w-[200px] rounded-[18px] border border-white/15 bg-[#25272a] px-3.5 py-2 shadow-lg">
                    <p className="font-sans text-[13px] font-medium leading-snug text-white/95 text-center break-words">
                      {mode === "editor" ? draft || "Share a thought..." : displayNote}
                    </p>
                    <div className="absolute -bottom-1.5 left-4 size-2.5 rounded-full border border-white/10 bg-[#25272a]" />
                    <div className="absolute -bottom-3 left-2.5 size-1.5 rounded-full border border-white/10 bg-[#25272a]" />
                  </div>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  Preview on your profile
                </span>
              </div>

              {mode === "locked" ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    unlock();
                  }}
                >
                  <label
                    htmlFor="personal-note-password"
                    className="mb-1.5 block font-mono text-xs text-muted-foreground"
                  >
                    Enter passcode to edit note
                  </label>
                  <div className="relative">
                    <input
                      ref={(node) => {
                        firstFieldRef.current = node;
                      }}
                      id="personal-note-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="Passcode..."
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      className="w-full rounded-xl border border-white/10 bg-[#121315] py-2.5 pr-11 pl-3 text-sm outline-none placeholder:text-muted-foreground/40 focus-visible:border-brand/60 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-2 my-auto flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {error && (
                    <p role="alert" className="mt-2 text-xs text-destructive">
                      {error}
                    </p>
                  )}
                  <div className="mt-5 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={close}
                      className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={checking || !password}
                      className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      Unlock
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <label
                    htmlFor="personal-note-editor"
                    className="mb-1.5 block font-mono text-xs text-muted-foreground"
                  >
                    Share a thought...
                  </label>
                  <textarea
                    ref={(node) => {
                      firstFieldRef.current = node;
                    }}
                    id="personal-note-editor"
                    value={draft}
                    rows={3}
                    maxLength={MAX_LENGTH}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      setSavedNotice(false);
                    }}
                    placeholder="What's on your mind? (emojis welcome)"
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#121315] p-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/40 focus-visible:border-brand/60 text-white"
                  />

                  {/* Quick emoji tap bar */}
                  <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1">
                    <span className="text-[11px] text-muted-foreground mr-1">Quick:</span>
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          if (draft.length + emoji.length <= MAX_LENGTH) {
                            setDraft((prev) => prev + emoji);
                            setSavedNotice(false);
                          }
                        }}
                        className="rounded-lg bg-white/5 hover:bg-white/10 px-2 py-1 text-xs transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 flex min-h-4 items-center justify-between gap-3">
                    {savedNotice ? (
                      <p role="status" className="text-xs text-emerald-400">
                        Saved — visible on this device.
                      </p>
                    ) : error ? (
                      <p role="alert" className="text-xs text-destructive">
                        {error}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Stays on this device.
                      </p>
                    )}
                    <span className="font-mono text-xs text-muted-foreground">
                      {draft.length}/{MAX_LENGTH}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={close}
                      className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={save}
                      disabled={draft === rawNote}
                      title={draft === rawNote ? "No changes to save" : undefined}
                      className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      Share
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
