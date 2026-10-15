import { profile } from "@/data/portfolio";

export default function Footer() {
  return (
    <footer className="border-t border-line/60 px-6 py-8 md:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 font-mono text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>© 2026 {profile.name}</p>
        <p>{profile.location}</p>
      </div>
    </footer>
  );
}
