export const EDUCATOR_TIER_TARGET = 30;
export const BASIC_EDUCATOR_MAX_CLIENT_MODE = 2;
export const ADVANCED_EDUCATOR_MAX_CLIENT_MODE = 4;

export function getEducatorTier(reportCount) {
  return reportCount >= EDUCATOR_TIER_TARGET ? 'advanced' : 'basic';
}

export function getEducatorClientModeLimit(reportCount) {
  return getEducatorTier(reportCount) === 'advanced'
    ? ADVANCED_EDUCATOR_MAX_CLIENT_MODE
    : BASIC_EDUCATOR_MAX_CLIENT_MODE;
}
