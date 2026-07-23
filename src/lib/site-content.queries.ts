import { queryOptions } from "@tanstack/react-query";
import { getSiteContentFn } from "./site-content.functions";
import { mergeSiteContent, SITE_CONTENT_DEFAULTS, type SiteContentMap } from "./site-content.defaults";

export const siteContentQuery = () =>
  queryOptions({
    queryKey: ["site_content"],
    queryFn: async (): Promise<SiteContentMap> => {
      try {
        const rows = await getSiteContentFn();
        return mergeSiteContent(rows);
      } catch {
        return SITE_CONTENT_DEFAULTS;
      }
    },
    staleTime: 60_000,
  });