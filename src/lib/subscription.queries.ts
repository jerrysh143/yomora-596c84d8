import { queryOptions } from "@tanstack/react-query";
import { listSubscriptionPlansFn } from "./subscription.functions";

export const subscriptionPlansQuery = () =>
  queryOptions({
    queryKey: ["subscription_plans"],
    queryFn: () => listSubscriptionPlansFn(),
  });