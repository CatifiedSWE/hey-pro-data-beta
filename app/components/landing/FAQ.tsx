'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";

export default function FAQ() {
  const spiralRef = useRef<HTMLDivElement | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Spiral configuration - Default set to a subtle brand look
  const [cfg, setCfg] = useState({
    points: 850,
    dotRadius: 1.5,
    duration: 4.0,
    color: "#45B1A8", // Brand Teal
    gradient: "none" as "none" | "ocean" | "grayscale" | "neon",
    pulseEffect: true,
    opacityMin: 0.1,
    opacityMax: 0.4,
    sizeMin: 0.6,
    sizeMax: 1.2,
    background: "#000000",
  });

  const gradients: Record<string, string[]> = useMemo(
    () => ({
      none: [],
      ocean: ["#0066ff", "#00ccff", "#45B1A8"],
      grayscale: ["#ffffff", "#999999", "#333333"],
      neon: ["#ff00ff", "#00ffff", "#ffff00"],
    }),
    []
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "h") setPanelOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Generate spiral SVG
  useEffect(() => {
    if (!spiralRef.current) return;

    const SIZE = 800; 
    const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
    const N = cfg.points;
    const DOT = cfg.dotRadius;
    const CENTER = SIZE / 2;
    const PADDING = 4;
    const MAX_R = CENTER - PADDING - DOT;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${SIZE} ${SIZE}`);
    svg.style.overflow = "visible";

    if (cfg.gradient !== "none") {
      const defs = document.createElementNS(svgNS, "defs");
      const g = document.createElementNS(svgNS, "linearGradient");
      g.setAttribute("id", "faqSpiralGradient");
      g.setAttribute("gradientUnits", "userSpaceOnUse");
      g.setAttribute("x1", "0%");
      g.setAttribute("y1", "0%");
      g.setAttribute("x2", "100%");
      g.setAttribute("y2", "100%");
      gradients[cfg.gradient].forEach((color, idx, arr) => {
        const stop = document.createElementNS(svgNS, "stop");
        stop.setAttribute("offset", `${(idx * 100) / (arr.length - 1)}%`);
        stop.setAttribute("stop-color", color);
        g.appendChild(stop);
      });
      defs.appendChild(g);
      svg.appendChild(defs);
    }

    for (let i = 0; i < N; i++) {
      const idx = i + 0.5;
      const frac = idx / N;
      const r = Math.sqrt(frac) * MAX_R;
      const theta = idx * GOLDEN_ANGLE;
      const x = CENTER + r * Math.cos(theta);
      const y = CENTER + r * Math.sin(theta);

      const c = document.createElementNS(svgNS, "circle");
      c.setAttribute("cx", x.toFixed(3));
      c.setAttribute("cy", y.toFixed(3));
      c.setAttribute("r", String(DOT));
      c.setAttribute("fill", cfg.gradient === "none" ? cfg.color : "url(#faqSpiralGradient)");
      c.setAttribute("opacity", "0.6");

      if (cfg.pulseEffect) {
        const animR = document.createElementNS(svgNS, "animate");
        animR.setAttribute("attributeName", "r");
        animR.setAttribute("values", `${DOT * cfg.sizeMin};${DOT * cfg.sizeMax};${DOT * cfg.sizeMin}`);
        animR.setAttribute("dur", `${cfg.duration}s`);
        animR.setAttribute("begin", `${(frac * cfg.duration).toFixed(3)}s`);
        animR.setAttribute("repeatCount", "indefinite");
        animR.setAttribute("calcMode", "spline");
        animR.setAttribute("keySplines", "0.4 0 0.6 1;0.4 0 0.6 1");
        c.appendChild(animR);

        const animO = document.createElementNS(svgNS, "animate");
        animO.setAttribute("attributeName", "opacity");
        animO.setAttribute("values", `${cfg.opacityMin};${cfg.opacityMax};${cfg.opacityMin}`);
        animO.setAttribute("dur", `${cfg.duration}s`);
        animO.setAttribute("begin", `${(frac * cfg.duration).toFixed(3)}s`);
        animO.setAttribute("repeatCount", "indefinite");
        animO.setAttribute("calcMode", "spline");
        animO.setAttribute("keySplines", "0.4 0 0.6 1;0.4 0 0.6 1");
        c.appendChild(animO);
      }

      svg.appendChild(c);
    }

    spiralRef.current.innerHTML = "";
    spiralRef.current.appendChild(svg);
  }, [cfg, gradients]);

  const faqs = [
    { q: "What does HeyProData do?", a: "HeyProData provides the essential infrastructure for film and media crew in the MENA region, facilitating profiles, credits, and professional networking." },
    { q: "Who is HeyProData for?", a: "It is for professionals in film, media, and events—from DOPs and directors to vendors and production agencies." },
    { q: "Is it free to use HeyProData?", a: "We offer both free base features and premium tools for founding members and power users." },
    { q: "How do I get a profile on HeyProData?", a: "Profiles are currently being rolled out to our 'Insider' and waitlist members first." },
    { q: "What can I do on HeyProData?", a: "Showcase your work, find crew, manage on-set communications, and track your industry credits." },
    { q: "What makes HeyProData different?", a: "Unlike generic sites, we focus specifically on the complex needs of on-set production workflows and specific MENA industry nuances." },
    { q: "Who is behind HeyProData?", a: "A team of industry veterans who understand the pain points of media production management." },
    { q: "How do I get in touch?", a: "You can reach us directly at team@heyprodata.com for inquiries or project requirements." }
  ];

  return (
    <section id="faq-section" className="relative min-h-screen w-full overflow-hidden bg-black pt-24 md:pt-32 pb-0 flex flex-col justify-between">
      {/* Background Spiral */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40 [mask-image:radial-gradient(circle_at_center,rgba(255,255,255,1),rgba(255,255,255,0.1)_60%,transparent_75%)]"
        style={{ mixBlendMode: "screen" }}
      >
        <div ref={spiralRef} className="w-[600px] h-[600px] md:w-[900px] md:h-[900px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 w-full">
        {/* Header */}
        <header className="mb-16 flex flex-col md:flex-row items-start md:items-end justify-between border-b border-white/10 pb-8 gap-6">
          <div>
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase text-white leading-none mb-4">FAQs</h2>
            <p className="text-sm md:text-base text-[#45B1A8] font-bold uppercase tracking-widest">
              Answers for the MENA production network.
            </p>
          </div>
        </header>

        {/* FAQ Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {faqs.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
        </div>
      </div>

      {/* Footer branding - Moved OUTSIDE the max-w-6xl container to span full width */}
      {/* Reduced padding bottom to remove gap */}
      <div className="mt-16 w-full text-center select-none pointer-events-none overflow-hidden pt-12 pb-6">
        <h1 
          className="text-[14vw] font-black uppercase tracking-tighter leading-none moving-gradient-text w-full"
          style={{ transform: 'scaleY(1.35)' }}
        >
          HEYPRODATA
        </h1>
      </div>

      {/* Control Panel (Hidden by default, 'H' to toggle) */}
      {panelOpen && (
        <aside className="fixed right-6 bottom-6 z-50 w-[320px] rounded-3xl border border-white/10 bg-black/80 p-6 backdrop-blur-xl shadow-2xl">
          <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-[#45B1A8]">Background Visuals</h3>
          <div className="space-y-4 text-[10px] text-gray-400 font-bold">
            <Slider label="Density" min={100} max={2000} step={50} value={cfg.points} onChange={(v)=> setCfg({...cfg, points: v})} />
            <Slider label="Pulse Speed" min={1} max={10} step={0.1} value={cfg.duration} onChange={(v)=> setCfg({...cfg, duration: v})} />
            <div className="pt-4 border-t border-white/5 flex gap-2">
              <button
                onClick={() => setPanelOpen(false)}
                className="w-full rounded-xl border border-white/10 px-4 py-2 hover:bg-white/5 transition-colors uppercase tracking-widest"
              >
                Close (H)
              </button>
            </div>
          </div>
        </aside>
      )}
    </section>
  );
}

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 md:p-8 transition-all duration-500 hover:border-[#45B1A8]/30 hover:bg-white/[0.04]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between text-left gap-4"
        aria-expanded={open}
      >
        <div className="flex items-start gap-4">
          <h3 className="text-lg md:text-xl font-bold leading-tight text-white group-hover:text-white transition-colors">
            {q}
          </h3>
        </div>
        <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border border-white/10 flex items-center justify-center transition-all duration-300 ${open ? 'bg-[#45B1A8] border-[#45B1A8] rotate-180' : 'group-hover:border-white/30'}`}>
           <span className="text-white text-lg font-light leading-none mb-0.5">{open ? "–" : "+"}</span>
        </div>
      </button>
      
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(.4,0,.2,1)] ${open ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="text-base text-gray-400 leading-relaxed font-medium">
            {a}
          </p>
        </div>
      </div>

      {/* Subtle hover reveal gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#45B1A8]/5 via-transparent to-[#FF7A8B]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};

const Slider: React.FC<{ label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }> = ({ label, min, max, step, value, onChange }) => {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between">
        <span className="uppercase tracking-widest opacity-60">{label}</span>
        <span className="tabular-nums text-[#45B1A8]">{value.toFixed(0)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#45B1A8] bg-white/10 rounded-lg h-1"
      />
    </label>
  );
}