import { queryOptions } from "@tanstack/react-query";
import { listProductsFn, getProductFn } from "./products.functions";

export const productsQuery = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: () => listProductsFn(),
  });

export const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["products", id],
    queryFn: () => getProductFn({ data: { id } }),
  });
