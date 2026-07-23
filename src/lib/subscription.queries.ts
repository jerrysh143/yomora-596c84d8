import { queryOptions } from "@tanstack/react-query";
import { getSubscriptionPlanFn } from "./subscription.functions";

export const subscriptionPlanQuery = () =>
  queryOptions({
    queryKey: ["subscription_plan"],
    queryFn: () => getSubscriptionPlanFn(),
  });