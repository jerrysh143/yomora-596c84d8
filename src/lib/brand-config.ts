/**
 * Storefront copy that is waiting on a business decision lives here so it can be
 * changed in one place.
 */

// Approved by Jerry (Oct 2026): the membership gives BOTH 25% off and zero making
// charges for a year. Used on the homepage membership block and /membership.
export const MEMBERSHIP_HEADLINE =
  "25% off everything you order plus zero making charges, for a whole year";

type Privilege = { icon: string; title: string; description: string };

const DISCOUNT_PRIVILEGE = {
  icon: "Sparkles",
  title: "25% OFF",
  description: "on everything you order for 1 year",
} as const;
const MAKING_PRIVILEGE = {
  icon: "Hammer",
  title: "ZERO MAKING CHARGES",
  description: "on every 925 silver piece for 1 year",
} as const;

/**
 * Older CMS copy (site_content.page_membership.privileges[0].title) still says
 * "15% OFF". Customers must only ever see the approved 25%.
 */
export function membershipBenefitText(text: string) {
  return text.replace(/\b15\s*%/gi, "25%");
}

const hasDiscount = (t: string) => /25\s*%/.test(t);
const hasMaking = (t: string) => /making charge/i.test(t);

/** CMS privilege cards, normalised so both approved benefits always show first. */
export function membershipPrivileges<T extends Privilege>(list: T[]): T[] {
  const mapped = list.map((p) => ({
    ...p,
    title: membershipBenefitText(p.title),
    description: membershipBenefitText(p.description),
  }));
  const text = (p: Privilege) => `${p.title} ${p.description}`;
  const discount = mapped.filter((p) => hasDiscount(text(p)) && !hasMaking(text(p)));
  const making = mapped.filter((p) => hasMaking(text(p)));
  const rest = mapped.filter((p) => !discount.includes(p) && !making.includes(p));
  return [
    ...(discount.length ? discount : [DISCOUNT_PRIVILEGE as unknown as T]),
    ...(making.length ? making : [MAKING_PRIVILEGE as unknown as T]),
    ...rest,
  ];
}

/** Plain-text plan benefits (subscription_plan.benefits), same guarantee. */
export function membershipBenefitList(list: string[]): string[] {
  const mapped = list.map(membershipBenefitText);
  const discount = mapped.filter((b) => hasDiscount(b) && !hasMaking(b));
  const making = mapped.filter(hasMaking);
  const rest = mapped.filter((b) => !discount.includes(b) && !making.includes(b));
  return [
    ...(discount.length ? discount : ["25% off on everything you order for 1 year"]),
    ...(making.length ? making : ["Zero making charges on all 925 silver products"]),
    ...rest,
  ];
}

/**
 * Welcome code promoted in the offer bar. The discount itself always comes from the
 * Supabase `coupons` table via the same server functions checkout uses; this is
 * only the label shown to shoppers.
 */
export const WELCOME_OFFER_CODE = "WELCOME10";
