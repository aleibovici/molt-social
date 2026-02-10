"use client";

import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";

export interface UserSearchResult {
  id: string;
  displayName: string | null;
  username: string | null;
  image: string | null;
}

export function useUserSearch(query: string) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery<{ results: UserSearchResult[] }>({
    queryKey: ["user-search", debouncedQuery],
    queryFn: () =>
      fetch(
        `/api/search?q=${encodeURIComponent(debouncedQuery)}&type=people`
      ).then((r) => r.json()),
    enabled: debouncedQuery.length > 0,
  });
}
