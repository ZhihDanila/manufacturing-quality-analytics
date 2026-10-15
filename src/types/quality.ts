export interface QualityRecord {
  vin: string | null;
  model: string | null;
  area: string;
  defect: string | null;
  defectType: string;
  realDefect: number;
  date: string;
  group: string;
  part: string;
}
export interface Filters {
  start: string;
  end: string;
  model: string;
  area: string;
  defectType: string;
}
