import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import Anthropic from "@anthropic-ai/sdk";
import type { Marker, Report } from "@/lib/types";
import { normalizeMarkerName, calculateFlag, findMarkerInfo, getReference } from "@/lib/markers-database";

// Rate limiting simples (in-memory)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // 10 requests
const RATE_WINDOW = 15 * 60 * 1000; // 15 minutos

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (limit.count >= RATE_LIMIT) {
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, message: "Demasiados pedidos. Tenta novamente em 15 minutos." },
        { status: 429 }
      );
    }

    // Parse multipart form
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Nenhum ficheiro enviado" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, message: "Apenas ficheiros PDF são aceites" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "Ficheiro demasiado grande (máx. 10MB)" },
        { status: 400 }
      );
    }

    // Guardar PDF temporariamente
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPath = join(tmpdir(), `sanum-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`);
    await writeFile(tempPath, buffer);

    try {
      // Extrair texto com pdftotext
      const text = await extractTextFromPDF(tempPath);

      if (!text || text.trim().length < 50) {
        return NextResponse.json(
          { success: false, message: "Não foi possível extrair texto do PDF. Verifica se o PDF não está protegido ou é scan." },
          { status: 422 }
        );
      }

      // Parse com Claude
      const report = await parseWithClaude(text);

      return NextResponse.json({
        success: true,
        report,
        extractionMethod: "pdftotext",
      });
    } finally {
      // Limpar ficheiro temporário
      await unlink(tempPath).catch(() => {});
    }
  } catch (error) {
    console.error("Erro no /api/parse:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno ao processar PDF" },
      { status: 500 }
    );
  }
}

/**
 * Extrai texto de PDF usando pdftotext (poppler-utils)
 */
async function extractTextFromPDF(pdfPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdftotext = spawn("pdftotext", ["-layout", pdfPath, "-"]);
    let output = "";
    let error = "";

    pdftotext.stdout.on("data", (data) => {
      output += data.toString();
    });

    pdftotext.stderr.on("data", (data) => {
      error += data.toString();
    });

    pdftotext.on("close", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`pdftotext failed: ${error}`));
      }
    });

    pdftotext.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Parse do texto extraído usando Claude
 */
async function parseWithClaude(text: string): Promise<Report> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY não configurada");
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = `Analisa o seguinte texto extraído de um PDF de análises clínicas de um laboratório português.
Extrai TODOS os marcadores/parâmetros encontrados.

Para cada marcador, identifica:
- name: nome do marcador (tenta normalizar para nomes standard portugueses)
- originalName: nome exacto como aparece no PDF
- value: valor numérico (float)
- unit: unidade (ex: "g/dL", "mg/dL", "U/L", "x10³/µL", "x10⁶/µL")
- refMin: valor mínimo de referência (float ou null)
- refMax: valor máximo de referência (float ou null)
- refText: texto original da referência (ex: "12.0 - 16.0")
- category: categoria (escolhe entre: "hematology", "metabolism", "renal", "hepatic", "thyroid", "iron", "vitamins", "inflammation", "coagulation", "lipids", "electrolytes", "hormones", "other")

Também extrai metadados:
- labName: nome do laboratório
- reportDate: data do relatório (formato ISO YYYY-MM-DD)
- patientName: nome do paciente (se visível, mas OMITE se tiveres dúvidas - privacidade)
- patientAge: idade em anos (integer, se visível)
- patientSex: "M" ou "F" (se visível)

IMPORTANTE:
- Ignora valores não-numéricos (ex: "Não Reactivo", "Positivo", etc) - esses não são marcadores quantitativos
- Se um marcador tiver "< X" ou "> X", usa X como valor e ajusta refMin/refMax em conformidade
- Normaliza nomes de marcadores para português standard (ex: "Hemoglobina" em vez de "Hemoglobina (HGB)")
- NUNCA inventes valores - se não conseguires extrair, não incluas o marcador

Responde APENAS com JSON válido neste formato:
{
  "labName": "...",
  "reportDate": "YYYY-MM-DD",
  "patientName": "..." ou null,
  "patientAge": número ou null,
  "patientSex": "M" ou "F" ou null,
  "markers": [
    {
      "name": "...",
      "originalName": "...",
      "value": número,
      "unit": "...",
      "refMin": número ou null,
      "refMax": número ou null,
      "refText": "...",
      "category": "..."
    }
  ]
}

TEXTO DO PDF:
${text}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  // Parse JSON
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Claude não retornou JSON válido");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Normalizar e enriquecer marcadores
  const markers: Marker[] = parsed.markers.map((m: any) => {
    const normalizedName = normalizeMarkerName(m.name);
    const markerInfo = findMarkerInfo(normalizedName);

    // Usar unidade da base se disponível
    const unit = markerInfo?.unit || m.unit;

    // Calcular flag
    const flag = calculateFlag(m.value, m.refMin, m.refMax);

    return {
      id: crypto.randomUUID(),
      name: normalizedName,
      originalName: m.originalName,
      value: m.value,
      unit,
      refMin: m.refMin,
      refMax: m.refMax,
      refText: m.refText || `${m.refMin ?? "—"} - ${m.refMax ?? "—"}`,
      category: m.category,
      flag,
    };
  });

  const report: Report = {
    id: crypto.randomUUID(),
    labName: parsed.labName || "Laboratório desconhecido",
    reportDate: parsed.reportDate || new Date().toISOString().split("T")[0],
    patientName: parsed.patientName,
    patientAge: parsed.patientAge,
    patientSex: parsed.patientSex,
    markers,
    createdAt: new Date().toISOString(),
  };

  return report;
}
