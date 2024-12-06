import {
  prepareWriteContract,
  writeContract,
  readContract,
  signTypedData,
} from "wagmi/actions";
import { encode } from "@msgpack/msgpack";
import { ethers } from "ethers";

import usdcProxyAbi from "../abi/ERC20Permit.json";
import brdigeAbi from "../abi/Bridge2.json";

const MAX_DECIMALS = 6;
const MAX_SIGNIFICANT_DIGITS = 5;

const HYPERLIQUID_BRIDGE_ADDRESS = "0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7";
const USDC_PROXY_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

export async function bridgeFunds(address: string, amount: string) {
  try {
    // setBridgeActive(true);
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const value = ethers.utils.parseUnits(amount, 6); // Amount of USDC to permit (10 USDC in this example)

    const domain = {
      name: "USD Coin",
      version: "2",
      chainId: 42161,
      verifyingContract: USDC_PROXY_ADDRESS,
    };

    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };
    const nonce = await readContract({
      addressOrName: USDC_PROXY_ADDRESS,
      chainId: 42161,
      contractInterface: usdcProxyAbi,
      functionName: "nonces",
      args: [address],
    });

    const message = {
      owner: address,
      spender: HYPERLIQUID_BRIDGE_ADDRESS,
      value: value.toString(),
      nonce: nonce?.toString(),
      deadline,
    };

    const signature = await signTypedData({
      domain,
      types,
      value: message,
    });

    const { v, r, s } = ethers.utils.splitSignature(signature);
    const splitSignature = {
      r: ethers.BigNumber.from(r).toString(),
      s: ethers.BigNumber.from(s).toString(),
      v: v,
    };

    const config = await prepareWriteContract({
      addressOrName: HYPERLIQUID_BRIDGE_ADDRESS,
      contractInterface: brdigeAbi,
      functionName: "batchedDepositWithPermit",
      args: [
        [
          {
            user: address,
            usd: value.toString(),
            deadline,
            signature: splitSignature,
          },
        ],
      ],
    });

    const txReceipt = await writeContract(config);
    console.log("Receipt:", txReceipt);
    if (txReceipt.hash === undefined) {
      throw new Error("Transaction failed");
    }
  } catch (error) {
    console.log(error);
    throw new Error("Error while bridging funds");
  }
}

export async function shortPerp(
  amount: number,
  perpDecimals: number,
  assetIndex: number
) {
  // Getting the mid price of the perp
  console.log("Getting current mid price of the perp...");
  const response = await fetch(
    "http://localhost:8000/getCurrentMidPrice?assetIndex=" + assetIndex
  );
  const { midPrice } = await response.json();
  console.log(`Current mid price of the perp: ${midPrice}`);

  // Calculating the size of the position
  const size = amount / midPrice;

  // Calculating the execution price of the position
  const slippage = midPrice * 0.00008; // 0.008% slippage, should adjust dynamically
  const executionPrice = midPrice - slippage;
  const formattedExecutionPrice = _formatPrice(executionPrice, perpDecimals);

  console.log("Execution Price: ", formattedExecutionPrice);
  console.log("Trade Value: ", size * executionPrice);

  const action = {
    type: "order",
    orders: [
      {
        a: assetIndex,
        b: false,
        p: formattedExecutionPrice,
        s: size.toFixed(perpDecimals).toString(),
        r: false,
        t: {
          limit: {
            tif: "Gtc",
          },
        },
      },
    ],
    grouping: "na",
  };

  const nonce = Date.now();

  try {
    console.log("Signing message...");
    const signature = await _signL1Action(action, nonce, true);
    const { v, r, s } = ethers.utils.splitSignature(signature);
    const splitSignature = {
      r: r,
      s: s,
      v: v,
    };
    console.log("Message signed!");
    console.log("Split signature: ", splitSignature);

    console.log("Sending order to Hyperliquid...");
    const res = await fetch("https://api.hyperliquid.xyz/exchange", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: action,
        nonce: nonce,
        signature: splitSignature,
      }),
    });

    const data = await res.json();
    console.log("Order executed");
    console.log(data);
  } catch (error) {
    console.log("Error executing order: ", error);
  }
}

async function _signL1Action(action: any, nonce: number, isMainnet: boolean) {
  const hash = _actionHash(action, nonce);
  const phantomAgent = _constructPhantomAgent(hash, isMainnet);
  const domain = {
    chainId: 1337,
    name: "Exchange",
    verifyingContract: "0x0000000000000000000000000000000000000000",
    version: "1",
  };
  const types = {
    Agent: [
      { name: "source", type: "string" },
      { name: "connectionId", type: "bytes32" },
    ],
  };
  const message = phantomAgent;

  try {
    if (!process.env.REACT_APP_PRIVATE_KEY) {
      throw new Error("Private key not found");
    }
    const wallet = new ethers.Wallet(process.env.REACT_APP_PRIVATE_KEY);

    const signature = await wallet._signTypedData(domain, types, message);
    return signature;
  } catch (error) {
    console.log(error);
    return "";
  }
}

function _actionHash(action: any, nonce: number): string {
  const vaultAddress = null;
  const msgPackBytes = encode(action);
  const additionalBytesLength = vaultAddress === null ? 9 : 29;
  const data = new Uint8Array(msgPackBytes.length + additionalBytesLength);
  data.set(msgPackBytes);
  const view = new DataView(data.buffer);
  view.setBigUint64(msgPackBytes.length, BigInt(nonce), false);
  if (vaultAddress === null) {
    view.setUint8(msgPackBytes.length + 8, 0);
  } else {
    view.setUint8(msgPackBytes.length + 8, 1);
    data.set(ethers.utils.toUtf8Bytes(vaultAddress), msgPackBytes.length + 9);
  }
  return ethers.utils.keccak256(data);
}

function _constructPhantomAgent(hash: string, isMainnet: boolean) {
  return { source: isMainnet ? "a" : "b", connectionId: hash };
}

function _formatPrice(price: number, szDecimals: number) {
  const maxDecimalPlaces = MAX_DECIMALS - szDecimals;
  const [integerPart, decimalPart] = price.toString().split(".");

  if (!decimalPart || Number(decimalPart) === 0) {
    return price;
  }

  const formattedDecimalPart = decimalPart.slice(0, maxDecimalPlaces);
  const formattedPrice = Number(`${integerPart}.${formattedDecimalPart}`);

  // Remove leading zeros from integer part
  const significantIntegerPart = integerPart.replace(/^0+/, "");

  // Remove trailing zeros from decimal part
  const significantDecimalPart = formattedDecimalPart.replace(/0+$/, "");

  const numberOfSignificantDigits =
    significantIntegerPart.length + significantDecimalPart.length;

  if (numberOfSignificantDigits > MAX_SIGNIFICANT_DIGITS) {
    const decimalPartLength = formattedDecimalPart.length;

    let roundingFactor =
      decimalPartLength - (numberOfSignificantDigits - MAX_SIGNIFICANT_DIGITS);

    if (roundingFactor < 0) {
      roundingFactor = 0;
    }

    return formattedPrice.toFixed(roundingFactor);
  } else {
    return formattedPrice;
  }
}
