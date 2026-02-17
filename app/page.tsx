"use client";

import { useState } from "react";
import { UploadSection } from "@/components/UploadSection";
import { Dashboard } from "@/components/Dashboard";
import { Disclaimer } from "@/components/Disclaimer";
import type { Report } from "@/lib/types";

export default function Home() {
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async (file: File) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao processar o PDF");
      }

      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error("Erro:", error);
      alert(error instanceof Error ? error.message : "Erro ao processar análises");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Disclaimer />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {!report ? (
          <UploadSection onUpload={handleUpload} isLoading={isLoading} />
        ) : (
          <Dashboard report={report} onReset={() => setReport(null)} />
        )}
      </div>
    </div>
  );
}
