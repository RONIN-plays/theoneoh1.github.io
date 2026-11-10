# Nirjhar Mitra — Portfolio

A fast, data-driven static portfolio with a warm-dark editorial design: Instrument Serif display type, Inter body text, JetBrains Mono labels, and a single ember-orange accent. Includes a skills marquee, a bento "about" grid with live local time and count-up stats, a timeline for experience, a spotlight-hover projects grid, and a light theme that follows system preference.

Built with **plain HTML5, CSS3, and Vanilla JavaScript**. Zero build steps, zero node modules (except a CDN link for parsing YAML), and ready to deploy instantly.

🔗 **Live:** [theoneoh1.github.io](https://theoneoh1.github.io/)

---

## Key Features

- **YAML-Driven Content:** All personal data (skills, experience, projects, education, certifications) lives in a single `data/content.yaml`. Update the site without touching HTML or JavaScript.
- **Résumé Preview & Download:** The PDF in `assets/docs/` is previewed in a modal and offered for download from the hero and footer.
- **Dark & Light Modes:** Theme toggle with `localStorage` persistence; defaults to the system preference and bootstraps before first paint (no flash).
- **Responsive & Fast:** Fluid type, bento/grid layouts that collapse cleanly on mobile, and a drawer nav.
- **Subtle Interactions:** Scroll progress bar, active-section nav, reveal-on-scroll, cursor spotlight on cards, count-up stats, live Kolkata clock. Respects `prefers-reduced-motion`.
- **Print Ready:** `@media print` styles for a clean PDF export.

## Getting Started

### 1. Clone

```bash
git clone https://github.com/TheOneOh1/theoneoh1.github.io.git
cd theoneoh1.github.io
```

### 2. Edit Content

Open `data/content.yaml` and update the sections. Notes:

- For icons in the links section, supported values are: `email`, `linkedin`, `github`, `preview` (opens the résumé in a modal), and `download`.
- The first project in `projects:` is shown as the featured card. A project with `url: "#"` is marked "In progress".
- Any experience entry whose `date` contains "Present" gets a highlighted timeline marker.

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
│   │   └── script.js                  # Fetches YAML, renders DOM, handles interactions
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
