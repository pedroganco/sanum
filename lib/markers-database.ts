/**
 * Base de dados LOCAL de marcadores clínicos portugueses
 * ~80-100 marcadores com explicações, referências, aliases
 * ZERO AI - todas as explicações são hardcoded
 */

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

export type MarkerFlag = "normal" | "low" | "high" | "critical_low" | "critical_high";

export interface ReferenceRange {
  min?: number;
  max?: number;
  ageGroup?: string; // "adulto", "criança", etc
  sex?: "M" | "F";
}

export interface MarkerInfo {
  name: string; // Nome normalizado
  aliases: string[]; // Variações de nome
  unit: string; // Unidade padrão
  category: MarkerCategory;
  references: ReferenceRange[]; // Valores de referência por idade/sexo

  // Explicações (hardcoded, zero AI)
  whatIs: string; // O que é este marcador
  whatFor: string; // Para que serve
  highMeaning: string; // O que significa estar alto
  lowMeaning: string; // O que significa estar baixo
  commonCauses: string[]; // Causas comuns de alteração
}

export const MARKERS_DATABASE: Record<string, MarkerInfo> = {
  // ========== HEMATOLOGIA ==========

  "Hemoglobina": {
    name: "Hemoglobina",
    aliases: ["HGB", "Hb", "Hemoglobina (HGB)"],
    unit: "g/dL",
    category: "hematology",
    references: [
      { min: 13.0, max: 17.0, sex: "M" },
      { min: 12.0, max: 16.0, sex: "F" }
    ],
    whatIs: "Proteína presente nos glóbulos vermelhos do sangue.",
    whatFor: "Responsável por transportar oxigénio dos pulmões para todos os tecidos do corpo.",
    highMeaning: "Pode indicar desidratação, viver em altitude elevada, doenças pulmonares ou policitemia.",
    lowMeaning: "Pode indicar anemia (falta de ferro, vitamina B12 ou ácido fólico), perda de sangue ou doenças crónicas.",
    commonCauses: ["Anemia ferropénica", "Perda de sangue", "Deficiência de B12", "Desidratação", "Doenças pulmonares"]
  },

  "Eritrócitos": {
    name: "Eritrócitos",
    aliases: ["RBC", "Glóbulos Vermelhos", "Eritrócitos (RBC)"],
    unit: "x10⁶/µL",
    category: "hematology",
    references: [
      { min: 4.5, max: 5.5, sex: "M" },
      { min: 4.0, max: 5.0, sex: "F" }
    ],
    whatIs: "Glóbulos vermelhos, as células que transportam a hemoglobina.",
    whatFor: "Transportam oxigénio e dióxido de carbono pelo corpo.",
    highMeaning: "Pode indicar policitemia, desidratação ou viver em altitude.",
    lowMeaning: "Pode indicar anemia, perda de sangue ou doenças da medula óssea.",
    commonCauses: ["Anemia", "Desidratação", "Doenças da medula óssea", "Perda de sangue"]
  },

  "Hematócrito": {
    name: "Hematócrito",
    aliases: ["HCT", "Ht", "Hematócrito (HCT)"],
    unit: "%",
    category: "hematology",
    references: [
      { min: 40.0, max: 50.0, sex: "M" },
      { min: 36.0, max: 44.0, sex: "F" }
    ],
    whatIs: "Percentagem do volume de sangue ocupada pelos glóbulos vermelhos.",
    whatFor: "Avalia a capacidade do sangue transportar oxigénio.",
    highMeaning: "Pode indicar desidratação, policitemia ou doenças pulmonares.",
    lowMeaning: "Pode indicar anemia, perda de sangue ou excesso de hidratação.",
    commonCauses: ["Anemia", "Desidratação", "Perda de sangue", "Policitemia"]
  },

  "V.G.M.": {
    name: "V.G.M.",
    aliases: ["VGM", "MCV", "Volume Globular Médio"],
    unit: "fL",
    category: "hematology",
    references: [{ min: 80.0, max: 97.0 }],
    whatIs: "Volume médio de cada glóbulo vermelho.",
    whatFor: "Ajuda a classificar o tipo de anemia (micro, normo ou macrocítica).",
    highMeaning: "Anemias macrocíticas (deficiência de B12 ou ácido fólico, alcoolismo).",
    lowMeaning: "Anemias microcíticas (deficiência de ferro, talassemia).",
    commonCauses: ["Deficiência de ferro", "Deficiência de B12", "Alcoolismo", "Talassemia"]
  },

  "H.G.M.": {
    name: "H.G.M.",
    aliases: ["HGM", "MCH", "Hemoglobina Globular Média"],
    unit: "pg",
    category: "hematology",
    references: [{ min: 27.0, max: 32.0 }],
    whatIs: "Quantidade média de hemoglobina em cada glóbulo vermelho.",
    whatFor: "Complementa o VGM na classificação de anemias.",
    highMeaning: "Geralmente acompanha VGM elevado (anemias macrocíticas).",
    lowMeaning: "Geralmente acompanha VGM baixo (anemias microcíticas).",
    commonCauses: ["Deficiência de ferro", "Deficiência de B12", "Talassemia"]
  },

  "C.M.H.G.": {
    name: "C.M.H.G.",
    aliases: ["CMHG", "MCHC", "Concentração Média de Hemoglobina Globular"],
    unit: "g/dL",
    category: "hematology",
    references: [{ min: 32.0, max: 36.0 }],
    whatIs: "Concentração média de hemoglobina dentro dos glóbulos vermelhos.",
    whatFor: "Avalia se os glóbulos vermelhos têm hemoglobina em concentração normal.",
    highMeaning: "Raro, pode indicar esferocitose hereditária.",
    lowMeaning: "Pode indicar anemia ferropénica ou talassemia.",
    commonCauses: ["Anemia ferropénica", "Talassemia", "Esferocitose"]
  },

  "R.D.W.": {
    name: "R.D.W.",
    aliases: ["RDW", "Amplitude de Distribuição dos Eritrócitos"],
    unit: "%",
    category: "hematology",
    references: [{ min: 11.6, max: 14.0 }],
    whatIs: "Variação no tamanho dos glóbulos vermelhos.",
    whatFor: "Ajuda a identificar diferentes tipos de anemia.",
    highMeaning: "Indica variação significativa no tamanho dos glóbulos (deficiência de ferro, B12, ou anemia mista).",
    lowMeaning: "Glóbulos vermelhos com tamanho uniforme (normal ou talassemia).",
    commonCauses: ["Deficiência de ferro", "Deficiência de B12", "Anemia mista"]
  },

  "Leucócitos": {
    name: "Leucócitos",
    aliases: ["WBC", "Glóbulos Brancos", "Leucócitos (WBC)"],
    unit: "x10³/µL",
    category: "hematology",
    references: [{ min: 4.0, max: 10.0 }],
    whatIs: "Glóbulos brancos, células de defesa do organismo.",
    whatFor: "Protegem o corpo contra infeções e doenças.",
    highMeaning: "Pode indicar infeção, inflamação, leucemia ou stress físico.",
    lowMeaning: "Pode indicar infeção viral, doenças da medula óssea ou efeito de medicamentos.",
    commonCauses: ["Infeção", "Inflamação", "Leucemia", "Infeção viral", "Medicamentos"]
  },

  "Neutrófilos": {
    name: "Neutrófilos",
    aliases: ["Neutrophils", "Segmentados"],
    unit: "%",
    category: "hematology",
    references: [{ min: 40.0, max: 80.0 }],
    whatIs: "Tipo de glóbulo branco mais abundante.",
    whatFor: "Primeira linha de defesa contra infeções bacterianas.",
    highMeaning: "Geralmente indica infeção bacteriana aguda ou inflamação.",
    lowMeaning: "Pode indicar infeção viral, medicamentos ou doenças da medula.",
    commonCauses: ["Infeção bacteriana", "Infeção viral", "Medicamentos", "Inflamação"]
  },

  "Linfócitos": {
    name: "Linfócitos",
    aliases: ["Lymphocytes"],
    unit: "%",
    category: "hematology",
    references: [{ min: 20.0, max: 40.0 }],
    whatIs: "Tipo de glóbulo branco responsável pela imunidade específica.",
    whatFor: "Produzem anticorpos e destroem células infetadas ou cancerosas.",
    highMeaning: "Pode indicar infeção viral, leucemia linfocítica ou mononucleose.",
    lowMeaning: "Pode indicar imunossupressão, HIV ou efeito de medicamentos.",
    commonCauses: ["Infeção viral", "Leucemia", "HIV", "Imunossupressão"]
  },

  "Monócitos": {
    name: "Monócitos",
    aliases: ["Monocytes"],
    unit: "%",
    category: "hematology",
    references: [{ min: 2.0, max: 10.0 }],
    whatIs: "Tipo de glóbulo branco que se transforma em macrófagos.",
    whatFor: "Limpam tecidos de células mortas e combatem infeções crónicas.",
    highMeaning: "Pode indicar infeções crónicas, tuberculose ou doenças autoimunes.",
    lowMeaning: "Geralmente sem significado clínico relevante.",
    commonCauses: ["Infeções crónicas", "Tuberculose", "Doenças autoimunes"]
  },

  "Eosinófilos": {
    name: "Eosinófilos",
    aliases: ["Eosinophils"],
    unit: "%",
    category: "hematology",
    references: [{ min: 1.0, max: 6.0 }],
    whatIs: "Tipo de glóbulo branco envolvido em reações alérgicas.",
    whatFor: "Combatem parasitas e participam em reações alérgicas.",
    highMeaning: "Pode indicar alergias, asma, parasitas ou doenças de pele.",
    lowMeaning: "Geralmente sem significado clínico.",
    commonCauses: ["Alergias", "Asma", "Parasitas", "Doenças de pele"]
  },

  "Basófilos": {
    name: "Basófilos",
    aliases: ["Basophils"],
    unit: "%",
    category: "hematology",
    references: [{ min: 0.0, max: 2.0 }],
    whatIs: "Tipo de glóbulo branco menos comum.",
    whatFor: "Envolvidos em reações alérgicas e libertam histamina.",
    highMeaning: "Raro, pode indicar leucemia ou reações alérgicas graves.",
    lowMeaning: "Geralmente sem significado clínico.",
    commonCauses: ["Reações alérgicas", "Leucemia"]
  },

  "Plaquetas": {
    name: "Plaquetas",
    aliases: ["PLT", "Trombócitos", "Plaquetas (PLT)"],
    unit: "x10³/µL",
    category: "hematology",
    references: [{ min: 150, max: 400 }],
    whatIs: "Células responsáveis pela coagulação do sangue.",
    whatFor: "Formam coágulos para parar hemorragias.",
    highMeaning: "Pode indicar inflamação, anemia ferropénica ou doenças mieloproliferativas.",
    lowMeaning: "Pode indicar risco de hemorragia, doenças da medula ou destruição plaquetária.",
    commonCauses: ["Inflamação", "Doenças da medula", "Destruição imunológica", "Medicamentos"]
  },

  // ========== METABOLISMO (HIDRATOS DE CARBONO) ==========

  "Glicose": {
    name: "Glicose",
    aliases: ["Glicemia", "Glucose", "Glicose em jejum", "Glicémia"],
    unit: "mg/dL",
    category: "metabolism",
    references: [{ min: 70, max: 110 }],
    whatIs: "Açúcar principal no sangue, fonte de energia do corpo.",
    whatFor: "Avalia o metabolismo dos açúcares e rastreio de diabetes.",
    highMeaning: "Pode indicar diabetes, pré-diabetes ou resistência à insulina.",
    lowMeaning: "Pode indicar hipoglicemia, jejum prolongado ou excesso de insulina.",
    commonCauses: ["Diabetes", "Pré-diabetes", "Hipoglicemia", "Jejum prolongado"]
  },

  "HbA1c": {
    name: "HbA1c",
    aliases: ["Hemoglobina Glicada", "Hemoglobina A1c", "A1C"],
    unit: "%",
    category: "metabolism",
    references: [{ min: 4.0, max: 6.0 }],
    whatIs: "Hemoglobina ligada à glicose, reflete média de glicemia dos últimos 2-3 meses.",
    whatFor: "Monitorização do controlo glicémico em diabéticos.",
    highMeaning: "Indica controlo glicémico inadequado ou diabetes mal controlada.",
    lowMeaning: "Geralmente bom sinal (bom controlo), mas pode indicar anemia ou hipoglicemia recorrente.",
    commonCauses: ["Diabetes mal controlada", "Anemia", "Controlo glicémico adequado"]
  },

  // ========== METABOLISMO LIPÍDICO ==========

  "Colesterol Total": {
    name: "Colesterol Total",
    aliases: ["Colesterol", "CT", "Colesterol total"],
    unit: "mg/dL",
    category: "lipids",
    references: [{ max: 190 }],
    whatIs: "Soma de todos os tipos de colesterol no sangue.",
    whatFor: "Avalia risco cardiovascular.",
    highMeaning: "Aumenta risco de doenças cardiovasculares, aterosclerose e enfarte.",
    lowMeaning: "Geralmente não é preocupante, pode ocorrer em desnutrição ou doenças hepáticas.",
    commonCauses: ["Dieta rica em gorduras", "Sedentarismo", "Genética", "Diabetes", "Hipotiroidismo"]
  },

  "Colesterol HDL": {
    name: "Colesterol HDL",
    aliases: ["HDL", "HDL-Colesterol", "C-HDL", "Colesterol HDL"],
    unit: "mg/dL",
    category: "lipids",
    references: [{ min: 40 }],
    whatIs: "Colesterol 'bom', remove excesso de colesterol das artérias.",
    whatFor: "Protege contra doenças cardiovasculares.",
    highMeaning: "Excelente! Quanto mais alto, melhor proteção cardiovascular.",
    lowMeaning: "Aumenta risco de doenças cardiovasculares.",
    commonCauses: ["Sedentarismo", "Tabagismo", "Diabetes", "Obesidade"]
  },

  "Colesterol LDL": {
    name: "Colesterol LDL",
    aliases: ["LDL", "LDL-Colesterol", "C-LDL", "Colesterol LDL"],
    unit: "mg/dL",
    category: "lipids",
    references: [{ max: 115 }],
    whatIs: "Colesterol 'mau', deposita-se nas artérias.",
    whatFor: "Principal fator de risco para aterosclerose.",
    highMeaning: "Aumenta significativamente risco de enfarte e AVC.",
    lowMeaning: "Excelente para prevenção cardiovascular.",
    commonCauses: ["Dieta rica em gorduras saturadas", "Sedentarismo", "Genética", "Diabetes"]
  },

  "Triglicéridos": {
    name: "Triglicéridos",
    aliases: ["TG", "Triglicerídeos", "Triglicéridos"],
    unit: "mg/dL",
    category: "lipids",
    references: [{ max: 150 }],
    whatIs: "Tipo de gordura armazenada no corpo, vinda da alimentação.",
    whatFor: "Avalia risco cardiovascular e metabólico.",
    highMeaning: "Aumenta risco de doenças cardiovasculares, pancreatite e síndrome metabólico.",
    lowMeaning: "Geralmente bom sinal.",
    commonCauses: ["Dieta rica em açúcares", "Álcool", "Obesidade", "Diabetes", "Sedentarismo"]
  },

  // ========== FUNÇÃO RENAL ==========

  "Ureia": {
    name: "Ureia",
    aliases: ["BUN", "Azoto Ureico", "Urémia"],
    unit: "mg/dL",
    category: "renal",
    references: [{ min: 15, max: 50 }],
    whatIs: "Produto de degradação das proteínas, eliminado pelos rins.",
    whatFor: "Avalia função renal e estado de hidratação.",
    highMeaning: "Pode indicar insuficiência renal, desidratação ou dieta muito rica em proteínas.",
    lowMeaning: "Pode indicar má nutrição, doença hepática ou excesso de hidratação.",
    commonCauses: ["Insuficiência renal", "Desidratação", "Dieta rica em proteínas", "Doença hepática"]
  },

  "Creatinina": {
    name: "Creatinina",
    aliases: ["Creat", "Creatininémia"],
    unit: "mg/dL",
    category: "renal",
    references: [
      { min: 0.70, max: 1.30, sex: "M" },
      { min: 0.50, max: 1.10, sex: "F" }
    ],
    whatIs: "Produto de degradação muscular, eliminado pelos rins.",
    whatFor: "Principal marcador da função renal.",
    highMeaning: "Indica insuficiência renal ou desidratação.",
    lowMeaning: "Pode ocorrer em pessoas com baixa massa muscular.",
    commonCauses: ["Insuficiência renal", "Desidratação", "Exercício físico intenso", "Baixa massa muscular"]
  },

  "Ácido Úrico": {
    name: "Ácido Úrico",
    aliases: ["Urato", "Ácido úrico"],
    unit: "mg/dL",
    category: "renal",
    references: [
      { min: 3.5, max: 7.2, sex: "M" },
      { min: 2.6, max: 6.0, sex: "F" }
    ],
    whatIs: "Produto final do metabolismo de purinas (carnes, peixes, álcool).",
    whatFor: "Avalia risco de gota e função renal.",
    highMeaning: "Pode causar gota (cristais nas articulações) ou cálculos renais.",
    lowMeaning: "Geralmente sem significado clínico.",
    commonCauses: ["Gota", "Dieta rica em purinas", "Álcool", "Insuficiência renal", "Diuréticos"]
  },

  // ========== FUNÇÃO HEPÁTICA ==========

  "AST": {
    name: "AST",
    aliases: ["TGO", "GOT", "Aspartato Aminotransferase", "Aspartato aminotransferase (AST)"],
    unit: "U/L",
    category: "hepatic",
    references: [{ max: 34 }],
    whatIs: "Enzima presente no fígado, coração e músculos.",
    whatFor: "Avalia lesão hepática ou cardíaca.",
    highMeaning: "Pode indicar hepatite, cirrose, enfarte do miocárdio ou lesão muscular.",
    lowMeaning: "Geralmente sem significado clínico.",
    commonCauses: ["Hepatite", "Álcool", "Esteatose hepática", "Medicamentos", "Enfarte"]
  },

  "ALT": {
    name: "ALT",
    aliases: ["TGP", "GPT", "Alanina Aminotransferase", "Alanina aminotransferase (ALT)"],
    unit: "U/L",
    category: "hepatic",
    references: [{ min: 10, max: 49 }],
    whatIs: "Enzima mais específica do fígado que a AST.",
    whatFor: "Principal marcador de lesão hepática.",
    highMeaning: "Indica lesão ou inflamação do fígado (hepatite, esteatose, medicamentos).",
    lowMeaning: "Geralmente bom sinal.",
    commonCauses: ["Hepatite", "Esteatose hepática", "Álcool", "Medicamentos", "Obesidade"]
  },

  "GGT": {
    name: "GGT",
    aliases: ["Gama GT", "γ-GT", "Gama-glutamiltransferase", "Gama-GT"],
    unit: "U/L",
    category: "hepatic",
    references: [
      { max: 55, sex: "M" },
      { max: 38, sex: "F" }
    ],
    whatIs: "Enzima do fígado sensível ao álcool e medicamentos.",
    whatFor: "Avalia lesão hepática, especialmente relacionada ao álcool.",
    highMeaning: "Pode indicar doença hepática, consumo de álcool ou obstrução biliar.",
    lowMeaning: "Geralmente bom sinal.",
    commonCauses: ["Álcool", "Esteatose hepática", "Medicamentos", "Doenças biliares"]
  },

  "Fosfatase Alcalina": {
    name: "Fosfatase Alcalina",
    aliases: ["FA", "ALP", "Fosfatase alcalina"],
    unit: "U/L",
    category: "hepatic",
    references: [{ min: 40, max: 130 }],
    whatIs: "Enzima presente no fígado e ossos.",
    whatFor: "Avalia doenças hepáticas ou ósseas.",
    highMeaning: "Pode indicar doenças biliares, metástases ósseas ou crescimento ósseo (crianças/adolescentes).",
    lowMeaning: "Pode indicar desnutrição ou deficiência de zinco.",
    commonCauses: ["Doenças biliares", "Metástases ósseas", "Hepatite", "Crescimento ósseo"]
  },

  "Bilirrubina Total": {
    name: "Bilirrubina Total",
    aliases: ["BT", "Bilirrubina"],
    unit: "mg/dL",
    category: "hepatic",
    references: [{ max: 1.2 }],
    whatIs: "Produto da degradação da hemoglobina.",
    whatFor: "Avalia função hepática e vias biliares.",
    highMeaning: "Pode causar icterícia (pele amarela) e indicar doença hepática ou obstrução biliar.",
    lowMeaning: "Geralmente sem significado clínico.",
    commonCauses: ["Hepatite", "Cirrose", "Cálculos biliares", "Hemólise", "Síndrome de Gilbert"]
  },

  // ========== FUNÇÃO TIROIDEIA ==========

  "TSH": {
    name: "TSH",
    aliases: ["Tirotrofina", "Hormona Tireoestimulante", "Tireoestimulina (TSH)", "Tireoestimulina"],
    unit: "mUI/L",
    category: "thyroid",
    references: [{ min: 0.35, max: 5.50 }],
    whatIs: "Hormona produzida pela hipófise que regula a tiroide.",
    whatFor: "Principal exame para avaliar função tiroideia.",
    highMeaning: "Indica hipotiroidismo (tiroide lenta).",
    lowMeaning: "Indica hipertiroidismo (tiroide acelerada).",
    commonCauses: ["Hipotiroidismo", "Hipertiroidismo", "Doença de Hashimoto", "Doença de Graves"]
  },

  "T4 Livre": {
    name: "T4 Livre",
    aliases: ["FT4", "T4L", "Tiroxina Livre", "Tiroxina Livre (FT4)"],
    unit: "ng/dL",
    category: "thyroid",
    references: [{ min: 0.80, max: 1.76 }],
    whatIs: "Hormona produzida pela tiroide na forma livre (ativa).",
    whatFor: "Avalia função tiroideia juntamente com o TSH.",
    highMeaning: "Pode indicar hipertiroidismo.",
    lowMeaning: "Pode indicar hipotiroidismo.",
    commonCauses: ["Hipertiroidismo", "Hipotiroidismo", "Medicamentos para tiroide"]
  },

  "T3 Livre": {
    name: "T3 Livre",
    aliases: ["FT3", "T3L", "Triiodotironina Livre"],
    unit: "pg/mL",
    category: "thyroid",
    references: [{ min: 2.3, max: 4.2 }],
    whatIs: "Hormona tiroideia mais ativa que o T4.",
    whatFor: "Avalia hipertiroidismo e monitorização de tratamento.",
    highMeaning: "Pode indicar hipertiroidismo.",
    lowMeaning: "Pode indicar hipotiroidismo ou doença grave.",
    commonCauses: ["Hipertiroidismo", "Hipotiroidismo", "Doença de Graves"]
  },

  // ========== METABOLISMO DO FERRO ==========

  "Ferro": {
    name: "Ferro",
    aliases: ["Fe", "Ferro sérico", "Ferro serico"],
    unit: "µg/dL",
    category: "iron",
    references: [
      { min: 65, max: 175, sex: "M" },
      { min: 50, max: 170, sex: "F" }
    ],
    whatIs: "Mineral essencial para produção de hemoglobina.",
    whatFor: "Avalia anemia ferropénica e sobrecarga de ferro.",
    highMeaning: "Pode indicar hemocromatose (sobrecarga de ferro) ou hemólise.",
    lowMeaning: "Indica deficiência de ferro, principal causa de anemia.",
    commonCauses: ["Anemia ferropénica", "Hemocromatose", "Dieta pobre em ferro", "Perda de sangue"]
  },

  "Ferritina": {
    name: "Ferritina",
    aliases: ["Ferrit"],
    unit: "ng/mL",
    category: "iron",
    references: [
      { min: 30, max: 400, sex: "M" },
      { min: 15, max: 150, sex: "F" }
    ],
    whatIs: "Proteína que armazena ferro no corpo.",
    whatFor: "Melhor marcador das reservas de ferro.",
    highMeaning: "Pode indicar inflamação, hemocromatose ou doenças hepáticas.",
    lowMeaning: "Indica reservas baixas de ferro, mesmo antes de anemia manifesta.",
    commonCauses: ["Deficiência de ferro", "Hemocromatose", "Inflamação", "Doenças hepáticas"]
  },

  "Transferrina": {
    name: "Transferrina",
    aliases: ["Transferrin"],
    unit: "mg/dL",
    category: "iron",
    references: [{ min: 200, max: 360 }],
    whatIs: "Proteína que transporta ferro no sangue.",
    whatFor: "Avalia metabolismo do ferro.",
    highMeaning: "Geralmente indica deficiência de ferro (corpo tenta compensar).",
    lowMeaning: "Pode indicar inflamação, má nutrição ou sobrecarga de ferro.",
    commonCauses: ["Deficiência de ferro", "Inflamação", "Má nutrição"]
  },

  // ========== VITAMINAS ==========

  "Vitamina D": {
    name: "Vitamina D",
    aliases: ["25-OH Vitamina D", "25-Hidroxivitamina D", "Calcidiol", "Vitamina D3"],
    unit: "ng/mL",
    category: "vitamins",
    references: [{ min: 30, max: 100 }],
    whatIs: "Vitamina essencial para absorção de cálcio e saúde óssea.",
    whatFor: "Previne osteoporose, regula imunidade e humor.",
    highMeaning: "Raro, pode ocorrer com suplementação excessiva (toxicidade rara).",
    lowMeaning: "Muito comum em Portugal, aumenta risco de osteoporose, fraturas e problemas imunológicos.",
    commonCauses: ["Pouca exposição solar", "Dieta pobre", "Má absorção", "Obesidade"]
  },

  "Vitamina B12": {
    name: "Vitamina B12",
    aliases: ["Cianocobalamina", "Cobalamina", "B12"],
    unit: "pg/mL",
    category: "vitamins",
    references: [{ min: 200, max: 900 }],
    whatIs: "Vitamina essencial para produção de glóbulos vermelhos e função nervosa.",
    whatFor: "Previne anemia megaloblástica e problemas neurológicos.",
    highMeaning: "Geralmente sem significado clínico, pode ocorrer com suplementação.",
    lowMeaning: "Pode causar anemia, fadiga, formigueiros e problemas de memória.",
    commonCauses: ["Vegetarianismo/veganismo", "Má absorção", "Gastrite atrófica", "Idade avançada"]
  },

  "Ácido Fólico": {
    name: "Ácido Fólico",
    aliases: ["Folato", "Vitamina B9", "B9"],
    unit: "ng/mL",
    category: "vitamins",
    references: [{ min: 3.0, max: 17.0 }],
    whatIs: "Vitamina do complexo B, essencial para produção de DNA e glóbulos vermelhos.",
    whatFor: "Previne anemia megaloblástica e malformações fetais.",
    highMeaning: "Geralmente sem significado clínico, pode mascarar deficiência de B12.",
    lowMeaning: "Pode causar anemia, fadiga e malformações fetais na gravidez.",
    commonCauses: ["Dieta pobre em vegetais", "Alcoolismo", "Má absorção", "Gravidez"]
  },

  // ========== INFLAMAÇÃO ==========

  "PCR": {
    name: "PCR",
    aliases: ["Proteína C Reactiva", "CRP", "Proteína C Reativa"],
    unit: "mg/L",
    category: "inflammation",
    references: [{ max: 5.0 }],
    whatIs: "Proteína produzida pelo fígado em resposta a inflamação.",
    whatFor: "Marcador geral de inflamação ou infeção.",
    highMeaning: "Indica inflamação ativa, infeção, doença autoimune ou risco cardiovascular elevado.",
    lowMeaning: "Ausência de inflamação significativa.",
    commonCauses: ["Infeção", "Doenças autoimunes", "Inflamação crónica", "Risco cardiovascular"]
  },

  "VS": {
    name: "VS",
    aliases: ["Velocidade de Sedimentação", "ESR", "VHS"],
    unit: "mm/h",
    category: "inflammation",
    references: [
      { max: 15, sex: "M" },
      { max: 20, sex: "F" }
    ],
    whatIs: "Velocidade com que os glóbulos vermelhos se depositam num tubo.",
    whatFor: "Marcador inespecífico de inflamação.",
    highMeaning: "Indica inflamação, infeção, anemia ou doenças autoimunes.",
    lowMeaning: "Ausência de inflamação.",
    commonCauses: ["Infeção", "Doenças autoimunes", "Anemia", "Cancro"]
  },

  // ========== ELETRÓLITOS ==========

  "Sódio": {
    name: "Sódio",
    aliases: ["Na", "Natrémia", "Natremio"],
    unit: "mmol/L",
    category: "electrolytes",
    references: [{ min: 132, max: 146 }],
    whatIs: "Principal eletrólito extracelular, regula volume de líquidos.",
    whatFor: "Avalia equilíbrio hídrico e função renal.",
    highMeaning: "Desidratação, diabetes insípida ou excesso de sal.",
    lowMeaning: "Excesso de hidratação, insuficiência cardíaca ou renal, diuréticos.",
    commonCauses: ["Desidratação", "Excesso de hidratação", "Diuréticos", "Diarreia", "Vómitos"]
  },

  "Potássio": {
    name: "Potássio",
    aliases: ["K", "Kaliémia", "Kaliemia"],
    unit: "mmol/L",
    category: "electrolytes",
    references: [{ min: 3.5, max: 5.5 }],
    whatIs: "Eletrólito essencial para função cardíaca e muscular.",
    whatFor: "Avalia função renal e risco de arritmias.",
    highMeaning: "Pode causar arritmias graves, geralmente por insuficiência renal ou medicamentos.",
    lowMeaning: "Pode causar fraqueza muscular, cãibras e arritmias, geralmente por diuréticos ou diarreia.",
    commonCauses: ["Insuficiência renal", "Diuréticos", "Diarreia", "Vómitos", "Medicamentos"]
  },

  "Cloro": {
    name: "Cloro",
    aliases: ["Cl", "Clorémia", "Cloremia"],
    unit: "mmol/L",
    category: "electrolytes",
    references: [{ min: 99, max: 109 }],
    whatIs: "Eletrólito que acompanha o sódio.",
    whatFor: "Avalia equilíbrio ácido-base e hidratação.",
    highMeaning: "Desidratação, acidose ou problemas renais.",
    lowMeaning: "Vómitos, alcalose ou excesso de hidratação.",
    commonCauses: ["Desidratação", "Vómitos", "Diarreia", "Problemas renais"]
  },

  "Cálcio": {
    name: "Cálcio",
    aliases: ["Ca", "Calcemia", "Cálcio sérico"],
    unit: "mg/dL",
    category: "electrolytes",
    references: [{ min: 8.5, max: 10.5 }],
    whatIs: "Mineral essencial para ossos, músculos e nervos.",
    whatFor: "Avalia saúde óssea, paratiroide e risco de arritmias.",
    highMeaning: "Pode indicar hiperparatiroidismo, cancro ou excesso de vitamina D.",
    lowMeaning: "Pode indicar deficiência de vitamina D, hipoparatiroidismo ou má absorção.",
    commonCauses: ["Hiperparatiroidismo", "Deficiência de vitamina D", "Cancro", "Má absorção"]
  },

  "Magnésio": {
    name: "Magnésio",
    aliases: ["Mg", "Magnesemia", "Magnésio sérico"],
    unit: "mg/dL",
    category: "electrolytes",
    references: [{ min: 1.7, max: 2.4 }],
    whatIs: "Mineral importante para músculos, nervos e coração.",
    whatFor: "Avalia função muscular e cardíaca.",
    highMeaning: "Raro, pode ocorrer com insuficiência renal ou excesso de suplementação.",
    lowMeaning: "Pode causar cãibras, arritmias e fadiga, comum com diuréticos ou má absorção.",
    commonCauses: ["Diuréticos", "Má absorção", "Alcoolismo", "Diarreia crónica"]
  },

  // ========== HORMONAS ==========

  "Testosterona": {
    name: "Testosterona",
    aliases: ["Testosterona Total", "Testosterone"],
    unit: "ng/dL",
    category: "hormones",
    references: [
      { min: 300, max: 1000, sex: "M" },
      { min: 15, max: 70, sex: "F" }
    ],
    whatIs: "Principal hormona sexual masculina.",
    whatFor: "Avalia função sexual, massa muscular e energia.",
    highMeaning: "Nas mulheres pode indicar síndrome dos ovários policísticos.",
    lowMeaning: "Nos homens pode causar fadiga, perda de massa muscular e libido reduzida.",
    commonCauses: ["Hipogonadismo", "Idade", "Obesidade", "SOP (mulheres)"]
  },

  "Cortisol": {
    name: "Cortisol",
    aliases: ["Cortisol sérico"],
    unit: "µg/dL",
    category: "hormones",
    references: [{ min: 5.0, max: 25.0 }],
    whatIs: "Hormona do stress produzida pelas glândulas suprarrenais.",
    whatFor: "Avalia função das suprarrenais e resposta ao stress.",
    highMeaning: "Pode indicar síndrome de Cushing, stress crónico ou medicamentos.",
    lowMeaning: "Pode indicar insuficiência adrenal (doença de Addison).",
    commonCauses: ["Síndrome de Cushing", "Stress", "Insuficiência adrenal", "Medicamentos"]
  },

  "PSA": {
    name: "PSA",
    aliases: ["Antigénio Específico da Próstata", "PSA Total"],
    unit: "ng/mL",
    category: "hormones",
    references: [{ max: 4.0, sex: "M" }],
    whatIs: "Proteína produzida pela próstata.",
    whatFor: "Rastreio de cancro da próstata e doenças prostáticas.",
    highMeaning: "Pode indicar cancro da próstata, hiperplasia benigna ou prostatite.",
    lowMeaning: "Geralmente bom sinal.",
    commonCauses: ["Cancro da próstata", "Hiperplasia benigna", "Prostatite", "Idade"]
  },
};

/**
 * Encontra um marcador pela nome ou alias
 */
export function findMarkerInfo(markerName: string): MarkerInfo | null {
  // Normalizar: trim, lowercase
  const normalized = markerName.trim().toLowerCase();

  // Procurar pelo nome exato
  for (const [key, info] of Object.entries(MARKERS_DATABASE)) {
    if (key.toLowerCase() === normalized) {
      return info;
    }
  }

  // Procurar por alias
  for (const info of Object.values(MARKERS_DATABASE)) {
    if (info.aliases.some(alias => alias.toLowerCase() === normalized)) {
      return info;
    }
  }

  return null;
}

/**
 * Calcula a flag (semáforo) de um marcador
 */
export function calculateFlag(
  value: number,
  refMin: number | null,
  refMax: number | null
): MarkerFlag {
  if (refMin === null && refMax === null) return "normal";

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

/**
 * Normaliza nome de marcador para o nome canónico
 */
export function normalizeMarkerName(originalName: string): string {
  const info = findMarkerInfo(originalName);
  return info ? info.name : originalName;
}

/**
 * Obtém referência apropriada para idade/sexo
 */
export function getReference(
  markerInfo: MarkerInfo,
  age?: number,
  sex?: "M" | "F"
): ReferenceRange {
  // Se só houver uma referência, devolver essa
  if (markerInfo.references.length === 1) {
    return markerInfo.references[0];
  }

  // Procurar por sexo específico
  if (sex) {
    const refBySex = markerInfo.references.find(ref => ref.sex === sex);
    if (refBySex) return refBySex;
  }

  // Fallback: primeira referência
  return markerInfo.references[0];
}
