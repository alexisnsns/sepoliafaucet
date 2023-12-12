import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import "@rainbow-me/rainbowkit/styles.css";

// ToDo: add MainNet for prod
const { chains, publicClient } = configureChains(
  [
    {
      ...sepolia,
      rpcUrls: {
        ...sepolia.rpcUrls,
        default: {
          http: ["https://gateway.tenderly.co/public/sepolia"],
        },
        public: {
          http: ["https://gateway.tenderly.co/public/sepolia"],
        },
      },
    },
  ],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "Your App Name",
  projectId: "YOUR_PROJECT_ID",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <App />
      </RainbowKitProvider>
    </WagmiConfig>
  </React.StrictMode>
);
