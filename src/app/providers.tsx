'use client';

import '@rainbow-me/rainbowkit/styles.css';
import {
  connectorsForWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { createConfig, WagmiProvider, http } from 'wagmi';
import {
  metaMaskWallet,
  walletConnectWallet,
  kaiaWallet,
} from '@rainbow-me/rainbowkit/wallets';
import {
  mainnet,

  kaia,

  kairos
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

const projectId = 'YOUR_PROJECT_ID'; // Get from https://cloud.walletconnect.com

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [kaiaWallet, metaMaskWallet, walletConnectWallet],
    },
  ],
  { 
    appName: 'Kaia Commerce', 
    projectId 
  },
);

const config = createConfig({
  connectors,
  chains: [mainnet, kaia, kairos],
  transports: {
    [mainnet.id]: http(),
    [kaia.id]: http(),
    [kairos.id]: http(),

  },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}