// ─── Research ──────────────────────────────────────────────────────
export { researchBusiness, analyzeSite, extractPalette, extractTypography, detectLayoutPatterns, inferBusinessModel, inferAudienceInsights, inferMarketPosition } from './research/business-researcher.js';
export { synthesizeDesign, synthesizePalette, synthesizeTypography, synthesizeImagery, synthesizeDosAndDonts, nameColor } from './research/design-synthesizer.js';
export { cacheResearch, getCachedResearch, cacheSiteAnalysis, getCachedSiteAnalysis, isCacheValid } from './research/research-cache.js';

// ─── Validation ────────────────────────────────────────────────────
export { scoreDesignMd, hexDistance, scoreSpecificity, scoreDifferentiation, scoreCompleteness, scoreActionability, checkCulturalAlignment, formatDesignQualityReport } from './validation/design-validator.js';
export { validateOutput, formatValidationReport } from './validation/output-validator.js';
export type { ValidationIssue, OutputValidationResult } from './validation/output-validator.js';

// ─── Rules ─────────────────────────────────────────────────────────
export { getAllRules, getRule, getRulesByIds } from './validation/rules/index.js';
export type { LintRule, LintContext } from './validation/rules/types.js';

// ─── Tokens ────────────────────────────────────────────────────────
export { designMdToDTCG, dtcgToDesignMd, dtcgToCSS, dtcgToFlatJSON, extractColorTokens, extractTypographyTokens, extractSpacingTokens } from './tokens/dtcg-converter.js';
export type { DTCGToken, DTCGTokenGroup, DTCGFile } from './tokens/dtcg-converter.js';

// ─── Templates ─────────────────────────────────────────────────────
export { generateDesignMdTemplate, matchIndustry, matchAesthetic, generateImageryGuidelines, generateDosAndDonts, INDUSTRY_PALETTES, AESTHETIC_MODIFIERS } from './templates/design-md.js';
export type { DesignBrief, IndustryPalette, AestheticModifier } from './templates/design-md.js';
export { buildInitialPrompt, buildRefinementPrompt, buildLocalePrompt, buildConsistencyPrefix } from './templates/prompts.js';
export type { ScreenSpec, RefinementSpec } from './templates/prompts.js';

// ─── Utils ─────────────────────────────────────────────────────────
export { validatePrompt, validateQuota, DesignMdSchema, ColorRoleSchema, PROMPT_MAX_CHARS } from './utils/validators.js';
export type { DesignMd } from './utils/validators.js';
export { enhancePrompt, calculateSlopRisk, getSlopRiskLevel } from './utils/prompt-enhancer.js';
export type { EnhancementResult } from './utils/prompt-enhancer.js';

// ─── Types ─────────────────────────────────────────────────────────
export type {
  BusinessBrief,
  BusinessModelContext,
  SiteAnalysis,
  ExtractedColor,
  ExtractedPalette,
  ExtractedTypography,
  CompetitorAnalysis,
  AudienceInsight,
  MarketPosition,
  BusinessResearchResult,
  DesignQualityIssue,
  DesignQualityScore,
  SynthesizedDesign,
} from './research/types.js';
