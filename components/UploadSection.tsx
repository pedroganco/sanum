"use client";

import { useState, useCallback } from "react";

interface UploadSectionProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

export function UploadSection({ onUpload, isLoading }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      onUpload(file);
    } else {
      alert("Por favor, seleciona um ficheiro PDF válido.");
    }
  }, [onUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  }, [onUpload]);

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent mb-6"></div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">A processar as tuas análises...</h2>
        <p className="text-gray-500">Isto demora normalmente 5-10 segundos</p>
        <div className="mt-8 space-y-2 text-sm text-gray-400">
          <p>A extrair texto do PDF...</p>
          <p>A identificar marcadores...</p>
          <p>A calcular referências...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-4">
          Sanum
        </h1>
        <p className="text-xl sm:text-2xl text-gray-600 mb-2">
          Percebe as tuas análises clínicas em segundos
        </p>
        <p className="text-base text-gray-500">
          Sem conta. Sem registo. Os teus dados nunca são guardados.
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 sm:p-16 text-center
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? "border-green-400 bg-green-50"
            : "border-gray-300 bg-gray-50 hover:border-green-300 hover:bg-green-50/50"
          }
        `}
      >
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          id="file-upload"
        />

        <div className="pointer-events-none">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-lg text-gray-700 mb-2 font-medium">
            Arrasta o teu PDF para aqui
          </p>
          <p className="text-sm text-gray-500 mb-4">
            ou clica para selecionar
          </p>
          <p className="text-xs text-gray-400">
            Aceita PDFs de qualquer laboratório português (máx. 10MB)
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📄</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">1. Upload</h3>
          <p className="text-sm text-gray-500">Envia as tuas análises em PDF</p>
        </div>
        <div className="text-center">
          <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🤖</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">2. Análise AI</h3>
          <p className="text-sm text-gray-500">Extraímos e analisamos os marcadores</p>
        </div>
        <div className="text-center">
          <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">✨</span>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">3. Resultados</h3>
          <p className="text-sm text-gray-500">Percebe o que merece atenção</p>
        </div>
      </div>
    </div>
  );
}
