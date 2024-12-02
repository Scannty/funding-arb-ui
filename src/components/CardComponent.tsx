import React from "react";
import { useAccount, useSignTypedData } from "wagmi";
import {
  prepareWriteContract,
  writeContract,
  readContract,
} from "wagmi/actions";
import { ethers } from "ethers";

import usdcProxyAbi from "../abi/ERC20Permit.json";
import brdigeAbi from "../abi/Bridge2.json";

const HYPERLIQUID_BRIDGE_ADDRESS = "0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7";
const USDC_PROXY_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

interface CardComponentProps {
  name: string;
  fundingHrly: number;
  fundingYrly: number;
  fundingAvgMonthly: number;
}

export default function CardComponent(props: CardComponentProps) {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const [bridgeActive, setBridgeActive] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  async function handleButtonClick() {
    try {
      setBridgeActive(true);
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const value = ethers.utils.parseUnits("6", 6); // Amount of USDC to permit (10 USDC in this example)

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

      const signature = await signTypedDataAsync({
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
      if (txReceipt.hash !== undefined) {
        setIsError(true);
        setBridgeActive(false);
        setTimeout(() => {
          setIsError(false);
        }, 5000);
      }

      setBridgeActive(false);
    } catch (error) {
      console.log("Error:", error);
      setIsError(true);
      setBridgeActive(false);
      setTimeout(() => {
        setIsError(false);
      }, 5000);
    }
  }

  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg m-4">
      <img
        src={
          "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/1200px-Bitcoin.svg.png"
        }
        alt={props.name}
        className="w-full h-48 object-cover"
      />
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">{props.name}</div>
        <p className="text-gray-700 text-base">Strategy Info</p>
        <div className="mt-4 text-lg">
          <div>
            <strong>Current APY:</strong> {props.fundingYrly}%
          </div>
          <div>
            <strong>Average APY (Past year):</strong> {props.fundingAvgMonthly}%
          </div>
        </div>
        {isError ? (
          <button className="mt-4 bg-red-500 text-white font-bold py-2 px-4 rounded">
            Error While Bridging
          </button>
        ) : (
          <button
            onClick={handleButtonClick}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {bridgeActive ? "Executing Strategy..." : "Execute Strategy"}
          </button>
        )}
      </div>
    </div>
  );
}
