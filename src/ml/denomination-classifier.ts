import * as ort from 'onnxruntime-web';

export const PESO_CLASSES = [20, 50, 100, 200, 500, 1000] as const;
export type PesoDenomination = (typeof PESO_CLASSES)[number];

type ModelArtifactMetadata = {
  model_present: true;
  deployment_approved: boolean;
  candidate_status?: string;
  architecture: 'torchvision.mobilenet_v3_small';
  class_ids: number[];
  onnx_file: string;
  onnx_sha256: string;
  test_evaluation: { split: 'test'; accuracy: number; macro_f1: number; manifest_sha256: string; checkpoint_sha256: string };
  onnxruntime_cpu_parity_max_abs_error: number;
  input_name: string;
  output_name: string;
  input: {
    shape: ['batch', 3, 224, 224];
    layout: 'NCHW';
    color: 'RGB';
    preprocessing: string;
  };
  normalization: { mean: number[]; std: number[] };
};

export type DenominationScore = { denomination: PesoDenomination; score: number };
export type DenominationPrediction = {
  denomination: PesoDenomination;
  /** Softmax score for ranking denominations. This is not authenticity confidence. */
  score: number;
  scores: DenominationScore[];
  model: 'mobilenet_v3_small';
};

export type ClassifierLoadOptions = {
  metadataUrl: string;
  /** Explicit ONNX URL; it is never guessed or fetched until the caller requests a load. */
  modelUrl: string;
  /** Opt in only for a clearly labeled experimental denomination candidate. */
  allowExperimental?: boolean;
  fetcher?: typeof fetch;
};

const WIDTH = 224;
const HEIGHT = 224;
const MEAN = [0.485, 0.456, 0.406] as const;
const STD = [0.229, 0.224, 0.225] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseMetadata(value: unknown, allowExperimental: boolean): ModelArtifactMetadata {
  if (!isRecord(value) || value.model_present !== true) {
    throw new Error('The denomination model is missing or has invalid metadata.');
  }
  if (value.deployment_approved !== true &&
      !(allowExperimental && value.deployment_approved === false && value.candidate_status === 'experimental_unreviewed')) {
    throw new Error('The denomination model is missing or has not been approved for standard local inference.');
  }
  const classIds = value.class_ids;
  if (value.architecture !== 'torchvision.mobilenet_v3_small' || !Array.isArray(classIds) ||
      classIds.length !== PESO_CLASSES.length || !PESO_CLASSES.every((item, index) => classIds[index] === item)) {
    throw new Error('The model metadata does not match the PESO SCAN denomination classes.');
  }
  if (typeof value.onnx_file !== 'string' || typeof value.onnx_sha256 !== 'string' || !/^[a-f\d]{64}$/i.test(value.onnx_sha256)) {
    throw new Error('The ONNX model filename or SHA-256 metadata is invalid.');
  }
  if (!isRecord(value.test_evaluation) || value.test_evaluation.split !== 'test' ||
      typeof value.test_evaluation.accuracy !== 'number' || typeof value.test_evaluation.macro_f1 !== 'number' ||
      typeof value.test_evaluation.manifest_sha256 !== 'string' || !/^[a-f\d]{64}$/i.test(value.test_evaluation.manifest_sha256) ||
      typeof value.test_evaluation.checkpoint_sha256 !== 'string' || !/^[a-f\d]{64}$/i.test(value.test_evaluation.checkpoint_sha256) ||
      typeof value.onnxruntime_cpu_parity_max_abs_error !== 'number') {
    throw new Error('The model is missing held-out test evaluation or ONNX parity evidence.');
  }
  if (!Number.isFinite(value.test_evaluation.accuracy) || value.test_evaluation.accuracy < 0 || value.test_evaluation.accuracy > 1 ||
      !Number.isFinite(value.test_evaluation.macro_f1) || value.test_evaluation.macro_f1 < 0 || value.test_evaluation.macro_f1 > 1 ||
      !Number.isFinite(value.onnxruntime_cpu_parity_max_abs_error)) {
    throw new Error('The model evaluation metadata contains invalid numeric values.');
  }
  if (typeof value.input_name !== 'string' || typeof value.output_name !== 'string' || !isRecord(value.input) ||
      value.input.layout !== 'NCHW' || value.input.color !== 'RGB' || !Array.isArray(value.input.shape) ||
      value.input.shape.join(',') !== 'batch,3,224,224' ||
      value.input.preprocessing !== 'aspect-preserving resize and centered black padding to 224x224 with Pillow, then ImageNet mean/std normalization' ||
      !isRecord(value.normalization) || !Array.isArray(value.normalization.mean) || !Array.isArray(value.normalization.std) ||
      value.normalization.mean.join(',') !== MEAN.join(',') || value.normalization.std.join(',') !== STD.join(',')) {
    throw new Error('The model input contract is not supported by this adapter.');
  }
  return value as ModelArtifactMetadata;
}

async function verifySha256(data: ArrayBuffer, expected: string): Promise<void> {
  if (!globalThis.crypto?.subtle) throw new Error('Secure browser crypto is unavailable; open PESO SCAN using HTTPS or localhost.');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  const actual = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  if (actual.toLowerCase() !== expected.toLowerCase()) throw new Error('The local model checksum does not match its metadata.');
}

function sameOriginUrl(path: string): URL {
  if (typeof globalThis.location === 'undefined') throw new Error('The local browser model loader requires a browser context.');
  const url = new URL(path, globalThis.location.href);
  if (url.origin !== globalThis.location.origin) throw new Error('PESO SCAN only loads model files from this application origin.');
  return url;
}

function sourceSize(source: CanvasImageSource): { width: number; height: number } {
  if (source instanceof HTMLVideoElement) return { width: source.videoWidth, height: source.videoHeight };
  if (source instanceof HTMLImageElement) return { width: source.naturalWidth, height: source.naturalHeight };
  if (source instanceof HTMLCanvasElement) return { width: source.width, height: source.height };
  if (typeof OffscreenCanvas !== 'undefined' && source instanceof OffscreenCanvas) return { width: source.width, height: source.height };
  if (source instanceof ImageBitmap) return { width: source.width, height: source.height };
  throw new Error('Unsupported image source. Provide an image, video frame, canvas, or ImageBitmap.');
}

/** Converts RGB pixels to the Python training pipeline's padded NCHW tensor. */
export function imageToModelTensor(source: CanvasImageSource): ort.Tensor {
  const { width, height } = sourceSize(source);
  if (!width || !height) throw new Error('The image has no decoded pixels yet.');
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Could not create a 2D canvas for image preprocessing.');
  context.fillStyle = 'rgb(0, 0, 0)';
  context.fillRect(0, 0, WIDTH, HEIGHT);
  const scale = Math.min(WIDTH / width, HEIGHT / height);
  const resizedWidth = Math.max(1, Math.round(width * scale));
  const resizedHeight = Math.max(1, Math.round(height * scale));
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, (WIDTH - resizedWidth) / 2, (HEIGHT - resizedHeight) / 2, resizedWidth, resizedHeight);
  const pixels = context.getImageData(0, 0, WIDTH, HEIGHT).data;
  const plane = WIDTH * HEIGHT;
  const tensorData = new Float32Array(3 * plane);
  for (let pixel = 0; pixel < plane; pixel += 1) {
    for (let channel = 0; channel < 3; channel += 1) {
      const value = pixels[pixel * 4 + channel] / 255;
      tensorData[channel * plane + pixel] = (value - MEAN[channel]) / STD[channel];
    }
  }
  return new ort.Tensor('float32', tensorData, [1, 3, HEIGHT, WIDTH]);
}

export class LocalDenominationClassifier {
  private constructor(private readonly session: ort.InferenceSession, private readonly metadata: ModelArtifactMetadata) {}

  static async load(options: ClassifierLoadOptions): Promise<LocalDenominationClassifier> {
    const fetcher = options.fetcher ?? fetch;
    const metadataUrl = sameOriginUrl(options.metadataUrl);
    const modelUrl = sameOriginUrl(options.modelUrl);
    const metadataResponse = await fetcher(metadataUrl.href, { cache: 'no-cache' });
    if (!metadataResponse.ok) throw new Error(`Could not load model metadata (${metadataResponse.status}).`);
    const metadata = parseMetadata(await metadataResponse.json(), options.allowExperimental === true);
    if (decodeURIComponent(modelUrl.pathname.split('/').at(-1) ?? '') !== metadata.onnx_file) {
      throw new Error('The model URL filename does not match the model metadata.');
    }
    const modelResponse = await fetcher(modelUrl.href, { cache: 'no-cache' });
    if (!modelResponse.ok) throw new Error(`Could not load the local ONNX model (${modelResponse.status}).`);
    const modelBuffer = await modelResponse.arrayBuffer();
    await verifySha256(modelBuffer, metadata.onnx_sha256);
    ort.env.wasm.numThreads = 1;
    const session = await ort.InferenceSession.create(modelBuffer, { executionProviders: ['wasm'] });
    if (!session.inputNames.includes(metadata.input_name) || !session.outputNames.includes(metadata.output_name)) {
      await session.release();
      throw new Error('The model tensor names do not match its metadata.');
    }
    return new LocalDenominationClassifier(session, metadata);
  }

  async predict(source: CanvasImageSource): Promise<DenominationPrediction> {
    const outputs = await this.session.run({ [this.metadata.input_name]: imageToModelTensor(source) });
    const logits = outputs[this.metadata.output_name];
    if (!logits || !(logits.data instanceof Float32Array) || logits.data.length !== PESO_CLASSES.length ||
        logits.dims.length !== 2 || logits.dims[0] !== 1 || logits.dims[1] !== PESO_CLASSES.length) {
      throw new Error('The model returned an unsupported output tensor.');
    }
    const values = Array.from(logits.data);
    if (values.some(value => !Number.isFinite(value))) throw new Error('The model returned invalid prediction values.');
    const max = Math.max(...values);
    const exp = values.map(value => Math.exp(value - max));
    const total = exp.reduce((sum, value) => sum + value, 0);
    const scores = exp.map((value, index) => ({ denomination: PESO_CLASSES[index], score: value / total }));
    scores.sort((a, b) => b.score - a.score);
    return { denomination: scores[0].denomination, score: scores[0].score, scores, model: 'mobilenet_v3_small' };
  }

  async dispose(): Promise<void> {
    await this.session.release();
  }
}
