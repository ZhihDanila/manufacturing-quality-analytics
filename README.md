# Manufacturing Quality Analytics Dashboard

**[🚀 Live Interactive Dashboard](https://manufacturing-quality-analytics.zhihdanya.workers.dev)**

Explore manufacturing quality KPIs, defect trends, Pareto analysis, and interactive filtering in a browser.

**Tech:** React · TypeScript · Power BI · Recharts · Motion
**Data:** Synthetic, anonymized manufacturing inspection dataset.

A browser-only quality analytics portfolio project built from a synthetic, anonymized Power BI report. The first release implements **Quality Overview**; the portfolio release focuses on one complete analytical page.

## Run locally

Install Node.js 22.12+ or a current Node.js LTS release, then open a terminal in this directory:

```sh
npm install
npm run dev
```

Open the local address printed by Vite.

```sh
npm test
npm run build
npm run preview
```

`preview.html` is a self-contained copy of the production application. Open it directly in a browser; no server or installation is needed. Regenerate it after source changes with `node scripts/create-preview.mjs` following the production build.

## Stack

React, TypeScript, Vite, Tailwind CSS, Motion, Recharts and Lucide React. All data and calculations stay in the browser. There is no backend, authentication service, external database or runtime API call.

## What is implemented

- Responsive dark dashboard with orange accents and reduced-motion support.
- Period, vehicle model, inspection area and defect-type filters.
- Cars, Defects Count, DPU and DRR cards with metric explanations.
- Daily DPU / DRR switch, trailing 30-day aggregate DPU, daily inspection volume.
- Defect Pareto and inspection-area DPU, previous-period DPU and DRR.
- Separate FTT panel, preserving the source page's fourth KPI.
- Filter-reactive findings and model comparison with explicit denominators.
- Accessible methodology, keyboard focus states and readable scrollable Pareto labels.
- CSV export of the selected daily summary and empty-selection handling.
- Daily charts omit dates without eligible inspected vehicles; genuine zero-defect days remain visible. Cleared or invalid date ranges show a consistent empty state.

## Dataset

Source: `01_Quality_Anonymized.pbix`, read without modifying the file using PBIXRay. The semantic model contains 20,288 defect/inspection records, 2,296 distinct demonstration VINs, three anonymized models and seven inspection areas. Stored production dates span 2025-03-03 through 2025-06-20.

The local dataset includes only the fields needed for this page. VINs use `DEMO-VEH-*` identifiers. Comments, names, claim details and other unused source fields are not included in the frontend dataset. No new random data or fabricated KPI values were introduced. A curated portfolio ZIP includes only the projected synthetic data, application sources, build output and selected documentation. It excludes the PBIX, raw metadata, dependencies and local work files. Publish from that package, not the whole working directory.

## Metric semantics

Raw extracted DAX definitions are retained in the local working project only. The curated public package excludes raw metadata. Business logic is separate from the React page in `src/lib/analytics/`.

| Metric | Source semantics |
| --- | --- |
| Cars | Distinct VIN after excluding blank Model; no extra VIN-validity rule was added. |
| Defects Count | Number of records whose stored Real Defect flag is 1. |
| DPU | Defects Count / Cars. |
| Cars With Defects | Distinct VIN with nonblank Defect, excluding No defect, CP8 OK and -. |
| DRR | (Cars − Cars With Defects) / Cars. This is the source DRR measure, not DRR FTT. |
| FTT | VINs present at Incoming, Assembly, OK Line, T/UP, Test Line and Final Inspection with zero real defects, divided by Cars. |

Area filters follow the source FTT context: the six stage predicates replace the inspection-area filter, but the zero-real-defects test retains it. All other selected filters remain applied. Defect-type filtering also filters Cars, matching the source's denominator behavior; the result must not be read as an unconditional plant-wide rate.

Record duplicates are retained, distinct VINs are counted separately, and no source flag or defect category is recomputed. Blank DPU/DRR are displayed as an em dash; FTT uses the source COALESCE-to-zero behavior. The daily car totals are not additive because a VIN may appear on several dates.

## Approved date correction

The extracted model has no relationship between Calendar and Defect records. Source Calendar filters therefore do not propagate into the fact table. With the user's approval, this application applies dates directly to the stored **Date Only** production-date field. It performs no additional shift of manufacturing-day boundaries.

The daily trend and 30-day DPU consequently use this corrected date context. Trailing DPU is a ratio of aggregated records and distinct VINs over the inclusive 30-day window, not an average of daily ratios. Previous DPU shifts the selected calendar dates one month back as a date set. Dates beyond the shorter destination month are clamped; when both final days of a source month are selected, the result extends through the destination month end. This follows the documented classic date-column DATEADD extension rule, including full April → full March and leap-year cases. The shifted date set is applied to Date Only with the same model, area and defect-type filters. A dash means there are no cars in the comparison context. See [Microsoft DATEADD documentation](https://learn.microsoft.com/en-us/dax/dateadd-function-dax). Final engine-level verification remains pending.

The area-performance table preserves the source visual's area filter (Incoming, Assembly, OK Line, T/UP, Test Line, Final Inspection and SHOWER when present). Sign Off is excluded from that table only; it remains available in global filters and KPI calculations.

Pareto uses the source Focus/Mass analysis groups, the 15 largest defect counts and dense-ranking cumulative shares (ties share the same cumulative percentage).

## Validation and limits

Twenty automated tests cover six independently calculated Python reference selections from the extracted dataset, service-label exclusions, repeated inspections, FTT stage context, invalid and empty selections, omitted missing days, true zero-defect days, calendar-based rolling DPU, month-end shifts, leap years, multi-month selections and the visual-only area restriction. Full-period results are Cars 2,296; Defects 11,326; DPU 4.9329268293; DRR 6.4024390244%; FTT 5.9668989547% (137 cars).

These checks validate the JavaScript translation against an independent implementation of the extracted DAX. They do not constitute execution inside the Power BI engine. A final comparison against Power BI cards for selected dates/models remains to be performed, using Date Only instead of the disconnected Calendar filter. `docs/validation.dax` contains full-period, single-day/model, monthly/model and DATEADD queries with expected results for that engine-level check. The source PBIX is not modified or bundled.

Production TypeScript checks and the Vite build pass. The production preview server returned HTTP 200 during a direct local request. Automated visual verification was still blocked by browser-to-server connectivity in the tool environment; review the supplied preview in your browser before treating the visual design as approved. No screenshot is claimed as verified.

## Project structure

```text
src/
  components/       Shared chart panel
  pages/            Quality Overview
  data/             Projected static dataset
  lib/analytics/    Filtering, aggregation and metric tests
  types/            Record and filter types
  hooks/            Filter state and memoized calculations
  styles/           Theme and responsive layout
docs/               Case study, validation and deployment guidance
scripts/            Self-contained preview generation
```

To replace the dataset, supply records matching `QualityRecord`, preserve authoritative stored flags/dates, and update the validation references. Calculations do not require rewriting the UI.


## Business question and contribution

Which defect categories concentrate the inspection findings, and how do rates vary across models and inspection areas? The implementation translates extracted Power BI measures into testable TypeScript, applies an approved production-date correction, and combines global filtering with descriptive insights. It makes denominators and source-measure limitations visible rather than inventing operational targets or causal conclusions. See `docs/CASE_STUDY.md`.

## Performance

A Node.js benchmark on this machine, after warm-up (10 samples per selection), measured median analytics computation of approximately 143 ms for all records, 24 ms for Model A in April, and 41 ms for Incoming across the full period. These are computation timings, not browser load or interaction measurements. Rolling DPU now computes only its numerator and denominator rather than invoking unnecessary FTT calculations. The standalone app contains the whole synthetic dataset: roughly 4.43 MB uncompressed; the JS bundle is about 371 KB gzip. No browser performance claim is made before an actual browser review.

## Screenshots and visual validation

Real browser screenshots have not yet been captured. Pending checks: 1440×900, 1920×1080, 1024×768 and 390 px width; DPU/DRR, filtered and empty states; tooltip clipping, horizontal overflow, keyboard navigation and browser console. Do not substitute generated mockups for evidence. The absence of screenshots is an explicit remaining acceptance item.

## Distribution

Open `preview.html` for the offline demonstration, or serve `dist/` with a static host. See `docs/DEPLOYMENT.md`. No site has been published. Excel upload is deliberately outside this portfolio version.
