import { motion } from "framer-motion";
import { useWalletContext } from "@/context/WalletContext";

const truncateAddress = (address: `0x${string}` | null) => {
  if (!address) return null;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const WalletStatus = () => {
  const { address, connect, disconnect, isConnecting, isOnSomnia, error } = useWalletContext();

  const label = (() => {
    if (isConnecting) return "CONNECTING...";
    if (!address) return "CONNECT WALLET";
    if (!isOnSomnia) return "SWITCH TO SOMNIA";
    return truncateAddress(address);
  })();

  return (
    <motion.div
      className="fixed top-6 right-6 z-20 flex flex-col items-end gap-2"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.button
        className={`button-3d relative px-6 py-3 rounded-pixel font-minecraft text-xs tracking-wide border-2 ${
          address ? "bg-gradient-to-br from-wood-light to-wood text-foreground border-gold" : "bg-gradient-to-br from-diamond to-diamond-glow text-wood-dark border-diamond-glow"
        } ${isConnecting ? "opacity-70 cursor-wait" : "hover:brightness-110"}`}
        onClick={address ? disconnect : connect}
        disabled={isConnecting}
        whileHover={!isConnecting ? { scale: 1.03 } : {}}
        whileTap={!isConnecting ? { scale: 0.96 } : {}}
      >
        <span className="flex items-center gap-2">
          <span className="text-lg">{address ? (isOnSomnia ? "🟢" : "⚠️") : "🪪"}</span>
          {label}
        </span>
      </motion.button>
      {!isOnSomnia && address && (
        <span className="text-xs font-minecraft text-destructive bg-destructive/20 px-3 py-1 rounded-pixel border border-destructive">
          Connect to Somnia Testnet in your wallet
        </span>
      )}
      {error && (
        <span className="text-xs font-minecraft text-destructive bg-destructive/10 px-3 py-1 rounded-pixel border border-destructive">
          {error}
        </span>
      )}
    </motion.div>
  );
};


