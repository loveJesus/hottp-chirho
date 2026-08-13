<!-- For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16 (KJV) -->

# HOTTP — Hebrew / Old Testament Textual Pipeline Chirho

A specialized, multi-script digitizing, OCR reconstruction, human-in-the-loop review, and certification pipeline for Dominique Barthélemy's 5-volume text-critical apparatus: *Critique textuelle de l'Ancien Testament* (CAT / CTAT).

---

## 📖 Overview

The **HOTTP** (Hebrew / Old Testament Textual Pipeline) project ingests facsimile pages of Barthélemy's monumental work and reconstructs its complex polyglot text:
* **Biblical Hebrew** (WLC / BHS text, masoretic points, accents, cantillation)
* **Greek** (Septuagint / LXX apparatus)
* **Syriac & Arabic** (Peshitta & Targum witnesses)
* **Latin & Special Symbols** (Text-critical sigla, manuscript witnesses, Fraktur/Gothic fonts)

The system enforces **fail-closed certification gates**, ensuring that no machine-generated text or unverified OCR output is published without explicit, server-authoritative human attestation.

---

## 🏛️ System Architecture

HOTTP operates on a **hybrid split topology** designed for cost efficiency, speed, and absolute data safety:

```mermaid
flowchart TD
    subgraph Cloudflare Edge ["Cloudflare Edge (Reader)"]
        CF_APP["SvelteKit Reader (app-chirho)"]
        D1[("Cloudflare D1 DB")]
        R2[("Cloudflare R2 Storage")]
        CF_APP --> D1
        CF_APP --> R2
    end

    subgraph VPS / Local ["VPS / Local Workstation (Authoring & Review)"]
        LAUNCHPAD["Reviewer Launchpad"]
        CADDY["Caddy Reverse Proxy (TLS + Basic Auth)"]
        
        subgraph Stations ["Bun Review Servers (Bound to 127.0.0.1)"]
            S8766["Port :8766 - Raw Hebrew Live Validator"]
            S8770["Port :8770 - Latin / Symbol Vision Reviewer"]
            S8771["Port :8771 - Expert Non-Latin Reviewer"]
            S8772["Port :8772 - Segment Repair Approval Station"]
        end
        
        DB[("Local Progress SQLite DB (spec-chirho/progress-chirho.sqlite)")]
        PROPOSALS[("Segment Repair Proposals Store")]

        CADDY --> S8766
        CADDY --> S8770
        CADDY --> S8771
        CADDY --> S8772

        S8766 --> DB
        S8770 --> DB
        S8771 --> DB
        S8772 --> DB
        S8772 --> PROPOSALS
    end

    VPS / Local -- "Static Export & Sync" --> Cloudflare Edge
```

1. **Public Reader (`hottp-chirho.bible.systems`)**:
   - Built with **SvelteKit 2** + `@sveltejs/adapter-cloudflare`.
   - Served via Cloudflare Pages, backed by **Cloudflare D1** (`hottp-d1-chirho`) for index-served metadata and **Cloudflare R2** (`hottp-chirho`) for page facsimile and segment crop images.
   - Read-only, highly cached, low-latency reader interface for end users.

2. **Authoring & Human Review Stations**:
   - Powered by lightweight, ultra-fast **Bun** HTTP servers bound strictly to `127.0.0.1`.
   - Authenticated through a reverse proxy (Caddy / Cloudflare Access) with server-authoritative reviewer identity attribution (`Cf-Access-Authenticated-User-Email` / `X-Webauth-User`).
   - Direct port access from external networks is strictly blocked.

---

## 🛠️ Review Stations

The authoring environment provides dedicated browser stations for distinct review lanes:

| Port | Review Station | Source File | Description |
| :--- | :--- | :--- | :--- |
| `:8766` | **Raw Hebrew Live Validator** | `src-chirho/pass-c-human-validate-server-chirho.ts` | Pass-C validation queue for raw Hebrew text, BHS/WLC alignment, and vocalization check. |
| `:8770` | **Latin / Symbol Vision Reviewer** | `src-chirho/latin-symbol-vision-review-server-chirho.ts` | Review queue for Latin apparatus text, sigla, Fraktur glyphs, and special symbols. |
| `:8771` | **Expert Non-Latin Reviewer** | `src-chirho/vision-tier-expert-review-server-chirho.ts` | Expert confirmation for Syriac, Arabic, Greek, and complex manuscript witnesses. |
| `:8772` | **Segment Repair Approval Station** | `src-chirho/segment-repair-approval-server-chirho.ts` | Approval queue for segment geometry proposals (split, merge, rebox). |

---

## 🛡️ Security & Integrity Guarantees

* **Server-Authoritative Attribution**: Client-submitted reviewer headers are ignored on write paths. Stored attribution is populated exclusively by the proxy-authenticated identity. Machine reviewer names are `400 Bad Request` rejected on human approval endpoints.
* **Fail-Closed Certification Gates**: Certification requires passing strict automated guard checks (`bun run check-certification-chirho`). No UI shortcut or API convenience path can bypass certification rules.
* **Atomic Segment Repair & Revert**:
  - Segment repair proposals write a byte-exact backup **FIRST** before modifying spans.
  - Affected validation rows are tombstoned before file mutation.
  - Stale image hashes, tampered before-states, or corrupted tilings are refused (`409 Conflict`).
  - Documented revert CLI (`bun run revert-segment-repair-chirho`) provides a guard-proven, byte-exact restoration path.
* **Store Locking**: Process mutations on proposal stores are guarded by a real `mkdir` file lock (`segment-repair-store-lock-chirho.ts`).
* **Quarantined Database Pull**: The VPS state pull script (`pull-human-review-vps-state-chirho.ts`) downloads remote database snapshots to a quarantined location (`backups-chirho/vps-snapshot-progress-chirho.sqlite`) to protect local agent execution logs (`steps_taken_chirho`) from being overwritten.

---

## 🚀 Getting Started

### Prerequisites

* **Bun** (`>= 1.1.0`)
* **Node.js** (`>= 20`) & `npm`
* System utilities: `rsync`, `pdftotext`, `pdftoppm` (poppler-utils)

### Installation

```bash
# Clone the repository
git clone https://github.com/loveJesus/hottp-chirho.git
cd hottp-chirho

# Install dependencies for the pipeline & authoring tools
bun install

# Install dependencies for the SvelteKit Cloudflare reader app
cd app-chirho
npm install
cd ..
```

---

## 💻 Common Commands

### Review Stations & Launchpad

```bash
# Start all review servers locally (:8766, :8770, :8771, :8772)
bun run review-servers-chirho

# Start individual stations
bun run pass-c-human-validate-chirho      # :8766 (Raw Hebrew)
bun run latin-symbol-vision-review-chirho   # :8770 (Latin/Symbol)
bun run vision-tier-expert-review-chirho   # :8771 (Expert Non-Latin)
bun run segment-repair-approval-chirho    # :8772 (Segment Repair Approval)
```

### Certification & Verification Gates

```bash
# Run the complete certification guard suite
bun run check-certification-chirho

# Check certification status summary
bun run transcription-certification-status-chirho

# Run VPS readiness preflight
bun run check-human-review-vps-readiness-chirho

# Run TypeScript typechecks across certification modules
bun run typecheck-certification-chirho
```

### Preprocessing & Export Pipeline

```bash
# Run full extraction & segmentation pipeline
bun run pipeline-chirho

# Render facsimile pages
bun run render-chirho

# Detect & crop text snippets
bun run detect-chirho
bun run crop-chirho

# Export reconstructed corpus to Markdown
bun run export-markdown-chirho
```

### Reader Web App (`app-chirho`)

```bash
cd app-chirho

# Start local SvelteKit dev server
npm run dev

# Build production bundle for Cloudflare Pages / Workers
npm run build
```

---

## 📂 Project Structure

```text
hottp-chirho/
├── AGENTS.md / CLAUDE.md       # Agent operational guidance and style rules
├── package.json                # Pipeline and guard scripts
├── tsconfig-certification.json # TypeScript configuration for certification modules
├── app-chirho/                 # SvelteKit 2 Cloudflare reader web application
│   ├── src/                    # Components, routes, and D1 database integration
│   └── wrangler.json           # Cloudflare Pages / D1 / R2 configuration
├── backups-chirho/             # Local backup snapshots & quarantined VPS database pulls
├── spec-chirho/                # Project specifications, tasklists, & database
│   ├── progress-chirho.sqlite  # Local SQLite database (tracking, validation, spans)
│   ├── tasklists-chirho/       # Phase goal execution plans and tasklists
│   ├── workflows-chirho/       # Mermaid process workflow diagrams
│   └── reviewer-deployment-chirho/ # VPS deployment templates, Caddyfiles, and runbooks
├── src-chirho/                 # Core Bun/TypeScript pipeline, servers, & guard scripts
│   ├── pass-c-human-validate-server-chirho.ts     # Port 8766 Raw Hebrew server
│   ├── latin-symbol-vision-review-server-chirho.ts# Port 8770 Latin/Symbol server
│   ├── vision-tier-expert-review-server-chirho.ts # Port 8771 Expert server
│   ├── segment-repair-approval-server-chirho.ts   # Port 8772 Segment repair approval
│   ├── segment-repair-apply-chirho.ts             # Fail-closed repair engine
│   └── check-certification-chirho.ts              # Master certification runner
└── workspace-chirho/           # Working assets (facsimiles, crops, scanlines, packets)
```

---

## ✝️ Faith & Attribution

All source files in this repository carry the John 3:16 header and `chirho` identifier suffixing in honor of our Lord Jesus Christ:

> *"For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."* — **John 3:16 (KJV)**

---

## 📜 License

Private repository. All rights reserved.
