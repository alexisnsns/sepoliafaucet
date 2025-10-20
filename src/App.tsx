import React, { useState } from "react";
import "./App.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Donate from "./Donate";

const App = () => {
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Sending...");

    try {
      const res = await fetch("/api/faucet", {
      // const res = await fetch("http://localhost:3000/api/faucet", {
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

  return (
    <>
      <div className="login">
        <ConnectButton />
      </div>
      <div className="container">
        <h1>Sepolia ETH Faucet</h1>
        <p> Current USD value of 0.1 eth:</p>
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
        <button type="submit" className="submit-btn">
          Give Back to the Faucet
        </button>
        <Donate />
      </div>
    </>
  );
};

export default App;
