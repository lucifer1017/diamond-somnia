import { useCallback, useEffect, useMemo, useState } from "react";
import { somniaTestnet } from "viem/chains";
import type { WalletClient } from "viem";
import { createWalletClientFromProvider, SOMNIA_CHAIN_PARAMS } from "@/lib/somnia";

interface WalletState {
  address: `0x${string}` | null;
  chainId: number | null;
  walletClient: WalletClient | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isOnSomnia: boolean;
}

const formatAddress = (account?: string | null): `0x${string}` | null => {
  if (!account) return null;
  return account as `0x${string}`;
};

export const useWallet = (): WalletState => {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOnSomnia = useMemo(() => chainId === somniaTestnet.id, [chainId]);

  const ensureNetwork = useCallback(async () => {
    if (!window.ethereum) throw new Error("Wallet provider not found");

    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [SOMNIA_CHAIN_PARAMS],
    });
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("Somnia-compatible wallet not detected");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await ensureNetwork();
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const account = formatAddress(accounts[0]);
      const wallet = await createWalletClientFromProvider(account ?? undefined);
      const id = await wallet.getChainId();

      setChainId(id);
      setWalletClient(wallet);
      setAddress(account);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, [ensureNetwork]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setWalletClient(null);
    setChainId(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      setAddress(formatAddress(accounts[0]));
    };

    const handleChainChanged = (hexId: string) => {
      setChainId(parseInt(hexId, 16));
    };

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  return {
    address,
    chainId,
    walletClient,
    isConnecting,
    error,
    connect,
    disconnect,
    isOnSomnia,
  };
};

