import { describe, expect, it } from 'vitest';
import { evaluateEvidence, type VisualEvidence } from './result-evaluator';
import type { ModelMetadata } from './model-registry';

const model: ModelMetadata = { id: 'test', name: 'Test model', version: '1.0.0', runtime: 'onnxruntime-web', modelPath: '/models/test.onnx', input: { width: 224, height: 224, colorSpace: 'RGB', normalization: '0..1' }, supportedVariants: ['php-test-series'], sha256: 'test-checksum', validation: { passed: true, evaluationDate: '2026-01-01', protocol: 'test protocol' } };
const goodEvidence: VisualEvidence = { detectedAsBanknote: true, denomination: 500, variantId: 'php-test-series', imageQuality: 'adequate', requiredFeatureIds: ['portrait'], checks: [{ id: 'portrait', label: 'Portrait placement', status: 'pass', highPriority: true, sourceReferenceId: 'ref-1' }] };

describe('evaluateEvidence', () => {
  it('returns unable to verify when there is no model', () => expect(evaluateEvidence(goodEvidence, null).status).toBe('unable-to-verify'));
  it('never treats a missing required check as a pass', () => expect(evaluateEvidence({ ...goodEvidence, checks: [] }, model).status).toBe('unable-to-verify'));
  it('reports suspicious only for a high-priority warning with evidence', () => expect(evaluateEvidence({ ...goodEvidence, checks: [{ ...goodEvidence.checks[0], status: 'warning' }] }, model).status).toBe('suspicious'));
  it('returns likely genuine only after all required visible checks pass', () => expect(evaluateEvidence(goodEvidence, model).status).toBe('likely-genuine'));
  it('does not show uncalibrated classification confidence as authenticity probability', () => expect(evaluateEvidence(goodEvidence, model).classificationConfidence).toBeNull());
});
