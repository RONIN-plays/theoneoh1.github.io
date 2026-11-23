# Nirjhar Mitra — Portfolio

A fast, data-driven static portfolio with a "telemetry sheet" design: Swiss-editorial layout meets aerospace spec sheet. Type is Archivo (variable width, condensed for display) with IBM Plex Mono for labels and indices; the palette is bone paper and ink with a single international-orange accent, in light and dark themes. The hero is a WebGL LiDAR terrain point cloud.

Built with **plain HTML5, CSS3, and Vanilla JavaScript**. Zero build steps and zero node modules; libraries (GSAP, Lenis, Three.js, js-yaml) load from CDNs. Deploys instantly.

🔗 **Live:** [theoneoh1.github.io](https://theoneoh1.github.io/)

---

## Key Features

- **YAML-Driven Content:** All personal data (skills, experience, projects, education, certifications, blog posts) lives in a single `data/content.yaml`. Update the site without touching HTML or JavaScript.
- **WebGL LiDAR Hero:** A point-cloud terrain scan (Three.js 0.160) in `assets/js/hero-gl.js`, tuned through the `CFG` object at the top of the file. Static single frame under reduced motion; falls back gracefully when WebGL or the CDN is unavailable.
- **Animation:** GSAP 3.13 + ScrollTrigger + SplitText, with Lenis smooth scroll synced to ScrollTrigger.
- **Sections:** Preloader, word-scrub about statement, project index with a cursor-following preview panel, experience ledger, velocity-reactive skills marquee, education and certifications, and a blog page.
- **Cursor and Interaction:** Custom cursor and magnetic CTAs (desktop only), live Kolkata clock, scroll progress, active-section nav.
- **Résumé Modal:** The PDF in `assets/docs/` is previewed in a modal and offered for download.
- **Light & Dark:** Theme toggle with `localStorage` persistence; defaults to the system preference and bootstraps before first paint.
- **Accessible & Resilient:** Respects `prefers-reduced-motion` (no Lenis, scrub, or preloader delay), and is progressively enhanced: the page is complete without any CDN animation library.
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
- Projects without a real `url` (for example `"#"`) render as non-linked rows.
- Any experience entry whose `date` contains "Present" is marked current in the ledger with an orange status dot and listed in the about facts.
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
│   │   └── hero-gl.js                 # WebGL LiDAR point-cloud hero (Three.js; tune via CFG)
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
