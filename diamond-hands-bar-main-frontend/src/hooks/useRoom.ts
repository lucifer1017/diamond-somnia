import { useState, useCallback } from "react";
import { generateRoomCode } from "@/lib/lobbySchema";
import type { Hex } from "viem";

export const useRoom = () => {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [hostAddress, setHostAddress] = useState<Hex | null>(null);

  const createRoom = useCallback((address: Hex) => {
    const code = generateRoomCode();
    console.log("[useRoom] Creating room:", { code, address });
    setRoomCode(code);
    setIsHost(true); // Explicitly set to true when creating
    setHostAddress(address);
    return code;
  }, []);

  const joinRoom = useCallback((code: string, publisher?: Hex) => {
    const trimmedCode = code.toUpperCase().trim();
    
    // Validate publisher address if provided
    if (publisher) {
      // Double-check it's a valid hex address
      if (!publisher.startsWith("0x") || publisher.length !== 42 || !/^0x[a-fA-F0-9]{40}$/.test(publisher)) {
        console.error("[useRoom] Invalid publisher address format:", publisher);
        throw new Error(`Invalid publisher address: ${publisher}`);
      }
    }
    
    console.log("[useRoom] Joining room:", { code: trimmedCode, publisher, publisherLength: publisher?.length });
    setRoomCode(trimmedCode);
    setIsHost(false); // Explicitly set to false when joining
    if (publisher) {
      setHostAddress(publisher);
      console.log("[useRoom] Set host address:", publisher, "Length:", publisher.length);
    } else {
      console.warn("[useRoom] No publisher address provided when joining room");
    }
  }, []);

  const leaveRoom = useCallback(() => {
    setRoomCode(null);
    setIsHost(false);
    setHostAddress(null);
  }, []);

  return {
    roomCode,
    isHost,
    hostAddress,
    createRoom,
    joinRoom,
    leaveRoom,
  };
};

