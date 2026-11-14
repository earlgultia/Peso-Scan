import { describe, expect, it } from 'vitest';
import { assessImageQuality } from './image-quality';

function flatImage(width: number, height: number, value: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) { data[i] = value; data[i + 1] = value; data[i + 2] = value; data[i + 3] = 255; }
  return { data, width, height } as ImageData;
}

describe('assessImageQuality', () => {
  it('flags a very dark capture for better lighting', () => {
    expect(assessImageQuality(flatImage(80, 80, 20)).notes.join(' ')).toContain('Lighting appears low');
  });
  it('does not claim flat, featureless pixels are sharp', () => {
    expect(assessImageQuality(flatImage(80, 80, 125)).notes.join(' ')).toContain('out of focus or blurry');
  });
});
