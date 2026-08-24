export const AWARENESS_ACCESS_CLAIM = 'awareness_access';

export function hasAwarenessAccess(user) {
  return user?.app_metadata?.[AWARENESS_ACCESS_CLAIM] === true;
}
