export type ReportScores = {
  audiencePotential: number;
  differentiation: number;
  monetization: number;
  commercialPotential: number;
  retention: number;
  sponsorability: number;
  strategicClarity: number;
  organicGrowth: number;
  positioningStrength: number;
};

export type Report = {
  suggestedName: string;
  overallScore: number;
  verdict: "Alto Potencial" | "Médio Potencial" | "Alto Risco";
  finalRecommendation: "GO" | "GO COM AJUSTES" | "NO-GO";
  recommendationReasoning: string;
  scores: ReportScores;
  structure: {
    valueProposition: string;
    targetAudience: string;
    differential: string;
    positioning: string;
    conceptClarity: string;
  };
  market: {
    saturation: string;
    organicDiscovery: string;
    nicheTrend: string;
    growthPotential: string;
    marketInterest: string;
  };
  monetization: {
    sponsorCategories: string[];
    suggestedBrands: string[];
    revenueModels: string[];
    commercialFormats: string[];
    opportunities: string[];
  };
  retention: {
    potential: string;
    formatStrength: string;
    recurrence: string;
    abandonmentRisk: string;
    predictability: string;
  };
  positioning: {
    nicheClarity: string;
    differentiation: string;
    opportunities: string;
    recommendedAdjustments: string;
  };
  risks: string[];
  roadmap: string[];
};

export const SCORE_LABELS: Record<keyof ReportScores, string> = {
  audiencePotential: "Potencial de Audiência",
  differentiation: "Diferenciação",
  monetization: "Monetização",
  commercialPotential: "Potencial Comercial",
  retention: "Retenção",
  sponsorability: "Patrocinabilidade",
  strategicClarity: "Clareza Estratégica",
  organicGrowth: "Crescimento Orgânico",
  positioningStrength: "Força de Posicionamento",
};
