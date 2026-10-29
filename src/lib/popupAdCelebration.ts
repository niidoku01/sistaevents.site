/**
 * Celebration styling historically required a `celebratory` field in the
 * `popupAds` schema. Older Convex deployments reject that extra argument and
 * mask the validation error as a generic "Server Error", which made celebration
 * ads impossible to save (and therefore impossible to go live).
 *
 * To stay compatible with every deployment, we also mirror the flag in an
 * invisible marker at the start of the ad title. Deployments that know about
 * `celebratory` keep using the real boolean; older ones still work because the
 * title is a plain string field they already accept.
 */
export const CELEBRATION_TITLE_MARKER = "\u200B[celebration]";

type CelebrationFields = {
  celebratory?: boolean;
  title?: string;
};

/** True when an ad should render the celebration style/confetti. */
export const isCelebrationAd = (ad: CelebrationFields | null | undefined): boolean => {
  if (!ad) return false;
  return ad.celebratory === true || (ad.title ?? "").startsWith(CELEBRATION_TITLE_MARKER);
};

/** Adds the invisible marker so older deployments can persist the style. */
export const celebrationTitle = (title?: string): string => {
  const clean = title?.trim() ?? "";
  return clean ? `${CELEBRATION_TITLE_MARKER}${clean}` : CELEBRATION_TITLE_MARKER;
};

/** The title to display, with the compatibility marker removed. */
export const adTitle = (ad: CelebrationFields | null | undefined): string => {
  const title = ad?.title ?? "";
  return (title.startsWith(CELEBRATION_TITLE_MARKER)
    ? title.slice(CELEBRATION_TITLE_MARKER.length)
    : title
  ).trim();
};
