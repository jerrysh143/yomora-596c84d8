export const GST_RATE = 3;
export const GSTIN = "24AELPS5407A1ZR";

const roundToPaise = (value: number) => Math.round(value * 100) / 100;

export const formatTaxINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

/** Breaks tax-inclusive pricing into pre-tax, discount, taxable and GST rows. */
export const inclusiveTaxBreakdown = (subtotal: number, discount = 0, rate = GST_RATE) => {
  const grossSubtotal = Math.max(0, subtotal);
  const grossDiscount = Math.min(Math.max(0, discount), grossSubtotal);
  const invoiceTotal = roundToPaise(grossSubtotal - grossDiscount);
  const productAmount = roundToPaise(grossSubtotal * 100 / (100 + rate));
  const taxableAmount = roundToPaise(invoiceTotal * 100 / (100 + rate));
  const discountAmount = roundToPaise(productAmount - taxableAmount);
  const gstAmount = roundToPaise(invoiceTotal - taxableAmount);

  return { productAmount, discountAmount, taxableAmount, gstAmount, invoiceTotal };
};
