import React, { useState } from "react";
import "./App.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Donate from "./Donate";
import { useSendTransaction } from "wagmi";
import { parseEther } from "viem";

const FAUCET_ADDRESS = "0xe19c88086C8d551C81ff8a3e2c5DF87a88110a51";

const App = () => {
  const [address, setAddress] = useState("");
  const [txInfo, setTxInfo] = useState<{
    hash: string;
    to: string;
    network: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const { address: userAddress, isConnected } = useAccount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTxInfo(null);

    try {
      const res = await fetch("http://localhost:5001/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: address }),
      });
      const data = await res.json();
      setLoading(false);

      if (data.txHash) {
        setTxInfo({
          hash: data.txHash,
          to: address,
          network: "Ethereum Sepolia",
        });
      } else {
        alert(data.message || "Transaction failed");
      }
    } catch (err) {
      setLoading(false);
      alert("Something went wrong.");
      console.error(err);
    }
  };

  return (
    <div className="container">
      <div className="login">
        <ConnectButton />
      </div>

      <h1>Sepolia ETH Faucet</h1>
      <p>Current USD value of 0.1 ETH:</p>

      <form onSubmit={handleSubmit} className="faucet-form">
        <div className="form-group">
          <label htmlFor="ethAddress">Ethereum Address</label>
          <input
            type="text"
            id="ethAddress"
            className="form-control"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your Ethereum address"
            disabled={loading}
          />
        </div>
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Sending..." : "Get Sepolia ETH"}
        </button>
      </form>

      {/* Fancy confirmation card */}
      {txInfo && (
        <div className="confirmation-card">
          <h2>💧 Drip complete</h2>
          <p>Testnet tokens sent! Check your wallet address.</p>
          <div className="confirmation-row">
            <strong>Network:</strong> {txInfo.network}
          </div>
          <div className="confirmation-row">
            <strong>Recipient:</strong> {txInfo.to}
          </div>
          <div className="confirmation-row">
            <strong>Transaction hash:</strong>{" "}
            <a
              href={`https://sepolia.etherscan.io/tx/${txInfo.hash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {txInfo.hash}
            </a>
          </div>
        </div>
      )}

      {/* Only show donate if connected */}
      {isConnected ? (
        <Donate />
      ) : (
        <p style={{ marginTop: "1rem", color: "#888" }}>
          Connect your wallet to give back to the faucet 💧
        </p>
      )}
    </div>
  );
};

export default App;
