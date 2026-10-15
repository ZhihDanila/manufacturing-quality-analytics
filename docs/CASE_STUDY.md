# Manufacturing Quality Analytics — case study

## Question
Which inspection findings dominate, and where do descriptive rates differ across models and areas?

## Method
Project nine required fields from a synthetic Power BI dataset, preserve stored flags and repeated records, and translate Cars, Defects, DPU, DRR and FTT into TypeScript. Separate record counts from distinct inspected vehicles. Use stored production dates because the original Calendar is disconnected. Preserve source visual restrictions and make context-dependent denominators explicit.

## Findings at the default selection
- 2,296 vehicles and 11,326 flagged defect records; DPU 4.93.
- Damage is the largest category: 1,633 records, 14.4% of Focus / Mass findings.
- Damage, Scratch and Polishing Mark account for 38.5% of eligible defect records.
- Incoming has the highest DPU among displayed areas: 4,267 / 2,296 = 1.86.
- Model B has the highest model DPU: 3,023 / 548 = 5.52, compared with Model A 4.75 and Model C 4.78.

These are observations within synthetic data, not recommendations to a real manufacturer. The application recalculates its displayed findings under the active filters.

## Validation and limits
Twenty automated tests include independent reference selections, missing dates, genuine zero values, FTT context, rolling windows, month-end shifting, model comparison and empty findings. Power BI engine validation remains pending. Direct-run and FTT measures depend on selected filters and must not be interpreted as universal plant metrics. This case demonstrates analytics and implementation; no realized business savings, causal explanation or authorship history is claimed.

## Presentation evidence
Browser screenshots and multi-viewport visual acceptance remain pending. No generated mockups are presented as application screenshots.
