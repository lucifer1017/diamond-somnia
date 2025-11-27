import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { WalletClient } from "viem";
import { useWallet } from "@/hooks/useWallet";

interface WalletContextValue {
  address: `0x${string}` | null;
  chainId: number | null;
  walletClient: WalletClient | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isOnSomnia: boolean;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const wallet = useWallet();
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
};


