import { motion, AnimatePresence } from "framer-motion";
import { useWalletContext } from "@/context/WalletContext";
import { useState } from "react";
import type { Hex } from "viem";

interface RoomManagerProps {
  roomCode: string | null;
  isHost: boolean;
  hostAddress: Hex | null;
  onCreateRoom: (address: Hex) => string;
  onJoinRoom: (code: string, publisher?: Hex) => void;
  onLeaveRoom: () => void;
}

export const RoomManager = ({ 
  roomCode, 
  isHost, 
  hostAddress, 
  onCreateRoom, 
  onJoinRoom, 
  onLeaveRoom 
}: RoomManagerProps) => {
  const { address } = useWalletContext();
  const [joinInput, setJoinInput] = useState("");
  const [publisherInput, setPublisherInput] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleCreate = () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }
    onCreateRoom(address);
  };

  const handleJoin = () => {
    if (!joinInput.trim() || !publisherInput.trim()) {
      alert("Please enter both room code and host wallet address");
      return;
    }
    
    const code = joinInput.toUpperCase().trim();
    const publisherInputTrimmed = publisherInput.trim();
    
    // Validate address format
    if (!publisherInputTrimmed.startsWith("0x") || publisherInputTrimmed.length !== 42) {
      alert("Invalid wallet address format. Must start with 0x and be 42 characters long.");
      return;
    }
    
    // Ensure it's a valid hex address
    if (!/^0x[a-fA-F0-9]{40}$/.test(publisherInputTrimmed)) {
      alert("Invalid wallet address. Must be a valid Ethereum address (0x followed by 40 hex characters).");
      return;
    }
    
    const publisher = publisherInputTrimmed as Hex;
    console.log("[RoomManager] Joining room with validated address:", { code, publisher });
    onJoinRoom(code, publisher);
    setJoinInput("");
    setPublisherInput("");
    setShowJoinInput(false);
  };

  if (roomCode) {
    return (
      <motion.div
        className="fixed top-4 left-4 z-30 rounded-lg border-2 border-gold bg-gradient-to-br from-wood to-wood-dark shadow-wood px-4 py-3"
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex items-center gap-3">
          <div>
            <p className="font-minecraft text-xs text-gold">ROOM</p>
            <p className="font-minecraft text-lg text-foreground">{roomCode}</p>
            {isHost && (
              <>
                <p className="text-[10px] text-muted-foreground">You are hosting</p>
                {hostAddress && (
                  <p className="text-[9px] text-muted-foreground break-all">
                    Host: {hostAddress.slice(0, 6)}...{hostAddress.slice(-4)}
                  </p>
                )}
              </>
            )}
            {!isHost && (
              <>
                <p className="text-[10px] text-muted-foreground">Watching</p>
                {hostAddress && (
                  <p className="text-[9px] text-muted-foreground break-all">
                    Host: {hostAddress.slice(0, 6)}...{hostAddress.slice(-4)}
                  </p>
                )}
              </>
            )}
          </div>
          <button
            onClick={onLeaveRoom}
            className="font-minecraft text-[10px] px-2 py-1 rounded-pixel border border-wood-dark bg-background/50 hover:bg-background/70 transition"
          >
            Leave
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed top-4 left-4 z-30 rounded-lg border-2 border-wood-dark bg-gradient-to-br from-wood to-wood-dark shadow-wood px-4 py-3"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="flex flex-col gap-2">
        <p className="font-minecraft text-xs text-gold mb-1">SHARED LOBBY</p>
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            className="font-minecraft text-[10px] px-3 py-1.5 rounded-pixel border border-gold bg-gold/20 hover:bg-gold/30 transition"
          >
            Create Room
          </button>
          <button
            onClick={() => setShowJoinInput(!showJoinInput)}
            className="font-minecraft text-[10px] px-3 py-1.5 rounded-pixel border border-diamond bg-diamond/20 hover:bg-diamond/30 transition"
          >
            Join Room
          </button>
        </div>
        <AnimatePresence>
          {showJoinInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2 mt-2"
            >
              <input
                type="text"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="DIAMOND-1234"
                className="font-minecraft text-[10px] px-2 py-1 rounded-pixel border border-wood-dark bg-background/50 text-foreground w-full"
                autoFocus
              />
              <input
                type="text"
                value={publisherInput}
                onChange={(e) => setPublisherInput(e.target.value)}
                placeholder="Host wallet address (required)"
                className="font-minecraft text-[10px] px-2 py-1 rounded-pixel border border-wood-dark bg-background/50 text-foreground w-full"
              />
              <button
                onClick={handleJoin}
                className="font-minecraft text-[10px] px-2 py-1 rounded-pixel border border-diamond bg-diamond/20 hover:bg-diamond/30 transition"
              >
                Join
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

