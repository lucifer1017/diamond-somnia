import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRoomState, type WatchedGameState } from "@/lib/somnia";
import { useWalletContext } from "@/context/WalletContext";

export const useWatchRoom = (roomCode: string | null, publisher: `0x${string}` | null) => {
  const [lastState, setLastState] = useState<WatchedGameState | null>(null);

  const isEnabled = Boolean(roomCode && publisher);
  console.log("[WatchRoom] Hook called:", { roomCode, publisher, isEnabled });

  const { data: roomState, refetch } = useQuery<WatchedGameState | null>({
    queryKey: ["room-state", roomCode, publisher],
    queryFn: async () => {
      if (!roomCode || !publisher) {
        console.log("[WatchRoom] Missing roomCode or publisher:", { roomCode, publisher });
        return null;
      }
      console.log("[WatchRoom] Fetching room state for:", { roomCode, publisher });
      const state = await fetchRoomState(roomCode, publisher);
      console.log("[WatchRoom] Fetched state:", state);
      return state;
    },
    enabled: isEnabled,
    staleTime: 2_000, // Consider stale after 2 seconds
    refetchInterval: isEnabled ? 3_000 : false, // Poll every 3 seconds only if enabled
  });

  useEffect(() => {
    if (roomState) {
      setLastState(roomState);
    }
  }, [roomState]);

  return {
    roomState: lastState,
    isWatching: Boolean(roomCode && publisher),
    refetch,
  };
};

