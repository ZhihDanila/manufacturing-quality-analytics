import { useMemo, useState } from "react";
import source from "../data/records.json";
import { dashboard } from "../lib/analytics";
import type { QualityRecord, Filters } from "../types/quality";
export const records = source as QualityRecord[];
const dates = records.map((r) => r.date).sort();
export const initialFilters: Filters = {
  start: dates[0],
  end: dates.at(-1)!,
  model: "",
  area: "",
  defectType: "",
};
export function useDashboard() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const data = useMemo(() => dashboard(records, filters), [filters]);
  const options = useMemo(
    () => ({
      models: [
        ...new Set(records.map((r) => r.model).filter((m): m is string => !!m)),
      ].sort(),
      areas: [...new Set(records.map((r) => r.area))].sort(),
      types: [...new Set(records.map((r) => r.defectType))].sort(),
    }),
    [],
  );
  return { filters, setFilters, data, options };
}
