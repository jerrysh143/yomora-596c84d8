export type PincodeResult = { city: string; state: string };

/**
 * Looks up an Indian pincode via the public India Post API.
 * Shared by checkout (address autofill) and the product page delivery check.
 */
export async function lookupPincode(pincode: string, signal?: AbortSignal): Promise<PincodeResult> {
  const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, { signal });
  if (!response.ok) throw new Error("Pincode lookup failed");
  const payload = (await response.json()) as Array<{
    Status?: string;
    PostOffice?: Array<{ District?: string; State?: string }>;
  }>;
  const office = payload?.[0]?.PostOffice?.[0];
  if (payload?.[0]?.Status !== "Success" || !office?.District || !office?.State) {
    throw new Error("Pincode not found");
  }
  return { city: office.District, state: office.State };
}
