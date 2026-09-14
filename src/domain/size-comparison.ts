/** Display reference agreed with the family, not an official character height. */
export const ASH_HEIGHT = 1.4;
export const ASH_ASPECT = 40 / 55;
export const COMPARISON_WIDTH = 240;
export const COMPARISON_BASELINE = 132;
// Only coiled/serpentine species need a body-length schematic.
// Caterpie and Weedle use the same height comparison as other small partners.
export const lengthComparisonIds = new Set([23, 24, 95, 130, 147, 148]);

export function comparisonLayout(height: number, aspect: number, length = false) {
  // In length mode the longest visible dimension represents the listed length.
  // This is a size schematic, not an estimate of the coiled creature's standing height.
  const partnerMetresHigh = length ? height / Math.max(1, aspect) : height;
  const partnerMetresWide = partnerMetresHigh * aspect;
  const gap = 24;
  const scale = Math.min(126 / Math.max(ASH_HEIGHT, partnerMetresHigh), (224 - gap) / (ASH_HEIGHT * ASH_ASPECT + partnerMetresWide));
  const ashHeight = ASH_HEIGHT * scale;
  const ashWidth = ashHeight * ASH_ASPECT;
  const partnerHeight = partnerMetresHigh * scale;
  const partnerWidth = partnerMetresWide * scale;
  const left = (COMPARISON_WIDTH - ashWidth - gap - partnerWidth) / 2;
  return { scale, ashHeight, ashWidth, partnerHeight, partnerWidth, left, partnerX: left + ashWidth + gap };
}
