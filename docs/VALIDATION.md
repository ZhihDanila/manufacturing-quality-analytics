# Validation evidence

Status: 20 automated tests passed; TypeScript and production build pass. Reference fixtures are in `src/lib/analytics/reference.json`. The independent reference generator used the extracted inspection records and source definitions. Direct Power BI engine execution remains pending; run `validation.dax` in the source model using Date Only.

| Selection | Cars | Defects | DPU | DRR | FTT cars |
|---|---:|---:|---:|---:|---:|
| Full dataset | 2296 | 11326 | 4.9329268293 | 6.402439% | 137 |
| Model A, March 3 | 21 | 96 | 4.5714285714 | 9.523810% | 2 |
| Model B, April | 155 | 806 | 5.2000000000 | 6.451613% | 9 |

Missing-data days are omitted from the chart data itself. The default series contains exactly 80 observed dates, not 110 calendar dates. True zero-defect days are retained. Invalid dates return empty calculations and the UI displays an em dash for invalid KPI values.

The current tool session cannot inspect the user's ordinary browser or native desktop. Screenshots, console inspection and browser load measurements remain pending. This limitation is not a passed visual check.
