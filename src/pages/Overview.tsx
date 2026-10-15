import { useState } from "react";
import { motion } from "motion/react";
import {
  Factory,
  LayoutDashboard,
  RotateCcw,
  Download,
  CarFront,
  ScanLine,
  Gauge,
  CircleCheck,
  Info,
  Database,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ComposedChart,
} from "recharts";
import { useDashboard, initialFilters } from "../hooks/useDashboard";
import { ChartPanel } from "../components/ChartPanel";
import { isValidPeriod } from "../lib/analytics";
const number = new Intl.NumberFormat("en-US");
const ratio = (v: number | null) => (v === null ? "—" : v.toFixed(2));
const percent = (v: number | null) =>
  v === null ? "—" : `${(v * 100).toFixed(1)}%`;
const axis = {
  tick: { fill: "#b2b5bd", fontSize: 12 },
  axisLine: false,
  tickLine: false,
};
const tip = {
  contentStyle: {
    background: "#222428",
    border: "1px solid #555860",
    borderRadius: 12,
    color: "#eee",
  },
  labelStyle: { color: "#c0c3cc" },
  itemStyle: { color: "#eee" },
};
const shortDate = (d: string) => d.slice(5).replace("-", "/");
export default function Overview() {
  const { filters, setFilters, data, options } = useDashboard();
  const [metric, setMetric] = useState<"dpu" | "drr">("dpu");
  const [notice, setNotice] = useState("");
  const valid = isValidPeriod(filters);
  const k = data.kpis;
  const update = (name: keyof typeof filters, value: string) =>
    setFilters((f) => ({ ...f, [name]: value }));
  const prior = data.previousDates.length
    ? `${data.previousDates[0]} → ${data.previousDates.at(-1)}`
    : "—";
  const cards = [
    {
      label: "Cars inspected",
      value: number.format(k.cars),
      unit: "unique vehicles",
      icon: CarFront,
      foot: "Inspected vehicles",
      help: "Distinct inspected vehicles with a nonblank model. This is not a completed-production count.",
    },
    {
      label: "Defects recorded",
      value: number.format(k.defects),
      unit: "quality findings",
      icon: ScanLine,
      foot: "Recorded quality findings",
      help: "Count of flagged defect records. Repeated inspections remain included.",
    },
    {
      label: "Defects per unit",
      value: ratio(k.dpu),
      unit: "defects / vehicle",
      icon: Gauge,
      foot: "Defects divided by cars",
      help: "The numerator and vehicle denominator both follow all selected filters.",
    },
    {
      label: "Direct run rate",
      value: percent(k.drr),
      unit: "cars without defects",
      icon: CircleCheck,
      foot: "Defect-free share",
      help: "Share of inspected vehicles without a recorded defect in the selected context.",
    },
  ];
  const exportSummary = () => {
    const lines = [
      "Date,Cars,Defects,DPU,DRR,FTT",
      ...data.trend.map((r) =>
        [r.date, r.cars, r.defects, r.dpu ?? "", r.drr ?? "", r.ftt].join(","),
      ),
    ];
    const url = URL.createObjectURL(
      new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "quality-overview.csv";
    a.click();
    URL.revokeObjectURL(url);
    setNotice("Daily summary exported. DRR and FTT use decimal fractions.");
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview">
          <span className="brand-icon">
            <Factory size={22} />
          </span>
          <div>
            FORGE<span>QUALITY INTELLIGENCE</span>
          </div>
        </a>
        <div className="workspace">
          <span className="workspace-avatar">MQ</span>
          <div>
            Manufacturing quality<small>Portfolio workspace</small>
          </div>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          <a href="#overview" className="nav-item active">
            <LayoutDashboard size={18} />
            Quality overview
            <span className="nav-dot" />
          </a>
          <a href="#findings" className="nav-item">
            <ScanLine size={18} />
            Key findings
          </a>
          <a href="#methodology" className="nav-item">
            <Info size={18} />
            Methodology
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="source-box">
            <div className="source-indicator" />
            SYNTHETIC DATASET<strong>Power BI · anonymized</strong>
            <small>
              20,288 inspection records
              <br />3 models · 7 inspection areas
            </small>
          </div>
        </div>
      </aside>
      <main id="overview">
        <header className="topbar">
          <div>
            Workspace / <span>Quality overview</span>
          </div>
          <span className="local-badge">
            <span />
            Portfolio demo
          </span>
        </header>
        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">MANUFACTURING ANALYTICS</div>
              <h1>
                Quality overview<span>.</span>
              </h1>
              <p>
                Explore inspection quality, defect concentration and model
                performance.
              </p>
            </div>
            <button
              className="export-button"
              onClick={exportSummary}
              disabled={!valid || !k.records}
            >
              <Download size={16} />
              Export summary
            </button>
          </div>
          <div className="period-strip">
            <div>
              <span className="status-dot" />
              SYNTHETIC DATA
              <span className="strip-divider" />
              Dataset: 03 Mar — 20 Jun 2025
            </div>
            <span>
              Selected: {filters.start || "—"} → {filters.end || "—"} ·{" "}
              {number.format(k.records)} records
            </span>
          </div>
          <section className="filter-bar" aria-label="Global filters">
            <div className="filter-title">FILTERS</div>
            <label>
              START DATE
              <input
                type="date"
                value={filters.start}
                onChange={(e) => update("start", e.target.value)}
              />
            </label>
            <label>
              END DATE
              <input
                type="date"
                value={filters.end}
                onChange={(e) => update("end", e.target.value)}
              />
            </label>
            <label>
              MODEL
              <select
                value={filters.model}
                onChange={(e) => update("model", e.target.value)}
              >
                <option value="">All models</option>
                {options.models.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              INSPECTION AREA
              <select
                value={filters.area}
                onChange={(e) => update("area", e.target.value)}
              >
                <option value="">All areas</option>
                {options.areas.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              FINDING TYPE
              <select
                value={filters.defectType}
                onChange={(e) => update("defectType", e.target.value)}
              >
                <option value="">All types</option>
                {options.types.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <button
              title="Reset filters"
              aria-label="Reset filters"
              className="reset-button"
              onClick={() => setFilters(initialFilters)}
            >
              <RotateCcw size={17} />
            </button>
          </section>
          {!valid ? (
            <div role="status" className="empty-state">
              Choose valid dates. End date must be on or after start date;
              maximum period is 10 years.
            </div>
          ) : !k.records ? (
            <div role="status" className="empty-state">
              No inspections match this selection. Adjust or reset the filters.
            </div>
          ) : null}
          <div className="kpi-grid">
            {cards.map((c, i) => (
              <motion.section
                className={`kpi-card ${i === 2 ? "accent-card" : ""}`}
                key={c.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <div className="kpi-label">
                  {c.label}
                  <c.icon size={18} />
                </div>
                <div className="kpi-value">{valid ? c.value : "—"}</div>
                <div className="kpi-unit">{c.unit}</div>
                <div className="kpi-foot">
                  <span>{c.foot}</span>
                  <span className="help-icon" tabIndex={0} aria-label={c.help}>
                    <Info size={13} />
                    <span className="help-text">{c.help}</span>
                  </span>
                </div>
              </motion.section>
            ))}
          </div>
          <div className="main-chart-grid">
            <ChartPanel
              title="Quality performance"
              subtitle={
                metric === "dpu"
                  ? "Daily defects per inspected vehicle"
                  : "Daily share of cars without defects"
              }
              action={
                <div className="segmented">
                  {(["dpu", "drr"] as const).map((m) => (
                    <button
                      key={m}
                      aria-pressed={metric === m}
                      className={metric === m ? "selected" : ""}
                      onClick={() => setMetric(m)}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="chart-legend">
                <span>
                  <i className="legend-dot orange" />
                  {metric.toUpperCase()}
                </span>
                {metric === "dpu" && (
                  <span>
                    <i className="legend-dot purple" />
                    30-day aggregate
                  </span>
                )}
                <span>Observed production dates</span>
              </div>
              <div className="chart-large">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.trend}
                    margin={{ top: 12, right: 10, left: -15, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="qualityFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#f78c45"
                          stopOpacity={0.24}
                        />
                        <stop
                          offset="100%"
                          stopColor="#f78c45"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="#34363c"
                      strokeDasharray="3 5"
                    />
                    <XAxis
                      dataKey="date"
                      {...axis}
                      minTickGap={42}
                      tickFormatter={shortDate}
                    />
                    <YAxis
                      {...axis}
                      tickFormatter={(v) =>
                        metric === "drr"
                          ? `${Math.round(v * 100)}%`
                          : v.toFixed(1)
                      }
                    />
                    <Tooltip
                      {...tip}
                      formatter={(v) =>
                        metric === "drr" ? percent(Number(v)) : ratio(Number(v))
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey={metric}
                      name={metric.toUpperCase()}
                      stroke="#f78c45"
                      strokeWidth={2.2}
                      fill="url(#qualityFill)"
                      isAnimationActive={false}
                      activeDot={{ r: 5 }}
                    />
                    {metric === "dpu" && (
                      <Line
                        type="monotone"
                        dataKey="rollingDpu"
                        name="30-day DPU"
                        stroke="#b5aaf2"
                        strokeWidth={2}
                        strokeDasharray="5 4"
                        dot={false}
                        isAnimationActive={false}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="chart-note">
                Dates without eligible vehicles are omitted; zero-defect days
                remain. The 30-day window uses calendar days.
              </p>
            </ChartPanel>
            <ChartPanel
              title="Inspection volume"
              subtitle="Unique VINs inspected each day"
            >
              <div className="volume-summary">
                <strong>{valid ? number.format(k.cars) : "—"}</strong>
                <span>unique cars in period</span>
              </div>
              <div className="chart-volume">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.trend}
                    margin={{ left: -15, right: 0, top: 8 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="#34363c"
                      strokeDasharray="3 5"
                    />
                    <XAxis
                      dataKey="date"
                      {...axis}
                      minTickGap={55}
                      tickFormatter={shortDate}
                    />
                    <YAxis {...axis} />
                    <Tooltip {...tip} />
                    <Bar
                      dataKey="cars"
                      name="Cars"
                      fill="#aaa0e5"
                      radius={[3, 3, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="chart-note">
                The same vehicle may appear on several days; daily counts are
                not additive.
              </p>
            </ChartPanel>
          </div>
          <div className="secondary-chart-grid">
            <ChartPanel
              title="Defect Pareto"
              subtitle="Top 15 categories · count and cumulative share"
              action={<span className="panel-tag">FOCUS + MASS</span>}
            >
              <div className="chart-legend">
                <span>
                  <i className="legend-dot orange" />
                  Defect records
                </span>
                <span>
                  <i className="legend-dot purple" />
                  Cumulative share
                </span>
              </div>
              <div
                className="pareto-scroll"
                tabIndex={0}
                role="region"
                aria-label="Scrollable defect Pareto chart"
              >
                <div className="chart-pareto">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={data.top}
                      margin={{ left: -15, right: 0, top: 10, bottom: 15 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="#34363c"
                        strokeDasharray="3 5"
                      />
                      <XAxis
                        dataKey="name"
                        {...axis}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={110}
                      />
                      <YAxis {...axis} yAxisId="count" />
                      <YAxis
                        {...axis}
                        yAxisId="share"
                        orientation="right"
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        width={48}
                      />
                      <Tooltip
                        {...tip}
                        formatter={(v, name) =>
                          name === "Cumulative %"
                            ? `${Number(v).toFixed(1)}%`
                            : number.format(Number(v))
                        }
                      />
                      <Bar
                        yAxisId="count"
                        dataKey="count"
                        name="Defects"
                        fill="#f78c45"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={false}
                      />
                      <Line
                        yAxisId="share"
                        dataKey="share"
                        name="Cumulative %"
                        stroke="#b5aaf2"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <p className="chart-note">
                Scroll horizontally to read all categories. Equal counts share a
                cumulative rank.
              </p>
            </ChartPanel>
            <ChartPanel
              title="Inspection area performance"
              subtitle="DPU for selected dates and one-month-shifted dates"
            >
              <p className="chart-note">Prior dates: {prior}</p>
              <div className="area-table">
                <div className="area-table-head">
                  <span>AREA</span>
                  <span>DPU</span>
                  <span>PRIOR DPU</span>
                  <span>DRR</span>
                </div>
                {data.areas.map((a) => (
                  <div
                    className="area-row"
                    key={a.area}
                    title={`${number.format(a.defects)} defects / ${number.format(a.cars)} cars`}
                  >
                    <div>
                      <span>{a.area}</span>
                      <div className="area-track">
                        <i
                          style={{
                            width: `${((a.dpu ?? 0) / Math.max(...data.areas.map((x) => x.dpu ?? 0), 0.01)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <strong>{ratio(a.dpu)}</strong>
                    <span className="previous-value">
                      {ratio(a.previousDpu)}
                    </span>
                    <span className="rate-value">{percent(a.drr)}</span>
                  </div>
                ))}
              </div>
              {!data.areas.length && (
                <p className="chart-note">
                  No records in the displayed inspection areas.
                </p>
              )}
            </ChartPanel>
          </div>
          <div className="ftt-panel">
            <div className="ftt-icon">
              <CircleCheck size={22} />
            </div>
            <div>
              <strong>First time through</strong>
              <p>
                Six-stage presence and no-defect checks, following the source
                measure. See methodology for area-filter behavior.
              </p>
            </div>
            <div className="ftt-number">
              {valid ? percent(k.ftt) : "—"}
              <span>
                {number.format(k.fttCars)} of {number.format(k.cars)} cars
              </span>
            </div>
          </div>
          <section
            id="findings"
            className="portfolio-section"
            aria-labelledby="findings-title"
          >
            <h2 id="findings-title">Key findings</h2>
            <p className="section-intro">
              Descriptive results for the current selection. Filters affect both
              findings and vehicle denominators.
            </p>
            {data.insights.length ? (
              <ul className="insights-grid">
                {data.insights.map((insight) => (
                  <li key={insight}>{insight}</li>
                ))}
              </ul>
            ) : (
              <p className="chart-note">
                No eligible defect findings in this selection.
              </p>
            )}
          </section>
          <section className="portfolio-section" aria-labelledby="models-title">
            <h2 id="models-title">Model comparison</h2>
            <p className="section-intro">
              Uses the same global filters. Selecting a model limits the
              comparison to that model.
            </p>
            <div className="table-scroll">
              <table className="model-table">
                <thead>
                  <tr>
                    <th scope="col">Model</th>
                    <th scope="col">Cars inspected</th>
                    <th scope="col">Defects recorded</th>
                    <th scope="col">DPU</th>
                  </tr>
                </thead>
                <tbody>
                  {data.models.map((m) => (
                    <tr key={m.model}>
                      <th scope="row">{m.model}</th>
                      <td>{number.format(m.cars)}</td>
                      <td>{number.format(m.defects)}</td>
                      <td>{ratio(m.dpu)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.models.length && (
              <p className="chart-note">No models match the selection.</p>
            )}
          </section>
          <details id="methodology" className="portfolio-section methodology">
            <summary>About the data & metric definitions</summary>
            <p>
              This portfolio demo uses synthetic, anonymized inspection records:
              20,288 records, 2,296 vehicles and three models. It demonstrates
              analytical methods and does not describe a real factory's
              performance.
            </p>
            <dl>
              <dt>Cars & defects</dt>
              <dd>
                Cars count distinct inspected vehicles with a model. Defects
                count flagged findings; repeated inspection records remain
                included.
              </dd>
              <dt>DPU & DRR</dt>
              <dd>
                DPU is defects divided by cars. DRR is the share of cars without
                a recorded defect. Area and finding-type filters affect the
                denominator too.
              </dd>
              <dt>FTT</dt>
              <dd>
                Vehicles must appear at all six required stages. Stage-presence
                checks include all areas; the no-defect check follows the
                selected area. This preserves the original measure and may
                differ from an operational FTT definition.
              </dd>
              <dt>Dates & comparison</dt>
              <dd>
                Stored production dates are used without an additional shift.
                Days without eligible vehicles are omitted; real zero-defect
                days remain. Rolling DPU divides defects by distinct cars over
                30 calendar days and includes earlier history where available.
                Prior DPU shifts the selected date set one month back with
                month-end extension.
              </dd>
              <dt>Scope & limits</dt>
              <dd>
                Pareto covers Focus / Mass findings. The area table preserves
                the source page's stage selection, excluding Sign Off.
                Comparisons are descriptive and do not establish causes or
                targets. Automated reference checks pass; direct Power BI engine
                validation remains pending.
              </dd>
            </dl>
          </details>
          <footer>
            <span>
              <Database size={13} />
              Synthetic inspection dataset · Power BI source
            </span>
            <span>React analytics portfolio · Browser-only</span>
          </footer>
          {notice && (
            <div role="status" className="toast">
              {notice}
              <button
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
