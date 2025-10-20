import { VercelRequest, VercelResponse } from "@vercel/node";
import { ethers } from "ethers";

const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const AMOUNT = "0.01";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  const { to } = req.body;
  if (!to || !ethers.utils.isAddress(to)) {
    return res.status(400).json({ message: "Invalid address" });
  }

  try {
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    if (!PRIVATE_KEY) throw new Error("Missing PRIVATE_KEY env var");

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const tx = await wallet.sendTransaction({
      to,
      value: ethers.utils.parseEther(AMOUNT),
    });

    await tx.wait();

    return res.status(200).json({
      message: `✅ Sent ${AMOUNT} Sepolia ETH to ${to}`,
      txHash: tx.hash,
    });
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Transaction failed", error: err.message });
  }
}
