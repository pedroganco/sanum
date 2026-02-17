"use client";

import { useState } from "react";
import type { Report, Analysis } from "@/lib/types";

interface AIAnalysisSectionProps {
  report: Report;
}

export function AIAnalysisSection({ report }: AIAnalysisSectionProps) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reports: [report],
          patientAge: report.patientAge,
          patientSex: report.patientSex,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar análise");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  if (analysis) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">🩺</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Análise AI</h2>
            <p className="text-sm text-gray-600">Resumo inteligente dos teus resultados</p>
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-white rounded-xl p-4 mb-4">
          <p className="text-gray-800 leading-relaxed">{analysis.summary}</p>
        </div>

        {/* Pontos positivos */}
        {analysis.positives.length > 0 && (
          <div className="bg-white rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <span>✅</span> O que está bem
            </h3>
            <ul className="space-y-1">
              {analysis.positives.map((positive, idx) => (
                <li key={idx} className="text-sm text-gray-700">• {positive}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Pontos de atenção */}
        {analysis.attentionItems.length > 0 && (
          <div className="bg-white rounded-xl p-4 mb-4">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <span>⚠️</span> Pontos a vigiar
            </h3>
            <ul className="space-y-2">
              {analysis.attentionItems.map((item, idx) => (
                <li key={idx} className="text-sm">
                  <span className="font-medium text-gray-900">{item.markerName}:</span>{" "}
                  <span className="text-gray-700">{item.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Correlações */}
        {analysis.correlations.length > 0 && (
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <span>🔗</span> Correlações identificadas
            </h3>
            <ul className="space-y-2">
              {analysis.correlations.map((corr, idx) => (
                <li key={idx} className="text-sm text-gray-700">
                  • {corr.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p className="text-red-800 mb-4">{error}</p>
        <button
          onClick={handleAnalyze}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🩺</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Análise AI global</h2>
            <p className="text-sm text-gray-600">
              Obtém um resumo inteligente das tuas análises com correlações e recomendações
            </p>
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span>
              A analisar...
            </span>
          ) : (
            "Gerar análise AI"
          )}
        </button>
      </div>
    </div>
  );
}
