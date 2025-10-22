import { VercelRequest, VercelResponse } from "@vercel/node";
import { ethers } from "ethers";

const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const AMOUNT = "0.01";
const FAUCET_ADDRESS = "0xe19c88086C8d551C81ff8a3e2c5DF87a88110a51";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ message: "Only POST allowed" });

  const { to } = req.body;
  if (!to || !ethers.utils.isAddress(to)) {
    return res.status(400).json({ message: "Invalid Ethereum address" });
  }

  try {
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

    if (!PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY env var");
    if (!ETHERSCAN_API_KEY)
      throw new Error("Missing ETHERSCAN_API_KEY env var");

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // ✅ 1. Check faucet balance
    const balance = await wallet.getBalance();
    if (balance.lt(ethers.utils.parseEther(AMOUNT))) {
      return res
        .status(400)
        .json({ message: "Faucet is empty. Please try again later." });
    }

    // ✅ 2. Check recent claims from faucet (Etherscan V2)
    let txData: any = { status: "0", result: [] };
    try {
      const txRes = await fetch(
        `https://api.etherscan.io/v2/api?chainid=11155111&module=account&action=txlist&address=${FAUCET_ADDRESS}&sort=desc&apikey=${ETHERSCAN_API_KEY}`
      );
      txData = await txRes.json();
    } catch (err) {
      console.warn("Failed to fetch Etherscan txs, skipping 24h check", err);
    }

    if (txData.status === "1" && Array.isArray(txData.result)) {
      const now = Math.floor(Date.now() / 1000);
      const recentClaim = txData.result.find((tx: any) => {
        const isFromFaucet =
          tx.from?.toLowerCase() === FAUCET_ADDRESS.toLowerCase();
        const isToUser = tx.to?.toLowerCase() === to.toLowerCase();
        const isRecent = now - Number(tx.timeStamp) < 86400; // 24h
        return isFromFaucet && isToUser && isRecent;
      });

      if (recentClaim) {
        return res.status(429).json({
          message:
            "You’ve already claimed from the faucet in the past 24 hours. Please try again later.",
        });
      }
    }

    // ✅ 3. Send transaction (return immediately, don’t wait)
    const tx = await wallet.sendTransaction({
      to,
      value: ethers.utils.parseEther(AMOUNT),
    });

    return res.status(200).json({
      message: `✅ Transaction sent! Sepolia ETH is on the way to ${to}`,
      txHash: tx.hash,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Transaction failed",
      error: err.message,
    });
  }
}
