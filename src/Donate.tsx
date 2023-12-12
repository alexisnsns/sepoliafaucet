import React, { useState } from "react";
import { useSendTransaction, useAccount } from "wagmi";
import { ethers } from "ethers";

const Donate = () => {
  const [amount, setAmount] = useState("");
  const { isConnected } = useAccount();
  const amountInWei = ethers.utils.parseEther(amount || "0");

  const amountInWeiBigInt = BigInt(amountInWei.toString());

  const { sendTransaction } = useSendTransaction({
    to: "0x588eBB657Ca52d6fbDf8F52C760D53C1474e37Ed",
    value: amountInWeiBigInt,
    onSettled(data, error) {
      if (error) {
        console.error("Transaction Error:", error);
      } else {
        console.log("Transaction Success:", data);
      }
    },
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      await sendTransaction();
      alert("Transaction sent!");
    } catch (error) {
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
          />
        </label>
        <button className="submit-btn" type="submit">
          Donate
        </button>
      </form>
    </div>
  );
};

export default Donate;
