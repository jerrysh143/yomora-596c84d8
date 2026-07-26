import { queryOptions } from "@tanstack/react-query";
import { getMyMembershipFn } from "./memberships.functions";

export const myMembershipQuery = () =>
  queryOptions({
    queryKey: ["my-membership"],
    queryFn: () => getMyMembershipFn(),
  });