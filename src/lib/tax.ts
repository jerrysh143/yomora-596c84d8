export const GST_RATE = 3;
export const GSTIN = "24AELPS5407A1ZR";

/** Returns the GST component already included in a tax-inclusive amount. */
export const includedGst = (amount: number, rate = GST_RATE) =>
  Math.round(Math.max(0, amount) * rate / (100 + rate));
