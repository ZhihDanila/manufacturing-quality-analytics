import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateKpis,
  dashboard,
  filterRecords,
  isValidPeriod,
  previousMonthDates,
} from "./index";
import records from "../../data/records.json";
import reference from "./reference.json";
import type { QualityRecord } from "../../types/quality";
const rows = records as QualityRecord[];
for (const [i, fixture] of reference.entries())
  test(`Extracted dataset matches independent Python reference ${i + 1}`, () => {
    assert.deepEqual(dashboard(rows, fixture.filters).kpis, fixture.expected);
  });
test("DPU counts records, Cars counts VINs, DRR excludes service labels", () => {
  const base: QualityRecord = {
    vin: "A",
    model: "Model A",
    area: "Assembly",
    defect: "No defect",
    defectType: "Conforming",
    realDefect: 0,
    date: "2025-03-03",
    group: "Not Defect",
    part: "Door",
  };
  const result = calculateKpis([
    base,
    { ...base, defect: "Scratch", realDefect: 1 },
    { ...base, defect: "Scratch", realDefect: 1 },
    { ...base, vin: "B", defect: "CP8 OK" },
  ]);
  assert.equal(result.cars, 2);
  assert.equal(result.defects, 2);
  assert.equal(result.dpu, 1);
  assert.equal(result.drr, 0.5);
});
test("FTT stage CALCULATE replaces only the inspection area filter", () => {
  const areas = [
    "Incoming",
    "Assembly",
    "OK Line",
    "T/UP",
    "Test Line",
    "Final Inspection",
  ];
  const rows = areas.map((area) => ({
    vin: "A",
    model: "Model A",
    area,
    defect: "No defect",
    defectType: "Conforming",
    realDefect: 0,
    date: "2025-03-03",
    group: "Not Defect",
    part: "Door",
  }));
  const f = {
    start: "2025-03-03",
    end: "2025-03-03",
    area: "Assembly",
    model: "",
    defectType: "",
  };
  assert.equal(
    calculateKpis(filterRecords(rows, f), filterRecords(rows, f, true)).fttCars,
    1,
  );
  assert.equal(calculateKpis(rows.slice(1)).fttCars, 0);
});
test("Empty context uses null DPU/DRR and zero FTT", () => {
  assert.deepEqual(calculateKpis([]), {
    cars: 0,
    defects: 0,
    dpu: null,
    drr: null,
    ftt: 0,
    fttCars: 0,
    records: 0,
  });
});
test("Daily series omits missing days and keeps production dates", () => {
  const d = dashboard(rows, {
    start: "2025-03-07",
    end: "2025-03-10",
    model: "",
    area: "",
    defectType: "",
  });
  assert.deepEqual(
    d.trend.map((r) => r.date),
    ["2025-03-07", "2025-03-10"],
  );
  assert.ok(
    d.trend.every((r) => r.records > 0 && r.dpu !== null && r.drr !== null),
  );
  assert.equal(
    d.trend[0].cars,
    calculateKpis(rows.filter((r) => r.date === "2025-03-07")).cars,
  );
});
const filters = {
  start: "2025-03-03",
  end: "2025-06-20",
  model: "",
  area: "",
  defectType: "",
};
const record = (date: string, realDefect = 0, vin = date): QualityRecord => ({
  date,
  vin,
  model: "Model A",
  area: "Assembly",
  defect: realDefect ? "Scratch" : "No defect",
  defectType: realDefect ? "Quality finding" : "Conforming",
  realDefect,
  group: realDefect ? "Mass" : "Not Defect",
  part: "Door",
});
test("Full series contains exactly the 80 observed dates", () => {
  const result = dashboard(rows, filters);
  assert.equal(result.trend.length, 80);
  assert.ok(result.trend.every((r) => r.dpu !== null && r.drr !== null));
});
test("Filtered series omits absent days, but retains true zero DPU and 100% DRR", () => {
  const sample = [
    record("2025-03-07"),
    { ...record("2025-03-10", 1), model: "Model B" },
    record("2025-03-12"),
  ];
  const result = dashboard(sample, { ...filters, model: "Model A" });
  assert.deepEqual(
    result.trend.map((r) => r.date),
    ["2025-03-07", "2025-03-12"],
  );
  assert.ok(result.trend.every((r) => r.dpu === 0 && r.drr === 1));
  assert.equal(
    dashboard(sample, { ...filters, model: "Missing" }).trend.length,
    0,
  );
});
test("Invalid and cleared periods give an empty, consistent dashboard", () => {
  for (const period of [
    { start: "", end: filters.end },
    { start: filters.start, end: "" },
    { start: "2025-05-01", end: "2025-04-01" },
    { start: "2025-02-30", end: "2025-03-03" },
  ]) {
    assert.equal(isValidPeriod(period), false);
    const result = dashboard(rows, { ...filters, ...period });
    assert.equal(result.kpis.cars, 0);
    assert.equal(result.kpis.records, 0);
    assert.equal(result.trend.length, 0);
    assert.equal(result.areas.length, 0);
  }
});
test("Rolling DPU is an aggregate over 30 calendar days, including history before selection", () => {
  const sample = [
    record("2025-02-28", 1, "excluded"),
    record("2025-03-01", 1, "A"),
    record("2025-03-01", 1, "A"),
    record("2025-03-10", 0, "A"),
    record("2025-03-30", 0, "B"),
  ];
  const result = dashboard(sample, {
    ...filters,
    start: "2025-03-30",
    end: "2025-03-30",
  });
  assert.equal(result.trend[0].dpu, 0);
  assert.equal(result.trend[0].rollingDpu, 1); // 2 records / 2 VINs, March 1–30.
});
test("Previous month extends a full April to the end of March", () => {
  const dates = [...previousMonthDates("2025-04-01", "2025-04-30")].sort();
  assert.equal(dates.length, 31);
  assert.equal(dates[0], "2025-03-01");
  assert.equal(dates.at(-1), "2025-03-31");
  assert.deepEqual([...previousMonthDates("2025-04-29", "2025-04-30")].sort(), [
    "2025-03-29",
    "2025-03-30",
    "2025-03-31",
  ]);
  assert.deepEqual(
    [...previousMonthDates("2025-04-29", "2025-04-29")],
    ["2025-03-29"],
  );
});
test("Previous month handles short months, leap years and multi-month selection as a date set", () => {
  assert.deepEqual(
    [...previousMonthDates("2025-03-30", "2025-03-31")],
    ["2025-02-28"],
  );
  assert.equal(previousMonthDates("2024-02-01", "2024-02-29").size, 31);
  const dates = previousMonthDates("2025-04-29", "2025-05-02");
  assert.deepEqual([...dates].sort(), [
    "2025-03-29",
    "2025-03-30",
    "2025-03-31",
    "2025-04-01",
    "2025-04-02",
  ]);
});
test("Previous DPU includes March 31 for a full April and preserves filters", () => {
  const sample = [
    record("2025-03-31", 1),
    record("2025-04-01"),
    { ...record("2025-03-31", 1, "other"), model: "Model B" },
  ];
  const result = dashboard(sample, {
    ...filters,
    start: "2025-04-01",
    end: "2025-04-30",
    model: "Model A",
  });
  assert.equal(result.areas[0].previousDpu, 1);
  assert.equal(result.areas[0].dpu, 0);
});
test("Source Overview area exclusion does not alter global KPIs", () => {
  const sample = [
    record("2025-03-03"),
    { ...record("2025-03-03", 1, "B"), area: "Sign Off" },
  ];
  const result = dashboard(sample, filters);
  assert.deepEqual(
    result.areas.map((r) => r.area),
    ["Assembly"],
  );
  assert.equal(result.kpis.cars, 2);
  assert.equal(result.kpis.defects, 1);
  const signOff = dashboard(sample, { ...filters, area: "Sign Off" });
  assert.equal(signOff.kpis.cars, 1);
  assert.equal(signOff.areas.length, 0);
});

test("Model comparison follows global filters and uses each model denominator", () => {
  const filters = {
    start: "2025-04-01",
    end: "2025-04-30",
    model: "",
    area: "Incoming",
    defectType: "",
  };
  const result = dashboard(rows, filters);
  assert.equal(result.models.length, 3);
  for (const model of result.models) {
    const expected = calculateKpis(
      filterRecords(rows, { ...filters, model: model.model! }),
    );
    assert.equal(model.cars, expected.cars);
    assert.equal(model.defects, expected.defects);
    assert.equal(model.dpu, expected.dpu);
  }
  const one = dashboard(rows, { ...filters, model: "Model A" });
  assert.deepEqual(
    one.models.map((m) => m.model),
    ["Model A"],
  );
});
test("Findings are factual and absent for empty or conforming selections", () => {
  const filters = {
    start: "2025-03-03",
    end: "2025-06-20",
    model: "",
    area: "",
    defectType: "",
  };
  const result = dashboard(rows, filters);
  const total = result.top.reduce((sum, item) => sum + item.count, 0);
  assert.equal(result.insights.length, 3);
  assert.ok(result.insights[0].includes(result.top[0].name));
  assert.ok(
    result.insights[0].includes(
      ((result.top[0].count / total) * 100).toFixed(1) + "%",
    ),
  );
  assert.deepEqual(
    dashboard(rows, { ...filters, defectType: "Conforming" }).insights,
    [],
  );
  assert.deepEqual(
    dashboard(rows, { ...filters, model: "Missing model" }).insights,
    [],
  );
});
