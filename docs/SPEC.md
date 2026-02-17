# Sanum — Especificação do Produto v1

> **Última atualização:** 2026-02-17
> **URL:** sanum.pt
> **Stack:** Next.js 15 + Tailwind v4 · Docker · Traefik · Claude/OpenAI API

---

## 1. Vision & Princípios

### Visão
Qualquer pessoa em Portugal consegue fazer upload das suas análises clínicas e, em segundos, perceber o que está bem e o que merece atenção — sem criar conta, sem partilhar dados, sem precisar de esperar pela próxima consulta.

### Princípios fundamentais

| Princípio | Implicação |
|-----------|------------|
| **Zero fricção** | Sem contas, sem login, sem onboarding. Upload → resultado. |
| **Privacy-first** | Dados nunca persistem no servidor. Processados e descartados. |
| **Não substitui médicos** | Disclaimer sempre visível. Linguagem cuidadosa ("pode merecer atenção" vs "tem um problema"). |
| **Acessível** | Mobile-first, linguagem simples, visual intuitivo (semáforos). |
| **Prático** | Foco em actionable insights, não em jargão médico. |

---

## 2. User Flow

### Flow principal (happy path)

```
1. Landing page
   └─ Headline clara + área de upload (drag & drop ou botão)
   └─ Disclaimer médico visível

2. Upload de PDF(s)
   └─ Utilizador arrasta 1 ou mais PDFs
   └─ Barra de progresso por ficheiro
   └─ Validação: é PDF? Tem conteúdo extraível?

3. Extração de dados (2-8s)
   └─ Loading skeleton com mensagens contextuais
   │   ("A ler as suas análises...", "A identificar marcadores...")
   └─ Se PDF é text-based → pdftotext no server
   └─ Se PDF é scan/imagem → OCR via Vision API
   └─ LLM parsing do texto → JSON estruturado

4. Pedido de contexto (se necessário)
   └─ Se idade/sexo não foram extraídos do PDF:
   │   modal simples a perguntar (opcional, pode saltar)
   └─ Se data da análise não foi extraída: perguntar

5. Dashboard de resultados
   └─ Header: lab, data, nome do paciente (se extraído)
   └─ Grid de marcadores com semáforo 🟢🟡🔴
   └─ Organizados por categoria (tabs ou accordion)
   └─ Resumo AI no topo (o que está bem, o que precisa atenção)

6. Interação com marcadores
   └─ Click num marcador → painel lateral ou modal
   │   └─ Valor actual vs referência
   │   └─ Explicação: o que é, para que serve
   │   └─ Contexto: o que significa estar alto/baixo
   │   └─ Causas comuns de alteração
   └─ Se múltiplos PDFs: gráfico de evolução temporal

7. Análise AI global
   └─ Secção dedicada com resumo narrativo
   └─ Correlações entre marcadores
   └─ Tendências (se múltiplos uploads)

8. Export
   └─ Botão "Descarregar relatório PDF"
   └─ PDF formatado com todos os dados + análise AI

9. Guardar localmente (opcional)
   └─ Toggle "Guardar no browser para comparação futura"
   └─ Dados ficam em localStorage
```

### Flows alternativos

- **PDF inválido/ilegível:** mensagem de erro amigável + sugestão de tentar outro ficheiro
- **PDF scan com OCR fraco:** aviso de que alguns valores podem não ter sido extraídos + opção de corrigir manualmente
- **Rate limit atingido:** mensagem de "tenta novamente em X minutos"
- **Múltiplos PDFs do mesmo lab:** agrupar automaticamente por data
- **Múltiplos PDFs de labs diferentes:** unificar marcadores com nomes normalizados

---

## 3. Features v1 — MoSCoW

### Must Have (P0)

| # | Feature | Descrição |
|---|---------|-----------|
| 1 | Upload de PDFs | Drag & drop + file picker, múltiplos ficheiros, validação |
| 2 | Parsing text-based | pdftotext + LLM parsing para PDFs com texto embutido |
| 3 | Dashboard semáforo | Grid de marcadores com 🟢🟡🔴, organizados por categoria |
| 4 | Análise AI global | Resumo narrativo dos resultados |
| 5 | Explicação individual | Click → explicação detalhada do marcador |
| 6 | Disclaimer médico | Banner persistente + modal no primeiro uso |
| 7 | Responsive design | Funcional em mobile, tablet e desktop |
| 8 | Sem persistência server | Dados processados e descartados após response |

### Should Have (P1)

| # | Feature | Descrição |
|---|---------|-----------|
| 9 | OCR para scans | Vision API para PDFs baseados em imagem |
| 10 | Evolução temporal | Gráficos de evolução com múltiplos PDFs |
| 11 | localStorage | Guardar resultados no browser para comparação futura |
| 12 | Contexto idade/sexo | Valores de referência ajustados |
| 13 | Export PDF | Relatório formatado para download |

### Could Have (P2)

| # | Feature | Descrição |
|---|---------|-----------|
| 14 | Correcção manual | Editar valores mal extraídos |
| 15 | Comparação lado-a-lado | Duas análises em paralelo |
| 16 | Partilha por link | Gerar link temporário (dados encoded no URL ou efémero) |
| 17 | Dark mode | Tema escuro |

### Won't Have (v1)

- Contas de utilizador / autenticação
- Base de dados persistente
- Notificações / lembretes
- Integração com sistemas de saúde (SNS, eSaúde)
- App nativa

---

## 4. Arquitectura Técnica

### Visão geral

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│                                                  │
│  Next.js App (SSR + Client Components)           │
│  ├─ Upload Component                             │
│  ├─ Dashboard Component                          │
│  ├─ Charts (Recharts/Chart.js)                   │
│  ├─ PDF Export (jsPDF / @react-pdf/renderer)     │
│  └─ localStorage adapter                         │
│                                                  │
└──────────────┬──────────────────────────────────┘
               │ POST /api/parse (multipart)
               │ POST /api/analyze (JSON)
               │ POST /api/explain (JSON)
               ▼
┌─────────────────────────────────────────────────┐
│              Next.js API Routes                  │
│                                                  │
│  /api/parse                                      │
│  ├─ Recebe PDF binary                            │
│  ├─ pdftotext (poppler) → texto                  │
│  ├─ Se texto vazio → Vision API (OCR)            │
│  ├─ LLM structured extraction → JSON             │
│  └─ Response: marcadores JSON (nada guardado)    │
│                                                  │
│  /api/analyze                                    │
│  ├─ Recebe array de marcadores (JSON)            │
│  ├─ LLM análise global                           │
│  └─ Response: resumo + correlações               │
│                                                  │
│  /api/explain                                    │
│  ├─ Recebe marcador + valor + contexto           │
│  ├─ LLM explicação detalhada                     │
│  └─ Response: explicação estruturada             │
│                                                  │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────┐
│  Claude / OpenAI    │
│  API                │
└─────────────────────┘
```

### Stack detalhada

| Camada | Tecnologia | Notas |
|--------|-----------|-------|
| Framework | Next.js 15 (App Router) | Server Components + API Routes |
| Styling | Tailwind CSS v4 | Utility-first |
| Charts | Recharts | Lightweight, React-native |
| PDF parsing | poppler-utils (pdftotext) | Instalado no Docker image |
| OCR fallback | Claude Vision / GPT-4V | Para PDFs scan-based |
| LLM extraction | Claude 3.5 Sonnet | Structured output (JSON) |
| LLM análise | Claude 3.5 Sonnet | Análise narrativa |
| PDF export | @react-pdf/renderer | Relatório formatado |
| Deploy | Docker + Traefik | VPS existente |
| Rate limiting | In-memory (Map) ou upstash | Por IP, sem DB |

### Parsing Pipeline (detalhe)

```
PDF binary
  │
  ├─► pdftotext -layout input.pdf -
  │     │
  │     ├─ texto não-vazio (>100 chars úteis)
  │     │     │
  │     │     └─► LLM Extraction Prompt
  │     │           "Extrai marcadores deste texto de análises clínicas..."
  │     │           → JSON estruturado
  │     │
  │     └─ texto vazio ou lixo
  │           │
  │           └─► Vision API (enviar PDF como imagens)
  │                 "Extrai todos os marcadores clínicos desta imagem..."
  │                 → JSON estruturado
  │
  └─► Validação + normalização do JSON
        ├─ Nomes de marcadores normalizados (mapping table)
        ├─ Unidades normalizadas
        ├─ Valores numéricos parseados
        └─ Metadados: lab, data, paciente
```

### LLM Extraction Prompt (exemplo)

```
Analisa o seguinte texto extraído de um PDF de análises clínicas de um laboratório português.
Extrai TODOS os marcadores/parâmetros encontrados.

Para cada marcador, devolve:
- name: nome do marcador (normalizado, ex: "Hemoglobina")
- originalName: nome exacto como aparece no PDF
- value: valor numérico (float)
- unit: unidade (ex: "g/dL", "mg/dL", "U/L")
- refMin: valor mínimo de referência (float ou null)
- refMax: valor máximo de referência (float ou null)
- refText: texto original da referência (ex: "12.0-16.0")
- category: categoria (ex: "Hematologia", "Bioquímica")
- flag: "normal" | "low" | "high" | "critical_low" | "critical_high"

Também extrai metadados:
- labName: nome do laboratório
- reportDate: data do relatório (ISO 8601)
- patientName: nome do paciente (se visível)
- patientAge: idade (se visível)
- patientSex: "M" | "F" (se visível)

Responde APENAS com JSON válido.
```

---

## 5. Data Model

### Marcador (`Marker`)

```typescript
interface Marker {
  id: string;                    // uuid gerado client-side
  name: string;                  // "Hemoglobina" (normalizado)
  originalName: string;          // "Hemoglobina (HGB)" (como no PDF)
  value: number;                 // 14.2
  unit: string;                  // "g/dL"
  refMin: number | null;         // 12.0
  refMax: number | null;         // 16.0
  refText: string;               // "12.0 - 16.0"
  category: MarkerCategory;      // "hematology"
  flag: MarkerFlag;              // "normal"
  ageAdjustedFlag?: MarkerFlag;  // flag ajustada para idade/sexo
}

type MarkerFlag = "normal" | "low" | "high" | "critical_low" | "critical_high";

type MarkerCategory =
  | "hematology"        // Hemograma
  | "metabolism"        // Glicose, HbA1c, Colesterol, Triglicéridos
  | "renal"             // Creatinina, Ureia, Ácido Úrico
  | "hepatic"           // AST, ALT, GGT, Bilirrubina, FA
  | "thyroid"           // TSH, T3, T4
  | "iron"              // Ferro, Ferritina, Transferrina
  | "vitamins"          // Vitamina D, B12, Ácido Fólico
  | "inflammation"      // PCR, VS
  | "coagulation"       // PT, INR, aPTT
  | "urinalysis"        // Urina tipo II
  | "hormones"          // Testosterona, Cortisol, etc.
  | "lipids"            // Colesterol total, HDL, LDL, Triglicéridos
  | "electrolytes"      // Sódio, Potássio, Cálcio, Magnésio
  | "other";
```

### Relatório (`Report`)

```typescript
interface Report {
  id: string;                    // uuid
  labName: string;               // "Germano de Sousa"
  reportDate: string;            // "2026-01-15" (ISO)
  patientName?: string;
  patientAge?: number;
  patientSex?: "M" | "F";
  markers: Marker[];
  rawText?: string;              // texto extraído (apenas em memória)
  createdAt: string;             // timestamp do upload
}
```

### Análise AI (`Analysis`)

```typescript
interface Analysis {
  summary: string;               // Resumo global em linguagem simples
  attentionItems: AttentionItem[];
  positives: string[];           // O que está bem
  correlations: Correlation[];   // Correlações entre marcadores
  trends?: Trend[];              // Se múltiplos relatórios
}

interface AttentionItem {
  markerName: string;
  severity: "mild" | "moderate" | "significant";
  message: string;
}

interface Correlation {
  markers: string[];             // ["Ferro", "Ferritina", "Hemoglobina"]
  message: string;
}

interface Trend {
  markerName: string;
  direction: "improving" | "stable" | "worsening";
  message: string;
}
```

### Explicação individual (`MarkerExplanation`)

```typescript
interface MarkerExplanation {
  markerName: string;
  whatIs: string;                // O que é este marcador
  whatFor: string;               // Para que serve
  currentInterpretation: string; // O que significa o valor actual
  highMeaning: string;           // O que significa estar alto
  lowMeaning: string;            // O que significa estar baixo
  commonCauses: string[];        // Causas comuns de alteração
  tips: string[];                // Sugestões práticas (alimentação, etc.)
}
```

### localStorage Schema

```typescript
// Chave: "sanum_reports"
interface StoredData {
  version: 1;
  reports: Report[];
  analyses: Record<string, Analysis>; // keyed by report.id
  lastUpdated: string;
}
```

---

## 6. UI/UX — Descrição de Ecrãs

### 6.1 Landing Page

- **Header:** Logo "Sanum" (minimalista, verde/azul saúde) + tagline "Percebe as tuas análises em segundos"
- **Hero section:**
  - Headline: "Faz upload das tuas análises clínicas e recebe uma análise inteligente instantânea"
  - Subheadline: "Sem conta. Sem registo. Os teus dados nunca são guardados."
  - Área de upload central (zona de drag & drop grande, ~300px altura)
    - Ícone de documento + "Arrasta os teus PDFs para aqui"
    - Botão "Selecionar ficheiros"
    - Nota: "Aceita PDFs de qualquer laboratório português"
- **Disclaimer:** Banner discreto mas legível no fundo: "⚕️ Esta ferramenta não substitui aconselhamento médico profissional."
- **Como funciona:** 3 passos com ícones (Upload → Análise AI → Resultados)
- **Footer:** Links para privacidade, sobre, contacto

### 6.2 Loading / Processamento

- Skeleton do dashboard a aparecer gradualmente
- Mensagens rotativas:
  - "A ler o PDF..."
  - "A identificar marcadores..."
  - "A analisar os resultados..."
- Barra de progresso (estimada, não real)
- Tempo estimado: "Normalmente demora 5-10 segundos"

### 6.3 Dashboard

- **Barra superior:** Nome do lab + data da análise + nome do paciente (se extraído)
- **Resumo AI (card destaque):**
  - Ícone 🩺 + "Resumo da análise"
  - 2-3 parágrafos em linguagem simples
  - Tags: "X valores normais", "Y valores a vigiar", "Z valores alterados"
- **Filtros:** Tabs por categoria (Todos | Hematologia | Metabolismo | ...)
- **Grid de marcadores:** Cards em grid responsivo (3 cols desktop, 2 tablet, 1 mobile)
  - Cada card:
    - Semáforo (🟢🟡🔴) grande à esquerda
    - Nome do marcador
    - Valor + unidade (bold)
    - Barra visual: posição do valor dentro do range de referência
    - Referência em texto pequeno
    - Click → abre explicação
- **Sidebar/Modal de explicação** (ao clicar num marcador):
  - Valor actual em destaque
  - Barra de referência visual
  - Secções: "O que é", "O seu valor", "O que pode significar", "Causas comuns"
  - Se múltiplos uploads: mini-gráfico de evolução

### 6.4 Evolução Temporal

- Aparece quando há ≥2 relatórios com o mesmo marcador
- Gráfico de linha por marcador
- Eixo X: datas dos relatórios
- Eixo Y: valor do marcador
- Banda de referência (zona verde entre refMin e refMax)
- Hover: tooltip com valor, data, lab
- Selector de marcador (dropdown ou lista lateral)

### 6.5 Export / Relatório PDF

- Botão "📥 Descarregar relatório"
- PDF gerado client-side com:
  - Header com logo Sanum + data
  - Dados do paciente e lab
  - Tabela completa de marcadores com semáforos
  - Resumo AI
  - Gráficos de evolução (se aplicável)
  - Disclaimer médico
  - Footer: "Gerado por sanum.pt"

---

## 7. Labs Suportados

### Prioridade 1 (v1.0) — Text-based, testados

| Lab | Tipo PDF | Notas |
|-----|----------|-------|
| **Germano de Sousa** | Text-based | ✅ Confirmado com pdftotext |
| **Unilabs** | Text-based (maioria) | Formato relativamente standard |
| **Joaquim Chaves Saúde** | Text-based (maioria) | Boa estrutura tabular |

### Prioridade 2 (v1.1) — Pode precisar de OCR

| Lab | Tipo PDF | Notas |
|-----|----------|-------|
| **SNS / Hospital público** | Variável | Alguns são scans |
| **Affidea** | Text-based | A confirmar |
| **Beatriz Godinho** | Text-based | A confirmar |

### Prioridade 3 (v1.2+) — OCR necessário

| Lab | Tipo PDF | Notas |
|-----|----------|-------|
| **Labs pequenos / regionais** | Frequentemente scans | Dependem de OCR |
| **Resultados manuscritos** | N/A | Fora de scope |

### Estratégia de compatibilidade

O parsing por LLM é **inherentemente flexível** — não dependemos de templates fixos por lab. O pdftotext extrai o texto e o LLM interpreta-o independentemente do formato. Isto significa que labs novos funcionam "out of the box" na maioria dos casos, sem desenvolvimento adicional.

Para scans, o fallback por Vision API também é genérico.

---

## 8. Mapping de Marcadores (normalização)

Diferentes labs usam nomes diferentes para o mesmo marcador. Tabela de normalização:

```typescript
const MARKER_ALIASES: Record<string, string[]> = {
  "Hemoglobina": ["HGB", "Hb", "Hemoglobina (HGB)"],
  "Hematócrito": ["HCT", "Ht", "Hematócrito (HCT)"],
  "Leucócitos": ["WBC", "Glóbulos Brancos", "Leucócitos (WBC)"],
  "Eritrócitos": ["RBC", "Glóbulos Vermelhos", "Eritrócitos (RBC)"],
  "Plaquetas": ["PLT", "Trombócitos", "Plaquetas (PLT)"],
  "Glicose": ["Glicemia", "Glucose", "Glicose em jejum"],
  "Colesterol Total": ["Colesterol", "CT"],
  "Colesterol HDL": ["HDL", "HDL-Colesterol", "C-HDL"],
  "Colesterol LDL": ["LDL", "LDL-Colesterol", "C-LDL"],
  "Triglicéridos": ["TG", "Triglicerídeos"],
  "Creatinina": ["Creat"],
  "Ureia": ["BUN", "Azoto Ureico"],
  "Ácido Úrico": ["Urato"],
  "AST": ["TGO", "GOT", "Aspartato Aminotransferase"],
  "ALT": ["TGP", "GPT", "Alanina Aminotransferase"],
  "GGT": ["Gama GT", "γ-GT", "Gama-glutamiltransferase"],
  "Fosfatase Alcalina": ["FA", "ALP"],
  "Bilirrubina Total": ["BT", "Bilirrubina"],
  "TSH": ["Tirotrofina", "Hormona Tireoestimulante"],
  "T4 Livre": ["FT4", "T4L", "Tiroxina Livre"],
  "T3 Livre": ["FT3", "T3L", "Triiodotironina Livre"],
  "Ferro": ["Fe", "Ferro sérico"],
  "Ferritina": ["Ferrit"],
  "Vitamina D": ["25-OH Vitamina D", "25-Hidroxivitamina D", "Calcidiol"],
  "Vitamina B12": ["Cianocobalamina"],
  "Ácido Fólico": ["Folato", "Vitamina B9"],
  "PCR": ["Proteína C Reactiva", "CRP"],
  "VS": ["Velocidade de Sedimentação", "ESR"],
  "HbA1c": ["Hemoglobina Glicada", "Hemoglobina A1c"],
  "PSA": ["Antigénio Específico da Próstata", "PSA Total"],
  // ... extensível
};
```

---

## 9. Critérios de Semáforo

```typescript
function getFlag(value: number, refMin: number | null, refMax: number | null): MarkerFlag {
  if (refMin === null && refMax === null) return "normal"; // sem referência

  if (refMin !== null && refMax !== null) {
    const range = refMax - refMin;
    if (value < refMin - range * 0.5) return "critical_low";
    if (value < refMin) return "low";
    if (value > refMax + range * 0.5) return "critical_high";
    if (value > refMax) return "high";
    return "normal";
  }

  if (refMax !== null) {
    if (value > refMax * 1.5) return "critical_high";
    if (value > refMax) return "high";
    return "normal";
  }

  if (refMin !== null) {
    if (value < refMin * 0.5) return "critical_low";
    if (value < refMin) return "low";
    return "normal";
  }

  return "normal";
}

// Mapeamento para semáforo visual:
// 🟢 normal
// 🟡 low | high (ligeiramente fora do range)
// 🔴 critical_low | critical_high (significativamente fora)
```

---

## 10. API Routes — Especificação

### `POST /api/parse`

**Request:** `multipart/form-data`
- `file`: PDF binary (max 10MB)

**Response:** `200 OK`
```json
{
  "success": true,
  "report": {
    "labName": "Germano de Sousa",
    "reportDate": "2026-01-15",
    "patientName": "João Silva",
    "patientAge": 35,
    "patientSex": "M",
    "markers": [
      {
        "name": "Hemoglobina",
        "originalName": "Hemoglobina (HGB)",
        "value": 14.2,
        "unit": "g/dL",
        "refMin": 13.0,
        "refMax": 17.5,
        "refText": "13.0 - 17.5",
        "category": "hematology",
        "flag": "normal"
      }
    ]
  },
  "extractionMethod": "pdftotext",
  "confidence": 0.95
}
```

**Erros:**
- `400` — ficheiro inválido, não é PDF, demasiado grande
- `422` — PDF ilegível, não foram extraídos marcadores
- `429` — rate limit atingido
- `500` — erro interno

### `POST /api/analyze`

**Request:** `application/json`
```json
{
  "reports": [Report],
  "patientAge": 35,
  "patientSex": "M"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "analysis": {
    "summary": "No geral, os seus resultados estão dentro dos valores normais...",
    "attentionItems": [],
    "positives": ["Hemograma completo sem alterações", "Função tiroideia normal"],
    "correlations": [],
    "trends": []
  }
}
```

### `POST /api/explain`

**Request:** `application/json`
```json
{
  "markerName": "Hemoglobina",
  "value": 14.2,
  "unit": "g/dL",
  "refMin": 13.0,
  "refMax": 17.5,
  "flag": "normal",
  "patientAge": 35,
  "patientSex": "M"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "explanation": {
    "markerName": "Hemoglobina",
    "whatIs": "A hemoglobina é uma proteína presente nos glóbulos vermelhos...",
    "whatFor": "É responsável pelo transporte de oxigénio...",
    "currentInterpretation": "O seu valor de 14.2 g/dL está dentro do normal...",
    "highMeaning": "Valores elevados podem indicar desidratação...",
    "lowMeaning": "Valores baixos podem indicar anemia...",
    "commonCauses": ["Anemia ferropénica", "Perda de sangue", "Deficiência de B12"],
    "tips": ["Manter alimentação rica em ferro", "Consumir vitamina C com refeições"]
  }
}
```

### Rate Limiting

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `/api/parse` | 10 requests | 15 min / IP |
| `/api/analyze` | 20 requests | 15 min / IP |
| `/api/explain` | 30 requests | 15 min / IP |

Implementação: in-memory Map com cleanup periódico. Sem necessidade de Redis para v1.

---

## 11. Segurança & Privacidade

| Aspecto | Implementação |
|---------|---------------|
| Dados em trânsito | HTTPS obrigatório (Traefik TLS) |
| Dados em repouso | **Não existem.** Nada é guardado no servidor. |
| PDFs recebidos | Processados em memória, descartados após response |
| Logs | Sem logging de conteúdo de PDFs. Apenas contadores e erros. |
| LLM API calls | Dados enviados à API Claude/OpenAI (política de privacidade deles aplica-se). Usar `ephemeral: true` se disponível. |
| localStorage | Dados ficam exclusivamente no browser do utilizador. Controlado por ele. |
| Uploads maliciosos | Validação de MIME type, tamanho máximo 10MB, sanitização |

---

## 12. Limitações Conhecidas (v1)

1. **Precisão da extração** — LLM parsing não é 100% fiável. Valores podem ser mal extraídos, especialmente de PDFs com formatação atípica.
2. **OCR de scans** — Qualidade depende da resolução do scan. PDFs fotografados com telemóvel terão pior resultados.
3. **Não é diagnóstico** — A análise AI é informativa, não diagnóstica. Pode errar na interpretação de correlações complexas.
4. **Marcadores raros** — Marcadores muito específicos ou pouco comuns podem não ser reconhecidos pelo mapping de normalização.
5. **Custo de API** — Cada parse/análise consome tokens de LLM. Custo estimado: ~€0.02-0.10 por análise completa.
6. **Sem histórico cross-device** — localStorage não sincroniza entre dispositivos.
7. **Rate limiting básico** — IP-based, contornável com VPN. Suficiente para v1.
8. **Idioma** — Apenas português (PT-PT). Análises de labs estrangeiros não são suportadas.

---

## 13. Roadmap

### v1.0 — MVP (target: 4-6 semanas)
- [x] Scaffold Next.js + Tailwind
- [ ] Upload + parsing text-based
- [ ] Dashboard semáforo
- [ ] Análise AI global
- [ ] Explicação individual
- [ ] Disclaimer médico
- [ ] Responsive design
- [ ] Deploy via Docker/Traefik

### v1.1 — Polish (2-3 semanas após v1.0)
- [ ] OCR para PDFs scan-based
- [ ] Evolução temporal (gráficos)
- [ ] localStorage para guardar resultados
- [ ] Contexto idade/sexo
- [ ] Export PDF

### v1.2 — Feedback loop (ongoing)
- [ ] Correcção manual de valores
- [ ] Mais labs testados e documentados
- [ ] Melhorias de UX baseadas em feedback

### v2.0 — Expansão (futuro)
- [ ] Contas opcionais (para sincronizar entre dispositivos)
- [ ] Integração com Apple Health / Google Fit
- [ ] Comparação com médias populacionais
- [ ] Alertas personalizados ("avisa-me se o colesterol subir")
- [ ] Suporte para análises de outros países (ES, BR)
- [ ] API pública para integração com apps de saúde
- [ ] Modelo de negócio: freemium (X análises grátis/mês, premium para ilimitado)

---

## 14. Estimativa de Esforço

### v1.0 MVP

| Componente | Estimativa | Notas |
|-----------|------------|-------|
| Setup & infra (Docker, deploy) | 0.5 dias | Scaffold já existe |
| Landing page + upload UI | 1 dia | |
| API `/api/parse` + pdftotext | 1.5 dias | Inclui prompt engineering |
| Normalização de marcadores | 1 dia | Mapping table + testes com PDFs reais |
| Dashboard UI (semáforo + grid) | 2 dias | Componentes + responsivo |
| API `/api/analyze` + UI resumo | 1 dia | |
| API `/api/explain` + UI modal | 1 dia | |
| Rate limiting + validações | 0.5 dias | |
| Disclaimer + legal | 0.5 dias | |
| Testing com PDFs reais | 2 dias | Vários labs, edge cases |
| Polish + bugfixes | 2 dias | |
| **Total** | **~13 dias** | ~2.5-3 semanas de trabalho |

### v1.1

| Componente | Estimativa |
|-----------|------------|
| OCR via Vision API | 1.5 dias |
| Evolução temporal (charts) | 2 dias |
| localStorage | 1 dia |
| Contexto idade/sexo | 0.5 dias |
| Export PDF | 2 dias |
| **Total** | **~7 dias** |

### Custos operacionais estimados (mensal)

| Item | Custo | Notas |
|------|-------|-------|
| VPS | €0 (já existente) | Partilhado com outros projectos |
| Domínio sanum.pt | ~€10/ano | |
| Claude API | €20-100/mês | Depende do volume. ~€0.05/análise completa |
| **Total** | **€20-100/mês** | Escala com uso |

---

## 15. Decisões Técnicas em Aberto

| Decisão | Opções | Recomendação |
|---------|--------|--------------|
| LLM provider | Claude vs OpenAI | Claude (Sonnet) — melhor em português, structured output fiável |
| Charts library | Recharts vs Chart.js vs Nivo | Recharts — lightweight, React-native, suficiente |
| PDF export | @react-pdf/renderer vs jsPDF vs html2pdf | @react-pdf/renderer — melhor controlo de layout |
| OCR approach | Claude Vision vs GPT-4V vs Tesseract | Claude Vision — já usamos Claude, menos um provider |
| Rate limiting | In-memory vs Upstash Redis | In-memory para v1, Upstash se precisar de persistência |

---

*Este documento é vivo e deve ser actualizado à medida que decisões são tomadas e o produto evolui.*
