"use client";

import { useEffect } from "react";
import type { Marker } from "@/lib/types";
import { FLAG_EMOJI, FLAG_COLOR } from "@/lib/types";
import { findMarkerInfo } from "@/lib/markers-database";

interface MarkerModalProps {
  marker: Marker;
  onClose: () => void;
}

export function MarkerModal({ marker, onClose }: MarkerModalProps) {
  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Buscar info da base local
  const markerInfo = findMarkerInfo(marker.name);

  // Calcular posição na barra
  const getBarPosition = () => {
    if (marker.refMin === null && marker.refMax === null) return 50;
    if (marker.refMin === null) return Math.min((marker.value / marker.refMax!) * 100, 100);
    if (marker.refMax === null) return Math.max(((marker.value - marker.refMin) / marker.refMin) * 100, 0);

    const range = marker.refMax - marker.refMin;
    const position = ((marker.value - marker.refMin) / range) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const position = getBarPosition();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{FLAG_EMOJI[marker.flag]}</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{marker.name}</h2>
              {marker.originalName !== marker.name && (
                <p className="text-sm text-gray-500">{marker.originalName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Valor atual */}
          <div className={`rounded-xl border-2 p-6 ${FLAG_COLOR[marker.flag]}`}>
            <div className="text-sm font-medium mb-2">O teu valor</div>
            <div className="text-4xl font-bold mb-4">
              {marker.value} {marker.unit}
            </div>

            {/* Barra visual */}
            {(marker.refMin !== null || marker.refMax !== null) && (
              <div>
                <div className="h-3 bg-white/50 rounded-full relative overflow-hidden mb-2">
                  <div
                    className={`absolute top-0 bottom-0 w-1.5 ${
                      marker.flag === "normal" ? "bg-green-600" :
                      marker.flag === "low" || marker.flag === "high" ? "bg-yellow-600" :
                      "bg-red-600"
                    }`}
                    style={{ left: `${position}%`, transform: "translateX(-50%)" }}
                  />
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span>{marker.refMin ?? "—"}</span>
                  <span>Referência: {marker.refText}</span>
                  <span>{marker.refMax ?? "—"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Informação da base local */}
          {markerInfo ? (
            <>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">O que é?</h3>
                <p className="text-gray-700">{markerInfo.whatIs}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Para que serve?</h3>
                <p className="text-gray-700">{markerInfo.whatFor}</p>
              </div>

              {marker.flag !== "normal" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">O que pode significar?</h3>
                  <p className="text-blue-800">
                    {marker.flag === "low" || marker.flag === "critical_low"
                      ? markerInfo.lowMeaning
                      : markerInfo.highMeaning}
                  </p>
                </div>
              )}

              {markerInfo.commonCauses.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Causas comuns de alteração</h3>
                  <ul className="space-y-1">
                    {markerInfo.commonCauses.map((cause, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="text-gray-700">{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-gray-600">
                Informação detalhada não disponível para este marcador.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <p className="text-xs text-gray-500 text-center">
            Esta informação é educativa. Consulta o teu médico para interpretação clínica.
          </p>
        </div>
      </div>
    </div>
  );
}
