import { erc20ABI } from "wagmi";
import { prepareWriteContract, writeContract } from "wagmi/actions";

import uniV3RouterAbi from "../abi/UniRouterV3.json";

const UNISWAP_V3_ROUTER_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";

export async function swapTokens(
  tokenIn: string,
  tokenOut: string,
  amount: number,
  decimals: number,
  address: string
) {
  try {
    // Approve router to spend USDC
    console.log("Approving the Uniswap V3 Router for swap...");
    const configApprove = await prepareWriteContract({
      addressOrName: tokenIn,
      contractInterface: erc20ABI,
      functionName: "approve",
      args: [UNISWAP_V3_ROUTER_ADDRESS, amount * 10 ** decimals],
    });

    const txReceiptApprove = await writeContract(configApprove);
    console.log("Receipt:", txReceiptApprove);
    if (txReceiptApprove.hash === undefined) {
      throw new Error("Transaction failed");
    }

    console.log("Approved!");
    console.log("Swapping USDC for token...");

    const swapParams = {
      tokenIn,
      tokenOut,
      fee: 3000,
      recipient: address,
      deadline: Date.now() + 1000 * 60 * 10,
      amountIn: amount * 10 ** decimals,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    };

    const config = await prepareWriteContract({
      addressOrName: UNISWAP_V3_ROUTER_ADDRESS,
      contractInterface: uniV3RouterAbi,
      functionName: "exactInputSingle",
      args: [swapParams],
    });

    const txReceipt = await writeContract(config);
    console.log("Swapped!");
    console.log("Receipt:", txReceipt);
    if (txReceipt.hash === undefined) {
      throw new Error("Transaction failed");
    }
  } catch (error) {
    console.log(error);
  }
}
