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
  const [message, setMessage] = useState("");

  // 🔌 use wagmi to check connection
  const { address: userAddress, isConnected } = useAccount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Sending...");

    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: address }),
      });
      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      setMessage("Something went wrong.");
    }
  };

  const { sendTransaction } = useSendTransaction();
  const handleGiveBack = async () => {
    sendTransaction({
      to: FAUCET_ADDRESS,
      value: parseEther("0.1"),
    });
  };

  return (
    <>
      <div className="login">
        <ConnectButton />
      </div>

      <div className="container">
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
            />
          </div>
          <button type="submit" className="submit-btn">
            Get Sepolia ETH
          </button>
        </form>

        {message && <div className="message">{message}</div>}

        {/* 🧠 Only show donate button if connected */}
        {isConnected ? (
          <Donate />
        ) : (
          <p style={{ marginTop: "1rem", color: "#888" }}>
            Connect your wallet to give back to the faucet 💧
          </p>
        )}
      </div>
    </>
  );
};

export default App;
