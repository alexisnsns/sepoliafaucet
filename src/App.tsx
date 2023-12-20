import React, { useState } from "react";
import "./App.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { EthValue } from "russianrouleth";

import Donate from "./Donate";

const App = () => {
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <div className="login">
        <ConnectButton />
      </div>
      <div className="container">
        <h1>Sepolia ETH Faucet</h1>
        <p>
          {" "}
          Current USD value of 0.1 eth:
          <EthValue />{" "}
        </p>
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
        {/* <button type="submit" className="submit-btn">
        Give Back to the Faucet
      </button> */}
        <Donate />
      </div>
    </>
  );
};

export default App;

// CONTRACT
// one function to receive sepolia eth, returns confirmation message
// read function: you received xx total sepolia eth
// read function: too bad! you've already had your share, can only get every 24h
// read function: the faucet
