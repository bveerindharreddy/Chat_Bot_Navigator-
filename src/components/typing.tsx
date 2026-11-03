import { useEffect, useState } from "react";

const PHRASES = ["Grow with AI.", "Automate the Ordinary.", "Turn Conversations into Conversions.", "Build What's Next."];
const LONGEST = PHRASES.reduce((a, b) => (b.length > a.length ? b : a));

export function TypingLine() {
  const [text, setText] = useState<string>(PHRASES[0]!);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) return;
    let i = 0, n = PHRASES[0]!.length, deleting = true, t: ReturnType<typeof setTimeout>;
    const step = () => {
      const p = PHRASES[i]!;
      if (deleting) {
        n--;
        setText(p.slice(0, n));
        if (n === 0) { deleting = false; i = (i + 1) % PHRASES.length; t = setTimeout(step, 350); return; }
        t = setTimeout(step, 32);
      } else {
        const q = PHRASES[i]!;
        n++;
        setText(q.slice(0, n));
        if (n === q.length) { deleting = true; t = setTimeout(step, 1300); return; }
        t = setTimeout(step, 40 + Math.random() * 25);
      }
    };
    t = setTimeout(step, 1300);
    return () => clearTimeout(t);
  }, []);

  return (
    <span className="relative block">
      <span className="sr-only">{PHRASES.join(" ")}</span>
      {/* Reserve space for the longest phrase to prevent layout shift */}
      <span aria-hidden className="invisible block">{LONGEST}</span>
      <span aria-hidden className="absolute inset-0 block text-primary">
        {text}
        {!reduced && <span className="caret ml-0.5 inline-block h-[0.85em] w-[3px] translate-y-[0.08em] bg-primary align-baseline" />}
      </span>
    </span>
  );
}
