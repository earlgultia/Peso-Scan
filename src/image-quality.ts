export type ImageQuality = { label: string; notes: string[] };

/** Heuristic image checks for capture guidance only; they do not assess banknote authenticity. */
export function assessImageQuality(image: ImageData): ImageQuality {
  const { data, width, height } = image;
  const step = Math.max(4, Math.floor(Math.min(width, height) / 240));
  let luminanceSum = 0, sampled = 0, clipped = 0, laplacianSum = 0, laplacianSquared = 0, edgeSamples = 0;
  const luminance = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return .2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2];
  };
  for (let y = 1; y < height - 1; y += step) for (let x = 1; x < width - 1; x += step) {
    const l = luminance(x, y);
    luminanceSum += l; sampled++;
    if (l < 7 || l > 248) clipped++;
    const laplacian = luminance(x - 1, y) + luminance(x + 1, y) + luminance(x, y - 1) + luminance(x, y + 1) - 4 * l;
    laplacianSum += laplacian; laplacianSquared += laplacian * laplacian; edgeSamples++;
  }
  if (!sampled) return { label: 'Unable to assess', notes: ['Image dimensions were insufficient for a local quality check.'] };
  const brightness = luminanceSum / sampled;
  const edgeMean = laplacianSum / edgeSamples;
  const edgeVariance = laplacianSquared / edgeSamples - edgeMean * edgeMean;
  const clippedRatio = clipped / sampled;
  const notes: string[] = [];
  if (brightness < 55) notes.push('Lighting appears low. Move to a brighter area.');
  else if (brightness > 210) notes.push('Image appears overexposed. Reduce direct light.');
  if (clippedRatio > .18) notes.push('Bright glare or deep shadows may hide printed details.');
  if (edgeVariance < 90) notes.push('The image may be out of focus or blurry. Hold steady and retry.');
  if (!notes.length) notes.push('Basic lighting and edge checks look adequate; inspect the whole note manually.');
  return { label: notes.length === 1 && notes[0].startsWith('Basic') ? 'Basic checks look adequate' : 'Review image quality', notes };
}
