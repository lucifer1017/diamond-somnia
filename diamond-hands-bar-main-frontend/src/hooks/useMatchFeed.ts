import { useEffect, useState, useRef } from "react";
import { getSubscriptionClient, fetchMatchHistory, MATCH_EVENT_ID } from "@/lib/somnia";
import { SDK } from "@somnia-chain/streams";
import { decodeEventLog } from "viem";
import type { MatchHistoryEntry } from "@/lib/somnia";

interface MatchFeedItem extends MatchHistoryEntry {
  id: string;
  receivedAt: number;
}

// Simple ABI for decoding the event
const matchEventABI = [
  {
    type: "event",
    name: "MatchCompleted",
    inputs: [
      { name: "matchIdHash", type: "bytes32", indexed: true },
    ],
  },
] as const;

export const useMatchFeed = (maxItems = 10) => {
  const [feedItems, setFeedItems] = useState<MatchFeedItem[]>([]);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout | null = null;

    const setupSubscription = async () => {
      // Check if WebSocket is actually available
      if (typeof window === "undefined") {
        return;
      }

      try {
        const client = getSubscriptionClient();
        const subscriptionSdk = new SDK({ public: client });

        const subscription = await subscriptionSdk.streams.subscribe({
          somniaStreamsEventId: MATCH_EVENT_ID,
          ethCalls: [],
          onlyPushChanges: false,
          onData: async (data: any) => {
            if (!mounted) return;
        console.log("[MatchFeed] New match event received:", data);
        
        try {
          // Decode the event log
          if (data.result?.topics && data.result?.data) {
            const decoded = decodeEventLog({
              abi: matchEventABI,
              topics: data.result.topics,
              data: data.result.data,
            });
            
            const matchIdHash = decoded.args.matchIdHash as `0x${string}`;
            const publisher = data.result.address as `0x${string}`;

            // Fetch the full match data from the ledger
            const matches = await fetchMatchHistory(publisher, 1);
            const match = matches.find((m) => m.matchIdHash === matchIdHash) || matches[0];

            if (match) {
              const matchItem: MatchFeedItem = {
                ...match,
                id: `feed-${Date.now()}-${Math.random()}`,
                receivedAt: Date.now(),
              };

              setFeedItems((prev) => {
                // Avoid duplicates
                if (prev.some((item) => item.matchIdHash === matchIdHash)) {
                  return prev;
                }
                const updated = [matchItem, ...prev].slice(0, maxItems);
                return updated;
              });
            }
          }
        } catch (err) {
          console.error("[MatchFeed] Error processing event:", err);
        }
      },
          onError: (error: Error) => {
            if (!mounted) return;
            console.error("[MatchFeed] Subscription error:", error);
            setIsConnected(false);
          },
        });

        if (subscription) {
          subscriptionRef.current = subscription;
          setIsConnected(true);
          console.log("[MatchFeed] Subscription active");
        }
      } catch (error) {
        if (!mounted) return;
        console.warn("[MatchFeed] Failed to setup subscription (WebSocket may be unavailable). Live feed disabled.");
        setIsConnected(false);
        // Don't retry - WebSocket is likely not available
        return;
      }
    };

    // Small delay to avoid immediate connection attempts on mount
    retryTimeout = setTimeout(() => {
      setupSubscription();
    }, 1000);

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [maxItems]);

  return { feedItems, isConnected };
};

