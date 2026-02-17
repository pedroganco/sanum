"use client";

import { useState, useMemo } from "react";
import type { Report, MarkerCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { MarkerCard } from "./MarkerCard";
import { MarkerModal } from "./MarkerModal";
import { AIAnalysisSection } from "./AIAnalysisSection";

interface DashboardProps {
  report: Report;
  onReset: () => void;
}

export function Dashboard({ report, onReset }: DashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<MarkerCategory | "all">("all");
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Agrupar marcadores por categoria
  const markersByCategory = useMemo(() => {
    const groups: Partial<Record<MarkerCategory, typeof report.markers>> = {};

    report.markers.forEach((marker) => {
      if (!groups[marker.category]) {
        groups[marker.category] = [];
      }
      groups[marker.category]!.push(marker);
    });

    return groups;
  }, [report.markers]);

  // Categorias disponíveis
  const availableCategories = useMemo(() => {
    return Object.keys(markersByCategory) as MarkerCategory[];
  }, [markersByCategory]);

  // Marcadores filtrados
  const filteredMarkers = useMemo(() => {
    if (selectedCategory === "all") {
      return report.markers;
    }
    return markersByCategory[selectedCategory] || [];
  }, [selectedCategory, report.markers, markersByCategory]);

  // Contagens por flag
  const flagCounts = useMemo(() => {
    const normal = report.markers.filter(m => m.flag === "normal").length;
    const warning = report.markers.filter(m => m.flag === "low" || m.flag === "high").length;
    const critical = report.markers.filter(m => m.flag === "critical_low" || m.flag === "critical_high").length;
    return { normal, warning, critical };
  }, [report.markers]);

  const selectedMarker = selectedMarkerId
    ? report.markers.find(m => m.id === selectedMarkerId)
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {report.labName}
          </h1>
          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
            <span>{new Date(report.reportDate).toLocaleDateString("pt-PT")}</span>
            {report.patientName && (
              <span className="hidden">• {report.patientName}</span>
            )}
            {report.patientAge && (
              <span>• {report.patientAge} anos</span>
            )}
          </div>
        </div>

        <button
          onClick={onReset}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Nova análise
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-3xl font-bold text-green-900">{flagCounts.normal}</div>
          <div className="text-sm text-green-700">Valores normais</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="text-3xl font-bold text-yellow-900">{flagCounts.warning}</div>
          <div className="text-sm text-yellow-700">A vigiar</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-3xl font-bold text-red-900">{flagCounts.critical}</div>
          <div className="text-sm text-red-700">Alterados</div>
        </div>
      </div>

      {/* AI Analysis CTA */}
      <AIAnalysisSection report={report} />

      {/* Category tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              selectedCategory === "all"
                ? "border-green-500 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Todos ({report.markers.length})
          </button>
          {availableCategories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                selectedCategory === category
                  ? "border-green-500 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {CATEGORY_LABELS[category]} ({markersByCategory[category]!.length})
            </button>
          ))}
        </div>
      </div>

      {/* Markers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMarkers.map((marker) => (
          <MarkerCard
            key={marker.id}
            marker={marker}
            onClick={() => setSelectedMarkerId(marker.id)}
          />
        ))}
      </div>

      {/* Marker Detail Modal */}
      {selectedMarker && (
        <MarkerModal
          marker={selectedMarker}
          onClose={() => setSelectedMarkerId(null)}
        />
      )}
    </div>
  );
}
