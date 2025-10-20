import React, { useState, useEffect } from "react";
import { useSendTransaction, useAccount } from "wagmi";
import { ethers } from "ethers";

const FAUCET_ADDRESS = "0xe19c88086C8d551C81ff8a3e2c5DF87a88110a51";

const Donate = () => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { isConnected, address: userAddress } = useAccount();

  // Fetch ETH balance and set default value
  useEffect(() => {
    if (!isConnected || !userAddress || !window.ethereum) return;

    const fetchBalance = async () => {
      if (!window.ethereum) {
        alert("MetaMask not found homie 😕");
        return;
      }

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const balance = await provider.getBalance(userAddress);
        const balanceEth = parseFloat(ethers.utils.formatEther(balance));
        const defaultAmount = Math.max(balanceEth - 0.05, 0).toFixed(4); // leave 0.05 ETH
        setAmount(defaultAmount);
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    };

    fetchBalance();
  }, [isConnected, userAddress]);

  // Normalize input
  const normalizedAmount = amount.replace(",", ".").trim();

  let amountInWeiBigInt: bigint | undefined;
  try {
    const amountInWei = ethers.utils.parseEther(normalizedAmount || "0");
    amountInWeiBigInt = BigInt(amountInWei.toString());
  } catch {
    amountInWeiBigInt = undefined;
  }

  const { sendTransaction } = useSendTransaction({
    to: FAUCET_ADDRESS,
    value: amountInWeiBigInt,
    onSettled(data, error) {
      setLoading(false);
      if (error) {
        console.error("Transaction Error:", error);
        alert("Transaction failed.");
      } else {
        console.log("Transaction Success:", data);
        alert("Transaction sent!");
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    if (!normalizedAmount || isNaN(Number(normalizedAmount))) {
      alert("Please enter a valid number.");
      return;
    }

    setLoading(true);

    try {
      await sendTransaction?.();
    } catch (error) {
      setLoading(false);
      console.error("Transaction Error:", error);
      alert("Transaction failed.");
    }
  };

  return (
    <div>
      <h2>Donate to the Faucet</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Amount (in ETH):
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
            disabled={loading}
          />
        </label>
        <button className="submit-btn" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Donate"}
        </button>
      </form>
    </div>
  );
};

export default Donate;
