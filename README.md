# Nirjhar Mitra — Portfolio

A fast, data-driven static portfolio with a colour-blocked "Kinetic Lab" design: joyful, tactile and heavily animated. The base is cream, with flat tomato, lime, cobalt, sun and blush blocks (no gradients) and ink for text; the page background morphs between section colours as you scroll. Type is Fraunces (variable, with cursor-reactive hero letters), Bricolage Grotesque for UI and body, and Martian Mono for small labels, in light and dark themes.

Built with **plain HTML5, CSS3, and Vanilla JavaScript**. Zero build steps and zero node modules; libraries (GSAP, Lenis, js-yaml) load from CDNs. Deploys instantly.

🔗 **Live:** [theoneoh1.github.io](https://theoneoh1.github.io/)

---

## Key Features

- **YAML-Driven Content:** All personal data (skills, experience, projects, education, certifications, blog posts) lives in a single `data/content.yaml`. Update the site without touching HTML or JavaScript.
- **Kinetic Type:** Fraunces variable (opsz, wght, SOFT, WONK axes) with hero letters that swell and soften near the cursor, Bricolage Grotesque (opsz, wdth, wght) and Martian Mono, all from Google Fonts.
- **Animation:** GSAP 3.13 with ScrollTrigger, SplitText, Draggable, InertiaPlugin and DrawSVGPlugin, plus Lenis smooth scroll synced to ScrollTrigger. Includes an intro colour curtain, springy letter drops, and a scroll-driven background colour morph.
- **Stickers and About:** Draggable, inertia-thrown stickers around the hero; an about statement where key words are highlighted with hand-drawn underlines and circles that draw on scroll (DrawSVG).
- **Marquees:** Opposite-direction marquees whose speed follows scroll velocity.
- **Projects:** Pinned horizontal-scroll colour-blocked posters on desktop (vertical stack on mobile).
- **Experience:** Springy accordion rows with a colour fill on hover and a "Now" chip on current roles.
- **Physics Skill Playground:** Skill chips fall into a box and can be grabbed and thrown. A small custom 2D physics engine in `assets/js/playground.js` (no dependencies), tuned through the `T` object at the top of the file. Chips are laid out statically under reduced motion.
- **Cursor and Interaction:** Blob cursor with contextual labels and magnetic buttons (fine pointers only), live Kolkata clock, scroll progress ring, active-section nav, copy-email button with a toast.
- **Résumé Modal:** The PDF in `assets/docs/` is previewed in a modal and offered for download.
- **Blog Page:** `pages/blog.html` reads `blogs:` from the YAML, with a playful empty state.
- **Light & Dark:** Theme toggle with `localStorage` persistence; defaults to the system preference and bootstraps before first paint.
- **Accessible & Resilient:** Respects `prefers-reduced-motion` (no Lenis, pinning, scrub, physics, cursor or intro), and is progressively enhanced: the page is complete without any CDN animation library.
- **Print Ready:** `@media print` styles for a clean PDF export.

## Getting Started

### 1. Clone

```bash
git clone https://github.com/TheOneOh1/theoneoh1.github.io.git
cd theoneoh1.github.io
```

### 2. Edit Content

Open `data/content.yaml` and update the sections. Notes:

- Link icons supported in the links section: `email`, `linkedin`, `github`, `preview` (opens the résumé in a modal), and `download`.
- Projects without a real `url` (for example `"#"`) render as non-linked posters.
- Any experience entry whose `date` contains "Present" is marked current with a "Now" chip and listed in the about facts.
- Blog posts come from the `blogs:` list; with none, the blog page shows an empty state.

### 3. Update the Résumé

Replace `assets/docs/Nirjhar_Mitra_Resume.pdf` with a new PDF of the same name. If you change the filename, update `resume_url` and the `preview`/`download` link URLs in `content.yaml`.

### 4. Test Locally

The JavaScript fetches `content.yaml`, so the site must be served over HTTP (not opened as `file://`):

```bash
./scripts/manage.sh start
```

*Detects Python or Node and serves on port 8080.*

### 5. Deploy

Push to the `main` branch of a `yourusername.github.io` repository with GitHub Pages enabled for the branch root. No build step or workflow is required.

## File Structure

```
.
├── assets/
│   ├── css/
│   │   └── style.css                  # Design system (tokens, layout, themes, print)
│   ├── js/
│   │   ├── script.js                  # Fetches YAML, renders DOM, animation + interactions
│   │   └── playground.js              # Physics skill playground (custom 2D physics; tune via T)
│   ├── images/
│   │   ├── favicon.ico
│   │   └── og-preview.png             # Social preview card
│   └── docs/
│       └── Nirjhar_Mitra_Resume.pdf   # Résumé (preview + download)
├── data/
│   └── content.yaml                   # ← Start here. The only file to edit for site content
├── pages/
│   └── blog.html                      # Blog page (reads `blogs:` from content.yaml)
├── scripts/
│   └── manage.sh                      # Local dev server helper
├── index.html                         # Page skeleton, meta tags, nav
├── robots.txt
└── sitemap.xml
```
