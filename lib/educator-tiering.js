export const EDUCATOR_TIER_TARGET = 30;

export function getEducatorTier(reportCount) {
  return reportCount >= EDUCATOR_TIER_TARGET ? 'advanced' : 'basic';
}
