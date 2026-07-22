# Modern Dashboard UI Design Patterns — 2025/2026
## Complete Actionable Reference with CSS Code

---

## 1. ANIMATED GLOWING / CONIC GRADIENT BORDERS

**Sources:**
- https://docode.fun/post/animated-border-card-with-conic-gradient-using-pure-css
- https://designdrastic.com/snippet/glowing-gradient-cards/
- https://theosoti.com/blog/animated-gradient-borders/
- https://github.com/mulkatz/glow-card (Web Component, 6 variants, <2KB)

**Implementation — Pure CSS rotating gradient border:**

```css
@property --angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.card {
  position: relative;
  background: #1c1f2b;
  border-radius: 12px;
  z-index: 1;
}

.card::after,
.card::before {
  content: '';
  position: absolute;
  inset: -3px;
  z-index: -1;
  border-radius: inherit;
  background: conic-gradient(
    from var(--angle),
    #ff4545, #00ff99, #006aff, #ff0095, #ff4545
  );
  animation: spin 3s linear infinite;
}

/* Glow layer — blurred for neon effect */
.card::before {
  filter: blur(1.5rem);
  opacity: 0.6;
}

@keyframes spin {
  to { --angle: 360deg; }
}

/* Optional: speed up on hover */
.card:hover::after {
  animation-duration: 1.5s;
}
```

**Color schemes (conic-gradient stops):**
- `#ff4545, #00ff99, #006aff, #ff0095, #ff4545` — Cyberpunk rainbow
- `#6366f1, #8b5cf6, #a855f7, #6366f1` — Indigo/purple (enterprise)
- `transparent 70%, #00d4ff, #7b61ff` — Subtle edge glow
- `#00ccb1, #7b61ff, #1ca0fb, #ff49db` — Teal/coral/pink

**glow-card Web Component** (6 variants, framework-agnostic):
```html
<glow-card variant="border">Content</glow-card>
<!-- variants: border, background, spotlight, rainbow, glow-line, pulse -->
```
```css
glow-card {
  --glow-color: #6366f1;
  --glow-size: 200px;
  --glow-blur: 40px;
  --glow-border-width: 1px;
  --glow-intensity: 1;
  --glow-radius: 12px;
}
```

---

## 2. GLASSMORPHISM 2.0 — "LIQUID GLASS"

**Sources:**
- https://weblogtrips.com/technology/glassmorphism-2-0-css-techniques-2026/
- https://lucky.graphics/learn/liquid-glass-css-glassmorphism-tutorial/
- https://toolboxhubs.com/en/blog/css-glassmorphism-guide
- https://nineproo.com/blog/css-glassmorphism-guide

**The production-grade glass stack (2026):**

```css
.glass-panel {
  /* 1. Translucency */
  background: rgba(255, 255, 255, 0.08);

  /* 2. Refraction — blur + saturation boost */
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);

  /* 3. Edge highlight — simulates light catching the edge */
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-top: 1px solid rgba(255, 255, 255, 0.25);

  /* 4. Inner reflection + shadow lift */
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);

  border-radius: 16px;
}
```

**Dark mode glass:**
```css
[data-theme='dark'] .glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px) saturate(150%) brightness(1.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
```

**Fallback pattern (essential):**
```css
.glass-panel {
  background: rgba(30, 30, 40, 0.95);
}

@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  .glass-panel {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .glass-panel {
    background: rgb(30, 30, 40);
    backdrop-filter: none;
  }
}
```

**Key 2026 improvements over v1:**
- `saturate(180%)` — prevents gray-wash, keeps colors vibrant through glass
- `border-top` with higher opacity — simulates directional light
- Use OKLCH colors instead of sRGB for richer glass tints
- Never animate `backdrop-filter` directly; animate `opacity`/`background` alpha instead
- Limit to 3 concurrent glass panels; blur radii 10-16px for perf
- `will-change: transform; contain: layout style paint;` for GPU compositing

---

## 3. MESH GRADIENTS — "THE SAAS LOOK"

**Sources:**
- https://ultimatedesigntools.com/blog/how-to-create-gradient-mesh/
- https://nineproo.com/blog/mesh-gradients-backgrounds
- https://effect-labs.com/en/pages/blog/patterns-generatifs-css.html
- https://github.com/M4cs/modgrad (React, SSR-safe, 0 deps)
- https://gradient-generator.visualy.at/ (visual generator)

**Pure CSS mesh gradient (no images, no JS):**

```css
.dashboard-bg {
  background-color: #0a0a0f;

  /* Stack 4-6 radial gradients — the "mesh" trick */
  background-image:
    radial-gradient(at 40% 20%,  hsla(260, 80%, 65%, 0.6) 0px, transparent 50%),
    radial-gradient(at 80% 0%,   hsla(190, 80%, 60%, 0.4) 0px, transparent 50%),
    radial-gradient(at 0% 50%,   hsla(320, 80%, 65%, 0.3) 0px, transparent 50%),
    radial-gradient(at 80% 50%,  hsla(160, 80%, 55%, 0.3) 0px, transparent 50%),
    radial-gradient(at 0% 100%,  hsla(260, 80%, 65%, 0.4) 0px, transparent 50%),
    radial-gradient(at 80% 100%, hsla(190, 80%, 60%, 0.3) 0px, transparent 50%);

  /* Blend mode: screen for dark base, multiply for light base */
  background-blend-mode: screen;
}
```

**Animated mesh (slow ambient drift):**
```css
@property --x1 { syntax: '<percentage>'; inherits: false; initial-value: 30%; }
@property --y1 { syntax: '<percentage>'; inherits: false; initial-value: 20%; }
@property --x2 { syntax: '<percentage>'; inherits: false; initial-value: 80%; }
@property --y2 { syntax: '<percentage>'; inherits: false; initial-value: 60%; }

.animated-mesh {
  background-color: #0a0a0f;
  background-image:
    radial-gradient(at var(--x1) var(--y1), hsla(260, 80%, 65%, 0.6), transparent 50%),
    radial-gradient(at var(--x2) var(--y2), hsla(190, 80%, 60%, 0.5), transparent 50%);
  animation: mesh-flow 15s ease-in-out infinite alternate;
}

@keyframes mesh-flow {
  0%   { --x1: 30%; --y1: 20%; --x2: 80%; --y2: 60%; }
  50%  { --x1: 45%; --y1: 35%; --x2: 65%; --y2: 45%; }
  100% { --x1: 25%; --y1: 40%; --x2: 75%; --y2: 30%; }
}
```

**No-JS alternative (background-position animation):**
```css
.mesh-animated {
  background:
    radial-gradient(ellipse 600px 400px at top left,
      hsla(260, 80%, 65%, 0.7), transparent),
    radial-gradient(ellipse 500px 400px at bottom right,
      hsla(190, 80%, 60%, 0.6), transparent),
    #0a0a0f;
  background-size: 200% 200%;
  animation: mesh-drift 12s ease-in-out infinite alternate;
}

@keyframes mesh-drift {
  from { background-position: 0% 0%, 100% 100%; }
  to   { background-position: 40% 30%, 60% 70%; }
}
```

**Add noise texture (SVG, zero JS):**
```css
.mesh-with-noise::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.12;
  mix-blend-mode: overlay;
  pointer-events: none;
}
```

---

## 4. SCROLL-TRIGGERED & SCROLL-DRIVEN ANIMATIONS (Native CSS, No JS)

**Sources:**
- https://developer.chrome.com/blog/scroll-triggered-animations
- https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/
- https://utilitybend.com/blog/css-animation-triggers-playing-animations-on-scroll-without-scrubbing-its-a-match/
- https://www.skillvalix.com/blog/css-animations-micro-interactions-guide

**View-timeline entrance (Chrome 115+, Safari 17.4+):**

```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}

.dashboard-card {
  animation: fade-in-up 0.6s ease-out both;
  animation-timeline: view();
  animation-range: entry 0% entry 30%;
}

/* Stagger cards */
.dashboard-card:nth-child(2) { animation-delay: 0.1s; }
.dashboard-card:nth-child(3) { animation-delay: 0.2s; }
.dashboard-card:nth-child(4) { animation-delay: 0.3s; }
```

**Scroll-triggered (Chrome 145+ — 2026):**
```css
.timeline-trigger {
  timeline-trigger: --card-trigger view();
  trigger-scope: --card-trigger;
}

.animated-element {
  animation: fade-in-up 0.5s ease-out both;
  animation-trigger: --card-trigger play-forwards play-backwards;
}
```

**Reading progress bar (scroll-driven):**
```css
@keyframes fill-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }

.reading-progress {
  position: fixed; top: 0; left: 0;
  height: 3px; background: #6366f1;
  transform-origin: left;
  animation: fill-bar linear both;
  animation-timeline: scroll(root block);
}
```

**Reduced motion guard:**
```css
@media (prefers-reduced-motion: reduce) {
  .dashboard-card {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

---

## 5. MICRO-INTERACTIONS & DASHBOARD ANIMATIONS

**Sources:**
- https://github.com/adyamohanka/EaseMotion-css-adya/tree/main/submissions/examples/admin-dashboard-animation
- https://www.skillvalix.com/blog/css-animations-micro-interactions-guide

**Staggered card entrance (page load):**
```css
@keyframes card-enter {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.stat-card { animation: card-enter 0.4s ease-out both; }
.stat-card:nth-child(1) { animation-delay: 0s; }
.stat-card:nth-child(2) { animation-delay: 0.1s; }
.stat-card:nth-child(3) { animation-delay: 0.2s; }
.stat-card:nth-child(4) { animation-delay: 0.3s; }
```

**Animated bar chart (grow from origin):**
```css
@keyframes bar-fill {
  from { transform: scaleY(0); }
  to   { transform: scaleY(1); }
}

.bar {
  transform-origin: bottom;
  animation: bar-fill 0.6s ease-out both;
}
.bar:nth-child(2) { animation-delay: 0.1s; }
.bar:nth-child(3) { animation-delay: 0.15s; }
```

**Live dot pulse (activity indicator):**
```css
@keyframes dot-pulse {
  0%, 100% { opacity: 1;   transform: scale(1); }
  50%      { opacity: 0.5; transform: scale(0.75); }
}

.live-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #22c55e;
  animation: dot-pulse 2s ease-in-out infinite;
}
```

**Hover lift (cards):**
```css
.dashboard-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
}
```

**Number counter effect (CSS only — brief entrance):**
```css
@keyframes count-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.stat-value {
  animation: count-in 0.5s ease-out both;
}
```

---

## 6. SHIMMER LOADING SKELETONS

**Sources:**
- https://animationpatterns.art/animations/shimmer-gradient-sweep-skeleton/
- https://designdrastic.com/snippet/modern-skeleton-loaders/
- https://github.com/AdanSerrano/ghostly (React/Vue/Svelte, 2KB)
- https://github.com/adyamohanka/EaseMotion-css-adya

**Core shimmer keyframe:**
```css
.shimmer {
  background: linear-gradient(
    110deg,
    #1e293b 8%,
    #334155 18%,
    #1e293b 33%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Dual-layer shimmer (premium feel):**
```css
.shimmer-card {
  position: relative;
  overflow: hidden;
}

/* Slow soft band */
.shimmer-card::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(132deg,
    transparent 16%,
    rgba(148, 163, 184, 0.1) 50%,
    transparent 84%
  );
  background-size: 220% 100%;
  animation: sweep-slow 4s linear infinite;
  pointer-events: none;
}

/* Fast bright band */
.shimmer-card::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(132deg,
    transparent 30%,
    rgba(209, 239, 255, 0.15) 50%,
    transparent 70%
  );
  background-size: 220% 100%;
  animation: sweep-fast 2.5s linear infinite;
  pointer-events: none;
}

@keyframes sweep-slow { from { background-position: -130% 0; } to { background-position: 150% 0; } }
@keyframes sweep-fast { from { background-position: 150% 0; }  to { background-position: -130% 0; } }
```

**Skeleton shapes:**
```css
.sk-text    { height: 14px; border-radius: 7px; width: 100%; }
.sk-title  { height: 22px; border-radius: 6px; width: 70%; }
.sk-avatar { width: 48px; height: 48px; border-radius: 50%; }
.sk-image  { width: 100%; height: 200px; border-radius: 12px; }
.sk-card   { padding: 1.5rem; border-radius: 16px; background: #0f172a; border: 1px solid #1e293b; }
```

---

## 7. NEO-BRUTALISM DASHBOARD

**Sources:**
- https://designsignal.ai/articles/neo-brutalist-dashboard-ui
- https://github.com/homayounmmdy/neo-brutalism-dashboard-template
- https://www.codeinfoweb.com/neo-brutalism-dashboard-html-css/
- https://neubrutalism.com/ (definitive guide)

**Core token system:**
```css
:root {
  --border: 3px solid #000;
  --shadow-sm: 3px 3px 0 0 #000;
  --shadow:   5px 5px 0 0 #000;
  --shadow-lg: 8px 8px 0 0 #000;
  --radius: 0px;
  --bg: #f5f5f5;
  --yellow: #FFD23F;
  --pink: #FF6B6B;
  --blue: #74B9FF;
  --green: #4ADE80;
}
```

**Hard shadow card:**
```css
.stat-card {
  background: #fff;
  border: 3px solid #000;
  box-shadow: 5px 5px 0 0 #000;
  padding: 24px;
  border-radius: 0;
}

.stat-value {
  font-size: 3rem;
  font-weight: 900;
  line-height: 1;
}
```

**Brutalist button:**
```css
.btn {
  border: 3px solid #000;
  border-radius: 0;
  background: #FFD23F;
  color: #000;
  box-shadow: 5px 5px 0 0 #000;
  font-weight: 700;
  padding: 12px 24px;
  cursor: pointer;
  transition: all 0.1s ease;
}

.btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 7px 7px 0 0 #000;
}

.btn:active {
  transform: translate(3px, 3px);
  box-shadow: none;
}
```

---

## 8. 3D TILT CARDS

**Sources:**
- https://alvarotrigo.com/fullPage/tilt-effect/ (generator)
- https://stylosheet.com/interactive-depth-tilt-card/
- https://willphan.com/components/perspective

**CSS-only hover tilt (quadrant zones):**
```css
.tilt-container { perspective: 1000px; }

.tilt-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  transform-style: preserve-3d;
}

/* On hover — tilt */
.tilt-container:hover .tilt-card {
  transform: perspective(1000px) rotateX(10deg) rotateY(10deg) scale(1.05);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

/* Child elements pop forward */
.tilt-card h3 { transition: transform 0.3s ease; }
.tilt-container:hover .tilt-card h3 {
  transform: translateZ(40px);
}
.tilt-container:hover .tilt-card p {
  transform: translateZ(20px);
}
```

**JS mouse-tracked tilt (smooth, 14 lines):**
```js
const card = document.querySelector('.tilt-card');
card.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const rotateY = ((x - rect.width/2) / (rect.width/2)) * 15;
  const rotateX = ((rect.height/2 - y) / (rect.height/2)) * 15;
  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});
card.addEventListener('mouseleave', () => {
  card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
});
```

---

## 9. COMMAND PALETTE (Cmd+K)

**Sources:**
- https://www.saasui.design/blog/7-saas-ui-design-trends-2026
- https://pixelean.com/20-saas-dashboard-design-examples-that-actually-work-2026/

The defining UI pattern of 2026 power tools (Linear, Raycast, Notion, Cursor). Essential for any dashboard with 10+ features.

**CSS for command palette:**
```css
.command-palette {
  position: fixed; top: 20%; left: 50%;
  transform: translateX(-50%);
  width: 640px;
  max-height: 480px;
  background: rgba(30, 30, 40, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  overflow: hidden;
}

.palette-input {
  width: 100%;
  padding: 16px 20px;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 16px;
  outline: none;
}

.palette-item {
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background 0.1s;
}

.palette-item:hover,
.palette-item.active {
  background: rgba(99, 102, 241, 0.2);
}
```

---

## 10. BENTO GRID LAYOUT

**Sources:**
- https://www.adminuiux.com/future-of-admin-dashboard-design/
- https://peterdraw.studio/blog/dashboard-ui-for-saas

The dominant layout architecture for 2026 dashboards. Compartmentalize data into distinct tiles.

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  grid-auto-rows: minmax(120px, auto);
}

.bento-tile {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
}

.bento-tile--wide  { grid-column: span 2; }
.bento-tile--tall  { grid-row: span 2; }
.bento-tile--hero  { grid-column: span 2; grid-row: span 2; }
```

---

## 11. PARTICLE BACKGROUNDS (CSS Only)

**Sources:**
- https://freefrontend.com/css-particle-backgrounds/
- https://gist.github.com/ai-wes/5631edbf9eca9bec34b0942c1af35611

**Pure CSS particle system using box-shadow (no JS):**

```css
@function particles($max) {
  $val: 0px 0px #fff;
  @for $i from 1 through $max {
    $val: #{$val}, #{random(2000)}px #{random(2000)}px #fff;
  }
  @return $val;
}

.particles {
  position: fixed; inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.particle-layer {
  position: absolute; inset: 0;
  width: 1px; height: 1px;
  border-radius: 50%;
  box-shadow: particles(200);
  animation: drift 60s linear infinite;
  opacity: 0.4;
}

@keyframes drift {
  from { transform: translateY(0); }
  to   { transform: translateY(-2000px); }
}
```

---

## 12. FILM GRAIN / NOISE TEXTURE

**Sources:**
- https://effect-labs.com/en/pages/blog/patterns-generatifs-css.html
- https://gradient-generator.visualy.at/

```css
.grain-overlay {
  position: fixed; inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.03;
  mix-blend-mode: overlay;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}
```

---

## 13. COLOR SCHEMES FOR 2026 DASHBOARDS

**Dark theme (2026 standard):**
```css
:root {
  --bg-primary: #0a0a0f;        /* Deep base */
  --bg-secondary: #13131a;      /* Card surfaces */
  --bg-tertiary: #1a1a24;       /* Elevated */
  --text-primary: #f1f1f5;      /* Body text */
  --text-secondary: #7f7f99;    /* Muted */
  --text-tertiary: #525266;     /* Very muted */
  --accent: #6366f1;            /* Primary accent (indigo) */
  --accent-2: #06b6d4;          /* Secondary (cyan) */
  --accent-3: #a855f7;          /* Tertiary (purple) */
  --success: #22c55e;           /* Green */
  --warning: #f59e0b;           /* Amber */
  --danger: #ef4444;            /* Red */
  --border: rgba(255,255,255,0.06);
  --card-bg: rgba(255,255,255,0.04);
}
```

**Neo-brutalist palette:**
```css
:root {
  --bg: #FFFDF5;
  --card: #FFFFFF;
  --yellow: #FFD23F;
  --pink: #FF6B6B;
  --blue: #74B9FF;
  --green: #4ADE80;
  --black: #000000;
  --border: 3px solid #000;
  --shadow: 5px 5px 0 0 #000;
}
```

---

## 14. TOOLS & TEMPLATES (2026)

| Source | URL | What |
|--------|-----|------|
| Horizon UI (free) | https://horizon-ui.com/ | React admin template, 70+ components |
| Tremor | https://tremor.so/ | React dashboard component library, data-first |
| shadcn/ui dashboard | https://ui.shadcn.com/ | Composable, unstyled, own it |
| AdminLTE 4 | https://adminlte.io/ | Bootstrap, enterprise |
| modgrad | https://github.com/M4cs/modgrad | Mesh gradient React component, 0 deps |
| glow-card | https://github.com/mulkatz/glow-card | <2KB glow border Web Component |
| Mesh Gradient Generator | https://gradient-generator.visualy.at/ | Visual, export CSS |
| CSS Glassmorphism Gen | https://toolboxhubs.com/en/blog/css-glassmorphism-guide | Visual generator |
| Neobrutalism components | https://www.neobrutalism.dev/ | shadcn/ui-based brutalist components |
| Webflow dashboards | https://webflow.com/templates/search/admin-dashboard-b170a | Premium templates |
| Framer dashboard templates | https://www.framertemplates.com/ | Framer templates |
| Talos Animated BG | https://talos.tools/generators/animated-background | Free animated bg generator |

---

## 15. IMPLEMENTATION CHECKLIST

- [ ] **Bento grid** with 4-column layout for KPI cards
- [ ] **Glassmorphism 2.0** cards (`backdrop-filter: blur(16px) saturate(180%)`)
- [ ] **Mesh gradient** background (layered radial gradients)
- [ ] **Noise/grain** overlay (SVG feTurbulence, opacity 0.03-0.12)
- [ ] **Glowing borders** on primary KPI cards (`@property` + `conic-gradient`)
- [ ] **Staggered card entrance** (CSS keyframes + nth-child delays)
- [ ] **Scroll-triggered** content reveals (`animation-timeline: view()`)
- [ ] **Shimmer skeletons** while data loads (dual-layer sweep)
- [ ] **Hover tilt** on interactive cards (`perspective` + `rotateX/Y`)
- [ ] **Micro-interactions**: lift on hover, dot pulse, bar grow
- [ ] **Dark mode** as default (CSS variables for full theme swap)
- [ ] **`prefers-reduced-motion`** guard on all animations
- [ ] **Glassy sidebar** with `backdrop-filter`
- [ ] **Sharp typography** (Inter / Space Grotesk for 2026 look)
- [ ] **Accent color** system (OKLCH for consistent luminance)
- [ ] **Command palette** pattern for navigation (Cmd+K)
- [ ] **Film grain** overlay on glass panels for texture realism
