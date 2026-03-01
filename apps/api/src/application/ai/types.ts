/**
 * AI Classification types for urban report classification.
 *
 * Taxonomia hierárquica: Categoria → Subcategorias.
 * O modelo identifica a subcategoria mais específica primeiro e
 * então atribui a categoria-pai correspondente (bottom-up).
 *
 * References:
 * - https://ai.google.dev/gemini-api/docs/structured-output
 */

/** Increment this version whenever the AI classification prompt changes materially. */
export const PROMPT_VERSION = 'v4.0.0';

// ── Taxonomia hierárquica ─────────────────────────────────────────────

export const CATEGORY_SUBCATEGORIES = {
  'Infraestrutura Urbana': [
    'Buracos na via',
    'Recapeamento / Pavimentação',
    'Afundamento de pista',
    'Calçada danificada',
    'Meio-fio quebrado',
    'Boca de lobo entupida',
    'Tampa de bueiro quebrada',
    'Galeria pluvial danificada',
    'Sinalização horizontal apagada',
    'Sinalização vertical danificada',
    'Lombada irregular',
    'Ponte / passarela danificada',
  ],
  'Iluminação Pública': [
    'Poste apagado',
    'Luminária piscando',
    'Lâmpada queimada',
    'Poste danificado',
    'Poste inclinado',
    'Fiação exposta',
    'Curto-circuito',
    'Solicitação de novo ponto de luz',
    'Troca de luminária',
  ],
  'Saneamento e Abastecimento': [
    'Vazamento de água',
    'Vazamento de esgoto',
    'Esgoto a céu aberto',
    'Entupimento de rede',
    'Alagamento',
    'Falta de água',
    'Baixa pressão de água',
    'Mau cheiro proveniente da rede',
    'Rompimento de tubulação',
  ],
  'Limpeza Urbana': [
    'Lixo acumulado em via pública',
    'Entulho irregular',
    'Descarte irregular de resíduos',
    'Solicitação de coleta domiciliar',
    'Solicitação de coleta de volumosos',
    'Terreno baldio com lixo',
    'Limpeza de praça',
    'Capina de mato alto',
    'Remoção de galhos',
    'Varrição',
  ],
  'Meio Ambiente': [
    'Poda de árvore',
    'Supressão de árvore',
    'Árvore com risco de queda',
    'Árvore caída',
    'Queimada urbana',
    'Poluição sonora',
    'Poluição do ar',
    'Descarte irregular em área verde',
    'Maus-tratos a animais',
    'Animais soltos em via pública',
  ],
  'Transporte e Mobilidade': [
    'Semáforo quebrado',
    'Semáforo desregulado',
    'Placa de trânsito danificada',
    'Sinalização apagada',
    'Problema em ponto de ônibus',
    'Ônibus atrasado',
    'Falta de abrigo em ponto',
    'Solicitação de faixa de pedestre',
    'Solicitação de redutor de velocidade',
  ],
  'Saúde Pública': [
    'Atendimento em UBS',
    'Falta de medicamento',
    'Denúncia sanitária',
    'Foco de dengue',
    'Água parada',
    'Animais transmissores de zoonoses',
    'Problema em hospital público',
    'Solicitação de vistoria sanitária',
  ],
  'Segurança e Ordem Pública': [
    'Perturbação do sossego',
    'Comércio ambulante irregular',
    'Ocupação irregular',
    'Pedido de apoio da guarda municipal',
    'Evento irregular',
    'Uso indevido de espaço público',
    'Denúncia de vandalismo',
  ],
  Outros: [],
} as const;

// ── Tipos derivados ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Object.keys returns string[], but we know the keys match ReportCategory
export const REPORT_CATEGORIES = Object.keys(CATEGORY_SUBCATEGORIES) as readonly ReportCategory[];

export type ReportCategory = keyof typeof CATEGORY_SUBCATEGORIES;

type SubcategoryValues = (typeof CATEGORY_SUBCATEGORIES)[ReportCategory][number];

export const ALL_SUBCATEGORIES: readonly string[] = (
  Object.values(CATEGORY_SUBCATEGORIES) as ReadonlyArray<readonly string[]>
).flat();

export type ReportSubcategory = SubcategoryValues;

export const PRIORITY_LEVELS = ['Baixa', 'Média', 'Alta'] as const;

export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

// ── Resultado da classificação ────────────────────────────────────────

export interface AiClassificationResult {
  readonly category: ReportCategory;
  readonly priority: PriorityLevel;
  readonly technical_summary: string;
}

export interface AiClassificationInput {
  readonly title: string;
  readonly description: string;
  readonly location: string | Record<string, unknown>;
}
