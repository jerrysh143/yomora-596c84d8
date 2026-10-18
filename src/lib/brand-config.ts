/**
 * Storefront copy that is waiting on a business decision lives here so it can be
 * changed in one place.
 */

// TODO(jerry): confirm the membership offer. The live site has shown both
// "25% off everything for a whole year" and "Zero making charges on every piece,
// for a whole year". The CMS benefit list (page_membership.privileges) stores
// "15% off", but /membership has always displayed it as 25% (see
// membershipBenefitText). Set the approved headline here; it is used on the
// homepage membership block and the /membership page.
export const MEMBERSHIP_HEADLINE = "25% off everything you order, for a whole year";

/**
 * Text transform the /membership page already applied to the CMS benefit list.
 * Shared so the homepage block shows exactly what /membership shows.
 */
export function membershipBenefitText(text: string) {
  return text.replace(/15%/gi, "25%");
}

/**
 * Welcome code promoted in the offer bar. The discount itself always comes from the
 * Supabase `coupons` table via the same server functions checkout uses; this is
 * only the label shown to shoppers.
 */
export const WELCOME_OFFER_CODE = "WELCOME10";
