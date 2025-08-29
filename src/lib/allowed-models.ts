// Strict allowlist of approved Gemini 2.5 models
// This prevents model injection attacks by only allowing specific, pre-approved models
export const ALLOWED_GEMINI_MODELS = [
  'fal-ai/gemini-25-flash-image/edit',
  'fal-ai/gemini-25-flash-image',
  'fal-ai/any-llm/vision',
] as const;

export type AllowedModel = typeof ALLOWED_GEMINI_MODELS[number];

export function isModelAllowed(model: string): boolean {
  return ALLOWED_GEMINI_MODELS.includes(model as AllowedModel);
}

export function getModelValidationError(): string {
  return `Invalid model. Only the following models are allowed: ${ALLOWED_GEMINI_MODELS.join(', ')}`;
}