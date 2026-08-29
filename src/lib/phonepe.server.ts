import {
  Env,
  StandardCheckoutClient,
  StandardCheckoutPayRequest,
} from "@phonepe-pg/pg-sdk-node";

type PhonePeConfig = {
  client: StandardCheckoutClient;
  callbackUsername: string;
  callbackPassword: string;
};

let cachedConfig: PhonePeConfig | undefined;

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`PhonePe is not configured: missing ${name}`);
  return value;
}

export function getPhonePeConfig(): PhonePeConfig {
  if (cachedConfig) return cachedConfig;

  const clientId = requiredEnvironmentVariable("PHONEPE_CLIENT_ID");
  const clientSecret = requiredEnvironmentVariable("PHONEPE_CLIENT_SECRET");
  const clientVersion = Number(process.env.PHONEPE_CLIENT_VERSION?.trim() || "1");
  if (!Number.isInteger(clientVersion) || clientVersion < 1) {
    throw new Error("PhonePe is not configured: PHONEPE_CLIENT_VERSION must be a positive integer");
  }

  const environment = process.env.PHONEPE_ENV?.trim().toUpperCase() === "PRODUCTION"
    ? Env.PRODUCTION
    : Env.SANDBOX;

  cachedConfig = {
    client: StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, environment),
    callbackUsername: requiredEnvironmentVariable("PHONEPE_CALLBACK_USERNAME"),
    callbackPassword: requiredEnvironmentVariable("PHONEPE_CALLBACK_PASSWORD"),
  };
  return cachedConfig;
}

export async function createPhonePeCheckout(input: {
  merchantOrderId: string;
  amountInRupees: number;
  redirectUrl: string;
}) {
  const amountInPaise = Math.round(input.amountInRupees * 100);
  if (!Number.isSafeInteger(amountInPaise) || amountInPaise < 100) {
    throw new Error("The payable amount is invalid");
  }

  const request = StandardCheckoutPayRequest.builder()
    .merchantOrderId(input.merchantOrderId)
    .amount(amountInPaise)
    .redirectUrl(input.redirectUrl)
    .message("YOMORA jewellery order")
    .expireAfter(1200)
    .build();

  return getPhonePeConfig().client.pay(request);
}

export async function getPhonePeOrderStatus(merchantOrderId: string) {
  return getPhonePeConfig().client.getOrderStatus(merchantOrderId, true);
}

export function validatePhonePeCallback(authorization: string, responseBody: string) {
  const { client, callbackUsername, callbackPassword } = getPhonePeConfig();
  return client.validateCallback(callbackUsername, callbackPassword, authorization, responseBody);
}

export function normalisePhonePeState(state: string): "pending" | "completed" | "failed" | "cancelled" {
  switch (state.trim().toUpperCase()) {
    case "COMPLETED": return "completed";
    case "FAILED": return "failed";
    case "CANCELLED": return "cancelled";
    default: return "pending";
  }
}
