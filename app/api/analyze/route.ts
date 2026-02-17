import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Report, Analysis } from "@/lib/types";

// Rate limiting
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 15 * 60 * 1000;

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

    const body = await request.json();
    const { reports, patientAge, patientSex } = body as {
      reports: Report[];
      patientAge?: number;
      patientSex?: "M" | "F";
    };

    if (!reports || reports.length === 0) {
      return NextResponse.json(
        { success: false, message: "Nenhum relatório fornecido" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY não configurada");
    }

    const anthropic = new Anthropic({ apiKey });

    // Preparar dados dos marcadores
    const report = reports[0]; // MVP: apenas 1 relatório
    const markersData = report.markers.map(m => ({
      name: m.name,
      value: m.value,
      unit: m.unit,
      refMin: m.refMin,
      refMax: m.refMax,
      flag: m.flag,
    }));

    const prompt = `És um assistente médico que analisa resultados de análises clínicas.

Paciente:
${patientAge ? `- Idade: ${patientAge} anos` : "- Idade: não especificada"}
${patientSex ? `- Sexo: ${patientSex}` : "- Sexo: não especificado"}

Marcadores (${markersData.length} no total):
${JSON.stringify(markersData, null, 2)}

Faz uma análise GLOBAL destes resultados, seguindo RIGOROSAMENTE este formato JSON:

{
  "summary": "Resumo narrativo em 2-4 frases sobre o estado geral das análises, em linguagem simples e acessível. Menciona o que está bem e o que merece atenção, mas sem alarmar.",

  "positives": [
    "Lista de 2-5 aspectos positivos encontrados (ex: 'Hemograma completo sem alterações', 'Função tiroideia normal')"
  ],

  "attentionItems": [
    {
      "markerName": "Nome do marcador",
      "severity": "mild" | "moderate" | "significant",
      "message": "Explicação clara do que está alterado e o que pode significar (1-2 frases)"
    }
  ],

  "correlations": [
    {
      "markers": ["Marcador1", "Marcador2", ...],
      "message": "Explicação da correlação encontrada entre estes marcadores (ex: 'Ferro baixo com ferritina baixa sugere deficiência de ferro')"
    }
  ]
}

IMPORTANTE:
- Usa linguagem SIMPLES, como se estivesses a falar com alguém sem formação médica
- Evita jargão técnico excessivo
- Usa "pode indicar", "pode merecer atenção" - NUNCA uses linguagem alarmista ou diagnósticos definitivos
- Sê empático e tranquilizador quando apropriado
- Foca em correlações RELEVANTES (não menciones todas as combinações possíveis)
- Se está tudo normal, celebra isso!

Responde APENAS com JSON válido.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Claude não retornou JSON válido");
    }

    const analysis: Analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Erro no /api/analyze:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno ao gerar análise" },
      { status: 500 }
    );
  }
}
