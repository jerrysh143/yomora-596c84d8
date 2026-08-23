import { queryOptions } from "@tanstack/react-query";
import { listProductsFn, listAdminProductsFn, getProductFn } from "./products.functions";

export const productsQuery = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: () => listProductsFn(),
  });

export const adminProductsQuery = () =>
  queryOptions({
    queryKey: ["products", "admin"],
    queryFn: () => listAdminProductsFn(),
  });

export const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["products", id],
    queryFn: () => getProductFn({ data: { id } }),
  });
