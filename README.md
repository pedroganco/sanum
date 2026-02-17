# Sanum

Percebe as tuas análises clínicas em segundos.

## Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **AI:** Claude Sonnet 4.5 (Anthropic)
- **PDF parsing:** poppler-utils (pdftotext)
- **Deploy:** Docker + Traefik

## Features MVP

✅ Upload drag & drop de PDFs
✅ Parsing com pdftotext + Claude
✅ Base de dados local de ~80-100 marcadores PT (zero AI nas explicações)
✅ Dashboard com semáforo 🟢🟡🔴 por categoria
✅ Explicações individuais (click → modal com info da base local)
✅ CTA de análise AI global on-demand
✅ Disclaimer médico persistente
✅ Rate limiting por IP (10 req/15min parse, 20 req/15min analyze)
✅ Privacy-first: dados NUNCA são guardados no servidor
✅ Mobile-first responsive design

## Requisitos

- Node.js 20+
- `pdftotext` (poppler-utils):
  - **macOS:** `brew install poppler`
  - **Ubuntu/Debian:** `sudo apt-get install poppler-utils`
  - **Docker:** já incluído no Dockerfile

## Setup Local

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   ```bash
   cp .env.local.example .env.local
   ```

   Editar `.env.local` e adicionar a tua `ANTHROPIC_API_KEY`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

3. **Correr dev server:**
   ```bash
   npm run dev
   ```

4. **Abrir no browser:**
   ```
   http://localhost:3000
   ```

## Build & Deploy

### Build local
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t sanum .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-ant-... sanum
```

### Deploy com Traefik
Ver instruções no VPS (94.46.171.243).

## Estrutura

```
sanum/
├── app/
│   ├── page.tsx              # Landing + state management
│   ├── api/
│   │   ├── parse/route.ts    # PDF parsing com Claude
│   │   └── analyze/route.ts  # Análise AI global
├── components/
│   ├── Disclaimer.tsx        # Disclaimer médico
│   ├── UploadSection.tsx     # Upload drag&drop
│   ├── Dashboard.tsx         # Dashboard principal
│   ├── MarkerCard.tsx        # Card de marcador (semáforo)
│   ├── MarkerModal.tsx       # Modal de explicação individual
│   └── AIAnalysisSection.tsx # CTA + resultado análise AI
├── lib/
│   ├── types.ts              # TypeScript types
│   └── markers-database.ts   # Base ~80 marcadores PT (hardcoded)
├── docs/
│   ├── SPEC.md               # Especificação completa
│   └── sample-germano-de-sousa.pdf
└── Dockerfile
```

## Testar com PDF de exemplo

```bash
# Extrair texto do PDF de exemplo
pdftotext -layout docs/sample-germano-de-sousa.pdf -

# Ou testar via interface web (recomendado)
npm run dev
# Upload docs/sample-germano-de-sousa.pdf
```

## Próximos Passos (v1.1)

- [ ] OCR para PDFs scan-based (Claude Vision API)
- [ ] Evolução temporal com gráficos
- [ ] localStorage para guardar resultados
- [ ] Export PDF do relatório
- [ ] Mais marcadores na base de dados (100+)

## Licença

Proprietary - Sanum © 2026
