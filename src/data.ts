import type { Feature } from './types';
export const denominations = [20, 50, 100, 200, 500, 1000] as const;
export const features: Feature[] = [
  { method: 'FEEL', label: 'Raised printing', instruction: 'Gently feel the portrait, denomination, and selected printed areas for tactile relief.' },
  { method: 'FEEL', label: 'Texture and substrate', instruction: 'Compare the note’s feel with a familiar note of the same type. Paper and polymer notes feel different.' },
  { method: 'LOOK', label: 'Portrait and fine details', instruction: 'Check that the portrait, fine lines, and printed value look sharp and consistently placed.' },
  { method: 'LOOK', label: 'Watermark or clear window', instruction: 'Check the features documented for this particular series and material.' },
  { method: 'TILT', label: 'Optical features', instruction: 'Tilt the note and look for the denomination-specific effects described in an official reference.' },
];
export const disclaimer = 'PESO SCAN provides AI-assisted visual assessments for educational and informational purposes only. It is not an official currency authentication service and is not affiliated with the Bangko Sentral ng Pilipinas. Camera-based analysis cannot verify all physical and optical security features. Always inspect banknotes physically and consult an authorized financial institution or the BSP when authenticity is uncertain.';
