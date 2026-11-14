import type { ModelMetadata } from './model-registry';

export type CheckStatus = 'pass' | 'warning' | 'not-checked' | 'inconclusive';
export type FeatureEvidence = { id: string; label: string; status: CheckStatus; highPriority: boolean; sourceReferenceId: string };
export type VisualEvidence = {
  detectedAsBanknote: boolean | null;
  denomination: number | null;
  variantId: string | null;
  imageQuality: 'adequate' | 'poor' | 'unknown';
  checks: FeatureEvidence[];
  requiredFeatureIds: string[];
};
export type AssessmentResult = {
  status: 'likely-genuine' | 'suspicious' | 'unable-to-verify';
  reason: string;
  denomination: number | null;
  checkedFeatures: number;
  uncheckedFeatures: number;
  classificationConfidence: number | null;
  modelVersion: string | null;
};

/** Converts validated, supported visual evidence into a cautious assessment. */
export function evaluateEvidence(evidence: VisualEvidence, model: ModelMetadata | null): AssessmentResult {
  const unavailable = (reason: string): AssessmentResult => ({ status: 'unable-to-verify', reason, denomination: evidence.denomination, checkedFeatures: evidence.checks.filter(c => c.status === 'pass' || c.status === 'warning').length, uncheckedFeatures: evidence.checks.filter(c => c.status === 'not-checked' || c.status === 'inconclusive').length, classificationConfidence: null, modelVersion: model?.version ?? null });
  if (!model) return unavailable('The required local model is not installed.');
  if (!model.validation.passed) return unavailable('The model has not passed its validation requirements.');
  if (!evidence.denomination || !evidence.variantId || !model.supportedVariants.includes(evidence.variantId)) return unavailable('The note type is unknown or unsupported by this model.');
  if (evidence.imageQuality !== 'adequate') return unavailable('Image quality is insufficient for a reliable visual assessment.');
  if (evidence.detectedAsBanknote !== true) return unavailable('A supported banknote was not confidently detected.');
  const required = evidence.requiredFeatureIds.map(id => evidence.checks.find(check => check.id === id));
  if (!required.length || required.some(check => !check || check.status === 'not-checked' || check.status === 'inconclusive')) return unavailable('Required visible feature evidence is incomplete.');
  const failed = evidence.checks.find(check => check.status === 'warning' && check.highPriority);
  const checkedFeatures = evidence.checks.filter(check => check.status === 'pass' || check.status === 'warning').length;
  const uncheckedFeatures = evidence.checks.length - checkedFeatures;
  if (failed) return { status: 'suspicious', reason: `A high-priority visible feature appears inconsistent: ${failed.label}.`, denomination: evidence.denomination, checkedFeatures, uncheckedFeatures, classificationConfidence: null, modelVersion: model.version };
  if (required.some(check => check?.status !== 'pass')) return unavailable('One or more required visible checks remain inconclusive.');
  return { status: 'likely-genuine', reason: 'Required visible characteristics appear consistent with the supported reference. Physical features still require manual inspection.', denomination: evidence.denomination, checkedFeatures, uncheckedFeatures, classificationConfidence: null, modelVersion: model.version };
}
