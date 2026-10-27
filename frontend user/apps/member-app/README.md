# Sanchay Member Application & Public Landing Platform
**Offline-First Community Savings-Group Passbook & Ledger**

Sanchay is an accessible, offline-first progressive web application engineered for self-help group (SHG / Bachat Gat) members in rural India. It pairs an append-only digital passbook, transparent loan management, offline digital receipt generation, real-time amortization schedules, and **100% on-device client-side Aadhaar card registration** with a high-performance public landing page.

---

## 1. Design System & Theme: Light Blue & Responsive Web Layout

- **Color Palette (Light Blue)**:
  - **Primary Brand Blue**: `#0284C7` (Sky / Cerulean 600) — trustworthy, accessible, vibrant.
  - **Hover / Active Blue**: `#0369A1` (Sky 700).
  - **Soft Blue Tints**: `#E0F2FE` (Sky 100), `#F0F9FF` (Sky 50), Border `#BAE6FD` (Sky 200).
  - **Background**: `#F8FAFC` (Slate 50 clean surface).
  - **Deep Ink Text**: `#0F172A` (Slate 900) for sharp readability under bright sunlight.
  - **Muted Text**: `#475569` (Slate 600) and `#94A3B8` (Slate 400).
  - **Status Accents**: Green (`#16A34A` / `#DCFCE7`), Amber (`#D97706` / `#FEF3C7`), Error (`#DC2626` / `#FEE2E2`).
- **Responsive Layout**:
  - The application has evolved beyond a fixed mobile container shell into a responsive desktop web layout.
  - **Desktop Web Shell**: Top navigation bar with branding, desktop nav links, language selector dropdown, status badges, and expansive content grid (`max-w-7xl mx-auto`).
  - **Mobile Shell**: Retains thumb-friendly bottom navigation bar (`md:hidden`), sticky CTA bars, and accessible touch targets ($\ge 48\text{px}$).

---

## 2. Public Landing Page (`/`)

The public landing page is lazy-loaded at route `"/"` to guarantee optimal initial load performance. It presents 12 curated sections in exact narrative order:

1. **Header / Navbar (`LandingHeader.tsx`)**: Sticky header, logo, anchor links, 3-language switcher dropdown (`en`, `hi`, `mr`), "Open Sanchay" CTA, mobile drawer, and mobile bottom CTA.
2. **Hero Section (`HeroSection.tsx`)**:
   - Headline: *"Every rupee, remembered."*
   - Subline: Plain-language pitch for India's 8 crore SHG women.
   - Primary and secondary CTAs ("Get started free", "See how it works").
   - Live Indian-numeral statistics counters powered by `requestAnimationFrame`.
   - **Hero Illustration (`HeroIllustration.tsx`)**: Custom SVG circle of 8 figures around a shared pot with arcing rupee coins, pulse ripples, and live Indian digit counter.
3. **The Problem ("The notebook problem") (`ProblemSection.tsx`)**:
   - Highlights the 3 harsh realities: 1) Rain, pests & physical damage, 2) Zero network connectivity during meetings, 3) Arithmetic doubt and friction between members.
4. **How It Works (`HowItWorksSticky.tsx`)**:
   - 3-step narrative: 1) Record offline at weekly meetings, 2) Auto-sync when signal appears, 3) Transparent append-only conflict resolution with interactive phone screen preview.
5. **Interactive Demo Showpiece (`InteractiveDemo.tsx`)**:
   - Client-side interactive sandbox with an **Offline/Online toggle**, live ₹500 deposit button, and deterministic receipt generation.
   - **Conflict Simulation**: Demonstrates what happens when two phones record different entries offline, resolving via Rule 3 with transparent reversal entries (`REVERSAL_DUPLICATE_OFFLINE_RECORD`).
6. **Features Grid (`FeaturesGrid.tsx`)**:
   - 6 responsive feature cards highlighting zero-data operation, cryptographic receipts, battery-conscious design, instant export, and local privacy.
7. **Role Views (`RoleTabsSection.tsx`)**:
   - Accessible tab toggle comparing *"For SHG Admins & Leaders"* vs *"For Individual Members"*.
8. **Privacy & Trust (`PrivacyTrustSection.tsx`)**:
   - Dark slate section highlighting non-negotiable promises: on-device OCR, masked storage, zero vendor lock-in, and zero analytics tracking.
9. **Language Marquee (`LanguageMarquee.tsx`)**:
   - Infinite CSS ticker of *"English · हिन्दी · मराठी"* with automatic pause on hover and focus.
10. **Honest FAQ (`FaqAccordion.tsx`)**:
    - 6 plain-language questions and answers with accessible keyboard-driven accordions.
11. **Final CTA (`FinalCtaSection.tsx`)**:
    - Warm, high-contrast action card with immediate PWA installation prompt trigger.
12. **Footer (`LandingFooter.tsx`)**:
    - Navigation anchors, language switcher, copyright, and explicit attribution to Hackathon Problem Statement 12 (Resilient Community Finance).

---

## 3. Animation Inventory & Performance Budget

### Animation Strategy
- **Transform & Opacity Only**: All keyframes and transitions animate strictly `transform` and `opacity` (plus SVG `stroke-dashoffset`) to remain off the browser main thread and eliminate layout thrashing.
- **Scroll Reveals**: Handled via `IntersectionObserver` in `Reveal.tsx` with a 24px translate and 600ms ease-out curve.
- **Counters**: Animated with `requestAnimationFrame` and Indian locale formatting (`en-IN`, e.g. `₹1,25,000`).
- **Reduced Motion Support**: All animations include `@media (prefers-reduced-motion: reduce)` fallbacks that reduce duration to `0.01ms`.
- **Visibility Detection**: Animations pause automatically when the tab is hidden via `document.visibilityState`.

### Performance Budget vs Actuals
| Metric | Budget Target | Actual Measurement | Status |
| :--- | :--- | :--- | :--- |
| **Landing Bundle (gzip)** | $< 150\text{ KB}$ | **$15.57\text{ KB}$** (`LandingView.js`) | Passed |
| **Total JS Bundle (gzip)** | $< 350\text{ KB}$ | **$85.48\text{ KB}$** (`index.js`) | Passed |
| **Total CSS (gzip)** | $< 25\text{ KB}$ | **$8.60\text{ KB}$** (`index.css`) | Passed |
| **Largest Contentful Paint (LCP)** | $< 2.5\text{s}$ | **$\approx 1.2\text{s}$** (Local HTTP) | Passed |
| **Cumulative Layout Shift (CLS)** | $< 0.1$ | **$0.00$** | Passed |

---

## 4. Internationalization (i18n)

- **Languages Supported**:
  - `en`: English
  - `hi`: हिन्दी (Hindi)
  - `mr`: मराठी (Marathi)
- **Review Status**:
  > [!NOTE]
  > **Translation Review Note**: While English translations are verified, **Hindi and Marathi translations need native-speaker review** for rural dialect nuances (e.g., standard terms like *Bachat Gat*, *Kisht*, *Pavati*, *Radd Nond*).

---

## 5. Core Principles & Ledger Invariants

1. **Member-Only Experience**:
   - Zero admin screens or administrative functions in the member view. Members only see verified outcomes of group meetings and committee approvals.
2. **Strict Integer Paise**:
   - All financial math is computed strictly in integer paise ($1\text{ INR} = 100\text{ paise}$).
   - Formatted to standard Indian rupee representations purely at the presentation layer.
3. **Append-Only Ledger & Reversals**:
   - Ledger entries are never updated or deleted.
   - Accounting errors are corrected through an explicit reversal entry (`type: "reversal"`, `reversesId`, `reason`) followed by a replacement entry.
4. **Strict On-Device Privacy & Zero-PII**:
   - The member's card photo is **never uploaded**, never saved to storage, and never logged.
   - EXIF/location metadata is stripped immediately by redrawing onto an offscreen canvas.
   - Displayed strictly as masked `XXXX-XXXX-1234`.
5. **Offline-First PWA**:
   - Pre-caches all app shell assets, fonts, icons, and logo.

---

## 6. Route Map

| Path | Screen | Key Functionality |
| :--- | :--- | :--- |
| `/` | **Landing Page** | 12-section public marketing page with interactive offline demo and PWA install CTA. |
| `/login` | **Login** | Locked `+91` phone input, 6-digit mock OTP with "Fill Test Code (123456)" shortcut. |
| `/register` | **Registration / Approval** | On-device Aadhaar OCR flow, privacy pledge, Verhoeff validator, and "Waiting for admin approval" state card. |
| `/dashboard` (`/app`) | **Dashboard** | Namaste greeting, personal savings balance, monthly status chip, active loan teaser, recent transactions, quick actions. |
| `/transactions` | **Passbook Ledger** | Read-only ledger with filter tabs (All, Contributions, Loans) and 3-entry correction chain rendering. |
| `/receipts` | **Receipts Archive** | Searchable digital receipts list with "APPROVED" / "Pending sync" status stamps. |
| `/receipts/:receiptId` | **Receipt Detail** | Formal digital receipt view with offline "Download PDF Receipt" action. |
| `/loans` | **My Loans** | Active loan progress bar, 6-month amortized EMI table, and pending request tracker. |
| `/loans/apply` | **Apply for Loan** | Real-time eligibility checklist (`isEligibleForLoan`), borrow amount slider capped by 3x limit, live schedule preview (`generateSchedule`). |
| `/alerts` | **Alerts** | Segmented tabs for Group Announcements and Personal Notifications with unread badge counter. |
| `/profile` | **Profile** | Member card with initials avatar, masked Aadhaar (`XXXX-XXXX-1234`), language switcher, sync diagnostics, and PWA install prompt. |

---

## 7. Running & Testing

```powershell
# From the workspace root:
npm run dev               # Starts member-app dev server on http://127.0.0.1:5173
npm run setup:ocr         # Copies Tesseract worker/core binaries and downloads traineddata
npm test                  # Runs core domain + member app test suites (47 tests)
npm run test:member-app   # Runs Vitest unit tests for member app (23 tests)
npm run build             # Runs tsc -b and production Vite bundle
```
