import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalDenominationClassifier } from './denomination-classifier';

describe('LocalDenominationClassifier', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('does not fetch a model whose metadata is not explicitly approved', async () => {
    vi.stubGlobal('location', { href: 'https://peso-scan.test/', origin: 'https://peso-scan.test' });
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ model_present: true, deployment_approved: false }), { status: 200 }),
    );

    await expect(LocalDenominationClassifier.load({
      metadataUrl: '/models/metadata.json',
      modelUrl: '/models/model.onnx',
      fetcher,
    })).rejects.toThrow('missing or has not been approved');

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('https://peso-scan.test/models/metadata.json', { cache: 'no-cache' });
  });
});
