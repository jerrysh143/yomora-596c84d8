import { queryOptions } from "@tanstack/react-query";
import { listCategoriesFn } from "./categories.functions";

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: () => listCategoriesFn(),
    staleTime: 60_000,
  });