import { useQuery } from "@tanstack/react-query";
import type { MatchHistoryEntry } from "@/lib/somnia";
import { fetchMatchHistory } from "@/lib/somnia";

export const useMatchHistory = (publisher?: `0x${string}` | null) => {
  return useQuery<MatchHistoryEntry[]>({
    queryKey: ["match-history", publisher],
    queryFn: () => {
      if (!publisher) return Promise.resolve([]);
      return fetchMatchHistory(publisher);
    },
    enabled: Boolean(publisher),
    staleTime: 30_000,
    refetchInterval: 45_000,
  });
};


