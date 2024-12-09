import React from "react";
import { useAccount, useSigner } from "wagmi";
import { Slider } from "@mui/material";

import {
  shortPerp,
  bridgeFunds,
  updateLeverage,
  approveAgentWallet,
  generateRandomAgent,
} from "../utils/hyperliquid";
import { swapTokens } from "../utils/univ3";

const WBTC_ADDRESS_ARBITRUM = "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f";
const USDC_ADDRESS_ARBITRUM = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

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

      setExecutingLeverage(true);
      await updateLeverage(leverageRatio, props.assetIndex, agentWallet);
      setExecutingLeverage(false);

      setExecutingPerp(true);
      await shortPerp(
        Number(transactionValue),
        props.decimals,
        props.assetIndex,
        agentWallet
      );
      setExecutingPerp(false);

      setExecutingSwap(true);
      await swapTokens(
        USDC_ADDRESS_ARBITRUM,
        WBTC_ADDRESS_ARBITRUM,
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

  function calculateEffectiveAPY(leverageRatio: number, fundingRate: number) {
    const effectiveAPY = (fundingRate * leverageRatio) / (1 + leverageRatio);
    return effectiveAPY.toFixed(2);
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
            {executingPerp && "Shorting Perp..."}
            {executingSwap && "Swapping Tokens..."}
            {executingLeverage && "Updating Leverage..."}
            {!bridgeActive &&
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
