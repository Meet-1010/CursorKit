# CursorKit — Project Brief for Claude Code

## What We're Building

A **cursor-as-a-service platform** where developers paste one script tag into their website and instantly get a world-class custom cursor experience — with hundreds of styles, click effects, trail animations, and color customizations.

**The embed experience:**
```html
<script src="https://cursorkit.io/embed.js?style=magnetic-blob&click=ripple-burst&color=ff00ff&size=1.2"></script>
```

That one line transforms any website's cursor. No npm. No build step. No framework dependency. Works on React, plain HTML, WordPress, Webflow, anything.

---

## Core Product Goals

1. **The Showcase Website** — Browse, preview live, combine styles, generate your embed link
2. **The Embed Script** — Lightweight JS that any site can drop in and works instantly
3. **The Builder UI** — Pick cursor + click effect + color + size → copy your tag
4. **(Later) Chrome/Safari Extension** — Apply any cursor globally to your browser

---

## Cursor Style Philosophy

> Every single cursor style must be **world-class**. Reference from Awwwards Site of the Day winners, Dribbble top shots tagged "cursor animation", "mouse trail", "interactive cursor", and Codrops experiments. No generic shapes. No ugly defaults. Every style should feel like it belongs on a portfolio that could win an Awwwards nomination.

### Research Sources (use these as design inspiration)
- **Awwwards.com** — Filter by Interaction Design category, SOTD winners
- **Dribbble.com** — Search: "cursor animation", "custom cursor web", "mouse trail effect", "cursor interaction"
- **Codrops (tympanus.net)** — Their cursor experiment archive is a goldmine
- **Lusion.co, ActiveTheory.com, Ultranoir.com** — Study how these studios handle cursors

---

## The 1000+ Cursor Styles — Style System Architecture

Do NOT build 1000 random variations. Build a **modular style system** where each component is a genuinely beautiful, hand-crafted piece. The combinations give you scale, but each base style must be premium.

### Cursor Shape Library (target: 80+ distinct shapes)

#### Minimal / Clean (inspired by top portfolio sites)
- `dot-ring` — Small filled dot with larger hollow ring that follows with slight lag
- `dot-ring-thick` — Thicker ring variant with heavier weight
- `magnetic-dot` — Dot that warps and stretches toward interactive elements
- `thin-cross` — Hairline crosshair, surgical precision
- `corner-bracket` — L-shaped bracket corners around cursor point
- `double-ring` — Two concentric rings, inner solid, outer dashed
- `pulse-dot` — Dot that continuously pulses with subtle scale animation
- `hollow-circle` — Just a ring, no fill, minimal
- `inverted-circle` — Inverts colors of whatever is underneath it (mix-blend-mode)
- `text-cursor-beam` — Elegant typographic cursor for reading-heavy sites

#### Geometric (editorial, high-design sites)
- `diamond` — 45° rotated square
- `diamond-outline` — Hollow diamond
- `triangle-point` — Directional triangle
- `hexagon` — Six-sided, clean
- `octagon` — Eight-sided
- `plus-sign` — Clean plus, weight varies
- `asterisk` — Six-point asterisk
- `arrow-minimal` — Extremely thin, refined arrow
- `arrow-bold` — Heavy weight arrow
- `arrow-double` — Bidirectional arrow

#### Fluid / Organic (agency sites, creative studios)
- `blob` — Morphing organic blob shape
- `liquid` — Fluid shape that deforms on movement
- `amoeba` — Irregular organic shape that breathes
- `goo` — Gooey cursor that stretches toward elements
- `water-drop` — Teardrop shape, shifts on direction change
- `ink-drop` — Like a drop of ink that spreads slightly

#### Trail Systems (motion, direction-aware)
- `spring-follow` — Second element follows with spring physics, lag-based
- `elastic-tail` — Stretches behind cursor like elastic band
- `dot-chain` — Series of 5-8 dots following in sequence, each smaller
- `ribbon` — Smooth ribbon/brush stroke trail
- `ink-trail` — Trail that fades like ink drying
- `particle-smoke` — Wispy smoke particles trailing behind
- `particle-sparks` — Electric spark particles
- `particle-stars` — Tiny star shapes trailing
- `particle-bubbles` — Small circles that float upward and pop
- `particle-leaves` — Organic leaf-like particles that drift
- `neon-trail` — Glowing neon light trail, color customizable
- `light-streak` — Speed-based light streak effect
- `snake` — Connected line of dots forming a snake
- `comet` — Single glow point with long fading tail
- `brushstroke` — Thick paintbrush stroke following cursor

#### Tech / Futuristic (saas, AI, tech product sites)
- `scan-ring` — Ring with scanning animation built in
- `radar-ping` — Periodic outward ping ring from center
- `targeting-system` — Multi-ring with crosshair lines
- `hud-bracket` — HUD-style corner brackets
- `data-cursor` — Shows X/Y coordinates next to cursor
- `glitch-cursor` — RGB-shifted glitch effect
- `matrix-rain` — Small falling characters around cursor
- `circuit-trace` — PCB trace lines emanating from point

#### Playful / Expressive
- `emoji-animated` — Animated emoji (multiple variants)
- `hand-pointer` — Stylized illustrated hand
- `magic-wand` — Wand with sparkle tip
- `pencil` — Drawing pencil cursor
- `brush` — Paintbrush cursor
- `sword` — For game-adjacent sites
- `rocket` — Small rocket, direction-aware
- `eye` — Eye that moves to track position
- `ghost` — Friendly ghost that wobbles
- `fire` — Flame cursor with animation

#### Luxury / Editorial (fashion, luxury brand sites)
- `serif-arrow` — Arrow drawn in serif style
- `monogram-ring` — Ring with letter/logo slot
- `gold-foil` — Metallic shimmer cursor
- `thin-line-circle` — Ultra thin, single pixel ring
- `fashion-cross` — Cross shape with ultra-thin strokes
- `editorial-dot` — Oversized filled dot, very minimal

---

### Click Effect Library (target: 60+ distinct effects)

#### Ripple / Wave Family
- `ripple-clean` — Single clean expanding ring
- `ripple-double` — Two rings in sequence
- `ripple-triple` — Three rings, slightly offset timing
- `ripple-fill` — Ripple that fills with color then fades
- `water-splash` — More organic, asymmetric ripple
- `sonar-ping` — Sonar-style outward rings

#### Particle Burst Family
- `spark-burst` — Electric sparks fly outward
- `confetti-pop` — Colorful confetti pieces
- `star-burst` — Stars fly out from click point
- `petal-fall` — Flower petals scatter
- `leaf-scatter` — Leaves drift outward
- `snow-burst` — Snowflakes scatter
- `heart-pop` — Small hearts fly out (great for likes/love interactions)
- `coin-burst` — Coins scatter (e-commerce, gaming)
- `dot-scatter` — Clean minimal dots scatter
- `pixel-burst` — Pixel art style particles

#### Shockwave Family
- `shockwave` — Powerful expanding circle
- `shockwave-fill` — Shockwave that temporarily fills area
- `pressure-wave` — Distorts content around click point
- `blast-ring` — Thick heavy ring expands fast

#### Ink / Paint Family
- `ink-splat` — Ink splatter effect
- `paint-splash` — Paint splash, color-matched
- `brush-stroke-burst` — Brush strokes radiate outward
- `watercolor-bloom` — Watercolor bleeding effect

#### Digital / Tech Family
- `glitch-click` — RGB split glitch on click
- `pixel-dissolve` — Pixels scatter from click point
- `data-scatter` — Characters/numbers scatter
- `scan-line-burst` — Horizontal scan lines expand
- `circuit-spark` — Circuit board trace lines appear

#### Magnetic / Physics Family
- `gravity-pull` — Nearby elements briefly pulled to cursor
- `magnetic-snap` — Click causes snap/attract effect
- `vortex` — Brief swirl/vortex around click
- `implode` — Elements briefly collapse toward click point
- `explode-bounce` — Elements briefly push outward then bounce back

#### Portal / Dimensional
- `portal-open` — Brief portal/wormhole appears
- `black-hole` — Brief gravitational lens effect
- `ripple-dimension` — Dimensional rift ripple
- `time-warp` — Clock/spiral warp animation

#### Minimal / Subtle
- `fade-ring` — Ultra subtle ring that fades immediately
- `dot-pop` — Single dot briefly appears and fades
- `flash` — Brief white flash at click point
- `ghost-click` — Ghost of click position fades
- `breath` — Brief scale breathe of cursor on click

---

### Hover State Transformations (cursor changes on element type)

The cursor should intelligently transform when hovering over:
- `<a>` tags — Expand, change shape, or animate
- `<button>` tags — Magnetic attraction, scale up
- `<img>` tags — Switch to zoom/view variant
- `<input>` tags — Switch to text cursor variant
- `[data-cursor="*"]` — Custom attribute for developer control

---

### Color & Theming System

```
?color=ff00ff          → Primary cursor color (hex, no #)
?color2=00ffff         → Secondary/accent color for trails
?blend=difference      → CSS mix-blend-mode (difference, exclusion, screen, multiply)
?opacity=0.8           → Cursor opacity
?size=1.0              → Size multiplier (0.5 to 3.0)
?speed=1.0             → Animation speed multiplier
?dark=true             → Dark mode optimized variant
```

---

## The Website — Pages & Features

### 1. Home / Hero
- Full-screen cursor playground — visitor's cursor IS the demo
- Category pills: Minimal, Geometric, Trails, Particles, Tech, Playful, Luxury
- "Start exploring" CTA

### 2. Explore / Gallery
- Grid of all cursor styles with live previews on each card hover
- Filter by: Category, Style Type, Click Effect, Color
- Search by name
- Each card: Name, preview animation, "Try it" and "Use this" buttons

### 3. Builder (Core Page)
- **Left panel:** Category browser + style picker
- **Center:** Full live preview canvas — move mouse, click, see exactly what it looks like
- **Right panel:**
  - Click effect picker
  - Color picker (primary + secondary)
  - Size slider
  - Speed slider
  - Blend mode selector
  - Dark/light preview toggle
- **Bottom:** Generated embed code — one script tag, copy button
- **Share button:** Shareable URL with all settings encoded

### 4. Showcase
- Gallery of real websites/demos using CursorKit
- Community submissions

### 5. Docs
- How to install (literally: paste this one line)
- URL param reference
- `data-cursor` attribute docs for per-element control
- Framework-specific guides (React, Next.js, Webflow, etc.)

---

## Technical Architecture

### The Embed Script (`embed.js`)

```
Target size: < 15kb gzipped
Zero dependencies
Vanilla JS + Canvas/SVG hybrid
```

**How it works:**
1. Script loads, reads URL params (style, click, color, size, speed, blend)
2. Hides native cursor via `cursor: none` on `document.body`
3. Creates a Canvas overlay (position fixed, pointer-events none, z-index 99999)
4. Listens to `mousemove` — renders cursor frame by frame via requestAnimationFrame
5. Listens to `mousedown`/`mouseup` — fires click animation
6. Listens to `mouseover` on interactive elements — fires hover transform
7. Handles `mouseenter`/`mouseleave` on document for cursor visibility

**Performance requirements:**
- Must not block main thread
- requestAnimationFrame only — never setInterval
- Canvas operations batched per frame
- Lazy-load cursor sprite sheets
- Mobile: auto-disable (touch devices don't have cursors)

### URL Schema

```
https://cursorkit.io/embed.js
  ?style=magnetic-blob        ← cursor shape ID
  &click=ripple-burst         ← click effect ID  
  &hover=scale-expand         ← hover transform ID
  &color=ff00ff               ← primary color (hex)
  &color2=7700ff              ← secondary color
  &size=1.2                   ← size multiplier
  &speed=0.9                  ← animation speed
  &blend=difference           ← mix-blend-mode
  &dark=false                 ← dark mode variant
```

### Tech Stack

**Website:**
- Next.js 14 (App Router)
- Tailwind CSS
- Framer Motion for page animations
- Canvas API for cursor preview

**Embed Script:**
- Vanilla JS (TypeScript compiled)
- Canvas 2D API
- Web Animations API where supported
- Zero runtime dependencies

**Backend (minimal for now):**
- Edge functions for serving `embed.js` with correct cache headers
- CDN-first: Cloudflare or Vercel Edge Network

---

## Build Order (Phased)

### Phase 1 — Working MVP
- [ ] Build 30 cursor styles (the absolute best ones from research)
- [ ] Build 20 click effects
- [ ] Build `embed.js` core engine (Canvas-based)
- [ ] Build basic website with live preview
- [ ] Builder page with embed code generator
- [ ] Deploy embed script to CDN

### Phase 2 — Scale
- [ ] Expand to 100+ cursor styles
- [ ] Add hover state transforms
- [ ] Add color/size/speed customization
- [ ] Add shareable builder URLs
- [ ] Docs page

### Phase 3 — Platform
- [ ] Expand to 1000+ styles (using modular system)
- [ ] Community showcase
- [ ] Chrome extension
- [ ] Safari extension
- [ ] Analytics dashboard (opt-in, for cursor interaction data)

---

## Design Direction for the Website Itself

> The website's own cursor should be the most impressive demo of what the product can do. First-time visitors should feel "I need this immediately" within 3 seconds.

- **Dark background** — cursors show best against dark
- **Minimal chrome** — the cursor IS the hero
- **High contrast** — colors pop
- **Typography:** Clean sans-serif, let the cursor animations breathe
- **No carousels, no stock photos** — just cursor demos everywhere
- **Every interactive element on the site should have a thoughtful cursor interaction**

---

## Competitive Differentiation

| Feature | CursorKit | cursor.js | custom-cursor.io |
|---|---|---|---|
| One script tag embed | ✅ | ❌ npm only | ❌ |
| Live preview builder | ✅ | ❌ | Partial |
| 1000+ styles | ✅ | ~10 | ~30 |
| Click effects | ✅ | ❌ | Partial |
| Hover transforms | ✅ | ❌ | ❌ |
| Zero dependencies | ✅ | ✅ | ❌ |
| Shareable config URL | ✅ | ❌ | ❌ |
| Browser extension | ✅ (planned) | ❌ | ❌ |

---

## Notes for Claude Code

- Prioritize the **embed script quality** above all else — it is the core product
- Every cursor animation must run at **60fps minimum** — test on mid-range hardware
- The embed script should be **< 15kb gzipped** in Phase 1
- All cursor styles should feel like they were designed by a **world-class motion designer**, not generated randomly
- Study these sites before designing any cursor: lusion.co, activetheory.com, ultranoir.com, resn.co.nz, illo.tv
- The Canvas-based approach is preferred over DOM-based for performance at scale
- Build the cursor engine as a **plugin architecture** so new styles can be added as modules without touching core
