import type { Filters, QualityRecord } from "../../types/quality";
const key = (s: string | null) => s?.toLowerCase() ?? "";
const noDefects = new Set(["no defect", "cp8 ok", "-"]);
export const requiredAreas = [
  "Incoming",
  "Assembly",
  "OK Line",
  "T/UP",
  "Final Inspection",
  "Test Line",
];
// The source Overview visual has its own area filter, independent of global KPIs.
const overviewAreas = new Set([...requiredAreas, "SHOWER"].map(key));
export function isValidPeriod(f: Pick<Filters, "start" | "end">) {
  const validDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + "T00:00:00Z");
    return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value;
  };
  return (
    validDate(f.start) &&
    validDate(f.end) &&
    f.start <= f.end &&
    +new Date(f.end) - +new Date(f.start) <= 3660 * 86400000
  );
}
export function filterRecords(
  rows: QualityRecord[],
  f: Filters,
  ignoreArea = false,
) {
  if (!isValidPeriod(f)) return [];
  return rows.filter(
    (r) =>
      r.date >= f.start &&
      r.date <= f.end &&
      (!f.model || key(r.model) === key(f.model)) &&
      (ignoreArea || !f.area || key(r.area) === key(f.area)) &&
      (!f.defectType || key(r.defectType) === key(f.defectType)),
  );
}
export function calculateKpis(rows: QualityRecord[], areaContextRows = rows) {
  // Cars excludes blank Model, but DISTINCTCOUNT retains a blank VIN, as in DAX.
  const cars = new Set(
    rows
      .filter((r) => r.model !== null && r.model !== "")
      .map((r) => key(r.vin)),
  ).size;
  const defects = rows.filter((r) => r.realDefect === 1).length;
  const badVins = new Set(
    rows
      .filter(
        (r) =>
          r.defect !== null && r.defect !== "" && !noDefects.has(key(r.defect)),
      )
      .map((r) => key(r.vin)),
  );
  const candidates = new Set(rows.map((r) => key(r.vin)));
  const stages = new Map<string, Set<string>>();
  for (const r of areaContextRows) {
    const k = key(r.vin);
    if (!stages.has(k)) stages.set(k, new Set());
    stages.get(k)!.add(key(r.area));
  }
  // CALCULATE's stage predicates replace the area filter; Real Defect preserves it.
  const realBad = new Set(
    rows.filter((r) => r.realDefect === 1).map((r) => key(r.vin)),
  );
  const fttCars = [...candidates].filter(
    (v) =>
      !realBad.has(v) && requiredAreas.every((a) => stages.get(v)?.has(key(a))),
  ).length;
  return {
    cars,
    defects,
    dpu: cars ? defects / cars : null,
    drr: cars ? (cars - badVins.size) / cars : null,
    ftt: cars ? fttCars / cars : 0,
    fttCars,
    records: rows.length,
  };
}
export function daysBetween(start: string, end: string) {
  const days: string[] = [];
  const d = new Date(start + "T00:00:00Z");
  const last = new Date(end + "T00:00:00Z");
  if (
    !Number.isFinite(+d) ||
    !Number.isFinite(+last) ||
    +last - +d > 3660 * 86400000
  )
    return days;
  for (; d <= last; d.setUTCDate(d.getUTCDate() + 1))
    days.push(d.toISOString().slice(0, 10));
  return days;
}
export function previousMonth(date: string) {
  const d = new Date(date + "T00:00:00Z");
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 1);
  const last = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}
export function previousMonthDates(start: string, end: string) {
  const selected = daysBetween(start, end);
  const result = new Set(selected.map(previousMonth));
  const selectedSet = new Set(selected);
  // Classic DATEADD with a date column extends the destination month when
  // the selection contains both of the source month's last two days.
  for (const date of selected) {
    const d = new Date(date + "T00:00:00Z");
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
    const lastDate = last.toISOString().slice(0, 10);
    const penultimate = new Date(+last - 86400000).toISOString().slice(0, 10);
    if (date !== penultimate || !selectedSet.has(lastDate)) continue;
    const previousLast = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0),
    )
      .toISOString()
      .slice(0, 10);
    for (const shifted of daysBetween(previousMonth(penultimate), previousLast))
      result.add(shifted);
  }
  return result;
}
export function dashboard(rows: QualityRecord[], f: Filters) {
  const selected = filterRecords(rows, f);
  const areaContext = filterRecords(rows, f, true);
  const kpis = calculateKpis(selected, areaContext);
  const byDay = new Map<string, QualityRecord[]>();
  const contextByDay = new Map<string, QualityRecord[]>();
  for (const r of selected) {
    if (!byDay.has(r.date)) byDay.set(r.date, []);
    byDay.get(r.date)!.push(r);
  }
  for (const r of areaContext) {
    if (!contextByDay.has(r.date)) contextByDay.set(r.date, []);
    contextByDay.get(r.date)!.push(r);
  }
  const nonDateRows = rows.filter(
    (r) =>
      (!f.model || key(r.model) === key(f.model)) &&
      (!f.area || key(r.area) === key(f.area)) &&
      (!f.defectType || key(r.defectType) === key(f.defectType)),
  );
  const trend = [...byDay.keys()]
    .sort()
    .map((date) => {
      const start = new Date(date + "T00:00:00Z");
      start.setUTCDate(start.getUTCDate() - 29);
      const from = start.toISOString().slice(0, 10);
      return {
        date,
        ...calculateKpis(byDay.get(date) ?? [], contextByDay.get(date) ?? []),
        rollingDpu: (() => {
          const cars = new Set<string>();
          let defects = 0;
          for (const record of nonDateRows) {
            if (record.date < from || record.date > date) continue;
            if (record.model !== null && record.model !== "") cars.add(key(record.vin));
            if (record.realDefect === 1) defects++;
          }
          return cars.size ? defects / cars.size : null;
        })(),
      };
    })
    .filter((point) => point.dpu !== null && point.drr !== null);
  const counts = new Map<string, number>();
  for (const r of selected)
    if (r.realDefect === 1 && ["Focus", "Mass"].includes(r.group))
      counts.set(
        r.defect ?? "(Blank)",
        (counts.get(r.defect ?? "(Blank)") ?? 0) + 1,
      );
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const allDefects = [...counts].sort((a, b) => b[1] - a[1]);
  const top = allDefects.slice(0, 15).map(([name, count]) => {
    const rankCumulative = allDefects
      .filter(([, n]) => n >= count)
      .reduce((sum, [, n]) => sum + n, 0);
    return { name, count, share: total ? (rankCumulative / total) * 100 : 0 };
  });
  const previousDates = isValidPeriod(f)
    ? previousMonthDates(f.start, f.end)
    : new Set<string>();
  const prevRows = nonDateRows.filter((r) => previousDates.has(r.date));
  const areas = [...new Set(areaContext.map((r) => r.area))]
    .filter(
      (a) => overviewAreas.has(key(a)) && (!f.area || key(a) === key(f.area)),
    )
    .map((area) => ({
      area,
      ...calculateKpis(
        selected.filter((r) => key(r.area) === key(area)),
        areaContext,
      ),
      previousDpu: calculateKpis(
        prevRows.filter((r) => key(r.area) === key(area)),
      ).dpu,
    }))
    .sort((a, b) => (b.dpu ?? 0) - (a.dpu ?? 0));
  const models = [...new Set(selected.map((r) => r.model).filter(Boolean))]
    .sort()
    .map((model) => ({
      model,
      ...calculateKpis(selected.filter((r) => r.model === model)),
    }));
  const insights: string[] = [];
  if (kpis.cars && top.length && total) {
    insights.push(
      `${top[0].name} leads the eligible defect categories: ${top[0].count.toLocaleString("en-US")} records (${((top[0].count / total) * 100).toFixed(1)}%).`,
    );
    const leading = top.slice(0, 3);
    insights.push(
      `The top ${leading.length} categories account for ${((leading.reduce((sum, item) => sum + item.count, 0) / total) * 100).toFixed(1)}% of Focus / Mass defect records.`,
    );
    const highest = areas.find((area) => area.cars && area.dpu !== null);
    if (highest)
      insights.push(
        `${highest.area} has the highest DPU among the displayed areas: ${highest.dpu!.toFixed(2)} (${highest.defects.toLocaleString("en-US")} defects / ${highest.cars.toLocaleString("en-US")} cars).${highest.cars < 30 ? " Small sample: fewer than 30 cars; interpret cautiously." : " Area volumes differ; this is a descriptive comparison."}`,
      );
  }
  return {
    kpis,
    trend,
    top,
    areas,
    selected,
    models,
    insights,
    previousDates: [...previousDates].sort(),
  };
}
