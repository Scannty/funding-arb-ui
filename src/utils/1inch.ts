import { erc20ABI } from "wagmi";
import {
  prepareWriteContract,
  writeContract,
  prepareSendTransaction,
  sendTransaction,
  waitForTransaction,
  readContract,
} from "wagmi/actions";
import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { ONE_INCH_ROUTER_ADDRESS, API_BASE_URL } from "../constants/config";

export async function swapTokens(
  tokenIn: string,
  tokenOut: string,
  amount: number,
  decimals: number,
  address: string
) {
  try {
    const swapAmount = parseUnits(amount.toString(), decimals);

    const currentAllowance = (await readContract({
      addressOrName: tokenIn,
      contractInterface: erc20ABI,
      functionName: "allowance",
      args: [address, ONE_INCH_ROUTER_ADDRESS],
    })) as BigNumber;

    if (currentAllowance.lt(swapAmount)) {
      const configApprove = await prepareWriteContract({
        addressOrName: tokenIn,
        contractInterface: erc20ABI,
        functionName: "approve",
        args: [ONE_INCH_ROUTER_ADDRESS, swapAmount],
      });

      const txApprove = await writeContract(configApprove);
      const approvalReceipt = await waitForTransaction({
        hash: txApprove.hash,
      });

      if (approvalReceipt.status === 0) {
        throw new Error("Approval transaction failed");
      }
    }

    const params = new URLSearchParams({
      endpoint: "swap",
      fromTokenAddress: tokenIn,
      toTokenAddress: tokenOut,
      amount: swapAmount.toString(),
      fromAddress: address,
      slippage: "0.5",
    });

    const response = await fetch(`${API_BASE_URL}/dex/1inch/quote?${params}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Swap quote failed: ${errorText}`);
    }

    const swapData = await response.json();
    const gasLimit = BigNumber.from(swapData.tx.gas || "0");
    const gasLimitWithBuffer = gasLimit.mul(110).div(100);

    const configSwap = await prepareSendTransaction({
      request: {
        to: swapData.tx.to,
        data: swapData.tx.data,
        value: swapData.tx.value || "0",
        gasLimit: gasLimitWithBuffer,
      },
    });

    const txSwap = await sendTransaction(configSwap);
    const swapReceipt = await waitForTransaction({
      hash: txSwap.hash,
    });

    if (swapReceipt.status === 0) {
      throw new Error("Swap transaction failed");
    }

    return txSwap.hash;
  } catch (error) {
    throw error;
  }
}
