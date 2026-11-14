export type ModelRuntime = 'tensorflowjs' | 'onnxruntime-web';
export type ModelMetadata = {
  id: string;
  name: string;
  version: string;
  runtime: ModelRuntime;
  modelPath: string;
  input: { width: number; height: number; colorSpace: 'RGB' | 'BGR'; normalization: string };
  supportedVariants: string[];
  sha256: string;
  validation: { passed: boolean; evaluationDate: string | null; protocol: string | null };
};
export type ModelRole = 'note-detector' | 'denomination-classifier' | 'feature-analyzer';
export type ModelAvailability = { available: boolean; message: string; model: ModelMetadata | null };

/** Intentionally empty until real, evaluated local models are supplied. */
export const modelRegistry: Readonly<Record<ModelRole, ModelMetadata | null>> = {
  'note-detector': null,
  'denomination-classifier': null,
  'feature-analyzer': null,
};

export function getModelAvailability(role: ModelRole): ModelAvailability {
  const model = modelRegistry[role];
  if (!model) return { available: false, message: 'AI MODEL NOT INSTALLED — denomination recognition and authenticity assessment are unavailable.', model: null };
  if (!model.validation.passed) return { available: false, message: 'The local model has not passed validation and cannot assess banknotes.', model };
  return { available: true, message: 'Validated local model is available.', model };
}
