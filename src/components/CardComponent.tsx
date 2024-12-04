import React from "react";
import { useAccount } from "wagmi";

import { shortPerp, bridgeFunds } from "../utils/hyperliquid";

interface CardComponentProps {
  name: string;
  assetIndex: number;
  decimals: number;
  fundingHrly: number;
  fundingYrly: number;
  fundingAvgMonthly: number;
}

export default function CardComponent(props: CardComponentProps) {
  const { address } = useAccount();

  const [bridgeActive, setBridgeActive] = React.useState(false);
  const [executingPerp, setExecutingPerp] = React.useState(false);
  const [transactionValue, setTransactionValue] = React.useState("");
  const [isError, setIsError] = React.useState(false);

  async function handleButtonClick() {
    if (!address) {
      alert("Please connect your wallet");
      return;
    }
    try {
      setBridgeActive(true);
      await bridgeFunds(address, transactionValue);
      setBridgeActive(false);
      setExecutingPerp(true);
      await shortPerp(
        Number(transactionValue),
        props.decimals,
        props.assetIndex
      );
      setExecutingPerp(false);
    } catch (error) {
      console.log("Error:", error);
      setIsError(true);
      setBridgeActive(false);
      setExecutingPerp(false);
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
        <div className="mt-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="transactionValue"
          >
            Transaction Value (USDC):
          </label>
          <input
            type="number"
            id="transactionValue"
            name="transactionValue"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter value in USDC"
            min="10"
            step="1"
            onChange={(e) => setTransactionValue(e.target.value)}
          />
        </div>
        {isError ? (
          <button className="mt-4 bg-red-500 text-white font-bold py-2 px-4 rounded">
            Strategy Error
          </button>
        ) : (
          <button
            onClick={handleButtonClick}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {bridgeActive && "Brdiging Funds..."}
            {executingPerp && "Shorting Perp..."}
            {!bridgeActive && !executingPerp && "Execute Strategy"}
          </button>
        )}
      </div>
    </div>
  );
}
