/**
 * Tipos core do Sanum
 */

export type MarkerFlag = "normal" | "low" | "high" | "critical_low" | "critical_high";

export type MarkerCategory =
  | "hematology"
  | "metabolism"
  | "renal"
  | "hepatic"
  | "thyroid"
  | "iron"
  | "vitamins"
  | "inflammation"
  | "coagulation"
  | "lipids"
  | "electrolytes"
  | "hormones"
  | "other";

export interface Marker {
  id: string; // uuid gerado client-side
  name: string; // Nome normalizado (ex: "Hemoglobina")
  originalName: string; // Nome como aparece no PDF
  value: number;
  unit: string;
  refMin: number | null;
  refMax: number | null;
  refText: string; // "12.0 - 16.0"
  category: MarkerCategory;
  flag: MarkerFlag;
}

export interface Report {
  id: string;
  labName: string;
  reportDate: string; // ISO date
  patientName?: string;
  patientAge?: number;
  patientSex?: "M" | "F";
  markers: Marker[];
  createdAt: string;
}

export interface Analysis {
  summary: string;
  attentionItems: AttentionItem[];
  positives: string[];
  correlations: Correlation[];
}

export interface AttentionItem {
  markerName: string;
  severity: "mild" | "moderate" | "significant";
  message: string;
}

export interface Correlation {
  markers: string[];
  message: string;
}

// Categoria labels PT
export const CATEGORY_LABELS: Record<MarkerCategory, string> = {
  hematology: "Hematologia",
  metabolism: "Metabolismo",
  renal: "Função Renal",
  hepatic: "Função Hepática",
  thyroid: "Função Tiroideia",
  iron: "Metabolismo do Ferro",
  vitamins: "Vitaminas",
  inflammation: "Inflamação",
  coagulation: "Coagulação",
  lipids: "Lípidos",
  electrolytes: "Eletrólitos",
  hormones: "Hormonas",
  other: "Outros"
};

// Flag para emoji
export const FLAG_EMOJI: Record<MarkerFlag, string> = {
  normal: "🟢",
  low: "🟡",
  high: "🟡",
  critical_low: "🔴",
  critical_high: "🔴"
};

// Flag para cor tailwind
export const FLAG_COLOR: Record<MarkerFlag, string> = {
  normal: "bg-green-100 text-green-800 border-green-200",
  low: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-yellow-100 text-yellow-800 border-yellow-200",
  critical_low: "bg-red-100 text-red-800 border-red-200",
  critical_high: "bg-red-100 text-red-800 border-red-200"
};
