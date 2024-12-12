import React from "react";
import { useAccount, useSigner } from "wagmi";
import { Slider } from "@mui/material";
import { TokenIcon } from "@web3icons/react";

import {
  openOrder,
  bridgeFunds,
  updateLeverage,
  approveAgentWallet,
  generateRandomAgent,
} from "../utils/hyperliquid";
import { swapTokens } from "../utils/univ3";
import { USDC_PROXY_ADDRESS } from "../constants/config";
import { tokens } from "../constants/tokens";

interface CardComponentProps {
  name: string;
  assetIndex: number;
  perpDecimals: number;
  fundingHrly: number;
  fundingYrly: number;
  fundingAvgMonthly: number;
}

export default function CardComponent(props: CardComponentProps) {
  const { address } = useAccount();
  const { data: signer } = useSigner();

  const [bridgeActive, setBridgeActive] = React.useState(false);
  const [approvingAgent, setApprovingAgent] = React.useState(false);
  const [executingPerp, setExecutingPerp] = React.useState(false);
  const [executingSwap, setExecutingSwap] = React.useState(false);
  const [executingLeverage, setExecutingLeverage] = React.useState(false);

  const [transactionValue, setTransactionValue] = React.useState("");
  const [leverageRatio, setLeverageRatio] = React.useState(1);

  const [isError, setIsError] = React.useState(false);

  function handleSliderChange(event: Event, newValue: number | number[]) {
    if (typeof newValue === "number") {
      setLeverageRatio(newValue);
    }
  }

  async function handleButtonClick() {
    if (!address || !signer) {
      alert("Please connect your wallet");
      return;
    }
    try {
      setBridgeActive(true);
      await bridgeFunds(address, transactionValue);
      setBridgeActive(false);

      setApprovingAgent(true);
      const agentWallet = generateRandomAgent();
      await approveAgentWallet(agentWallet.address);
      setApprovingAgent(false);

      setExecutingLeverage(true);
      await updateLeverage(leverageRatio, props.assetIndex, agentWallet);
      setExecutingLeverage(false);

      setExecutingPerp(true);
      await openOrder(
        Number(transactionValue),
        props.perpDecimals,
        "sell",
        0.001,
        props.assetIndex,
        agentWallet
      );
      setExecutingPerp(false);

      setExecutingSwap(true);
      await swapTokens(
        USDC_PROXY_ADDRESS,
        tokens[props.name].tokenAddress,
        Number(transactionValue),
        6,
        address
      );
      setExecutingSwap(false);
    } catch (error) {
      console.log("Error:", error);
      setIsError(true);
      setBridgeActive(false);
      setExecutingPerp(false);
      setExecutingSwap(false);
      setTimeout(() => {
        setIsError(false);
      }, 5000);
    }
  }

  // async function storeTradeData(
  //   userAddress: string,
  //   perpExecutionPrice: number,
  //   spotExecutionPrice: number
  // ): Promise<void> {
  //   // Store trade data
  //   const res = await fetch("http://localhost:8000/storeTradeData", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       userAddress,
  //       tradeInfo: {
  //         perpExecutionPrice,
  //         spotExecutionPrice,
  //         transactionValue,
  //       },
  //     }),
  //   });

  //   const data = await res.json();
  //   console.log(data);
  // }

  function calculateEffectiveAPY(leverageRatio: number, fundingRate: number) {
    const effectiveAPY = (fundingRate * leverageRatio) / (1 + leverageRatio);
    return effectiveAPY.toFixed(2);
  }

  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg m-4 bg-slate-100">
      <div className="flex justify-center mt-6">
        {tokens[props.name] && (
          <TokenIcon
            symbol={tokens[props.name].iconSymbol}
            variant="branded"
            size={96}
          />
        )}
        <TokenIcon symbol="usdc" variant="branded" size={96} />
      </div>

      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">{props.name}</div>
        <p className="text-gray-700 text-base">Strategy Info</p>
        <div className="mt-4 text-lg">
          <div>
            <strong>Current APY:</strong>{" "}
            {calculateEffectiveAPY(leverageRatio, props.fundingYrly)}%
          </div>
          <div>
            <strong>Average APY (Past year):</strong>{" "}
            {calculateEffectiveAPY(leverageRatio, props.fundingAvgMonthly)}%
          </div>
          <div>
            <strong>Adjust your leverage ratio:</strong>
          </div>
          <Slider
            aria-label="Leverage"
            getAriaValueText={() => "Leverage Slider"}
            valueLabelDisplay="auto"
            shiftStep={1}
            step={1}
            value={leverageRatio}
            onChange={handleSliderChange}
            marks
            min={1}
            max={5}
          />
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
            {approvingAgent && "Approving Agent Wallet..."}
            {executingPerp && "Shorting Perp..."}
            {executingSwap && "Swapping Tokens..."}
            {executingLeverage && "Updating Leverage..."}
            {!bridgeActive &&
              !approvingAgent &&
              !executingPerp &&
              !executingSwap &&
              !executingLeverage &&
              "Execute Strategy"}
          </button>
        )}
      </div>
    </div>
  );
}
