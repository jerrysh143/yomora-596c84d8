const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHORT_ORDER_PATTERN = /^(?:YM[- ]?)?([0-9a-f]{8})$/i;

export function formatOrderNumber(orderId: string) {
  return `YM-${orderId.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

export function isValidOrderReference(value: string) {
  const reference = value.trim();
  return UUID_PATTERN.test(reference) || SHORT_ORDER_PATTERN.test(reference);
}

export function matchesOrderReference(orderId: string, value: string) {
  const reference = value.trim();
  if (UUID_PATTERN.test(reference)) return orderId.toLowerCase() === reference.toLowerCase();
  const shortCode = reference.match(SHORT_ORDER_PATTERN)?.[1];
  return (
    !!shortCode && orderId.replaceAll("-", "").slice(0, 8).toLowerCase() === shortCode.toLowerCase()
  );
}
