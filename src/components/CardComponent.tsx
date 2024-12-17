import React from "react";
import { useAccount, useSigner } from "wagmi";
import { TokenIcon } from "@web3icons/react";
import { DiscreteSlider } from "./DiscreteSlider";

import {
  openOrder,
  bridgeFunds,
  setReferrer,
  updateLeverage,
  approveAgentWallet,
  generateRandomAgent,
} from "../utils/hyperliquid";
import { swapTokens } from "../utils/1inch";
import {
  USDC_PROXY_ADDRESS,
  HYPERLIQUID_REFERRAL_CODE,
} from "../constants/config";
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
  const [updatingReferrer, setUpdatingReferrer] = React.useState(false);
  const [executingPerp, setExecutingPerp] = React.useState(false);
  const [executingSwap, setExecutingSwap] = React.useState(false);
  const [executingLeverage, setExecutingLeverage] = React.useState(false);

  const [transactionValue, setTransactionValue] = React.useState("");
  const [leverageRatio, setLeverageRatio] = React.useState(1);

  const [isError, setIsError] = React.useState(false);

  async function handleButtonClick() {
    if (!address || !signer) {
      alert("Please connect your wallet");
      return;
    }
    try {
      // setBridgeActive(true);
      // await bridgeFunds(address, transactionValue);
      // setBridgeActive(false);

      setApprovingAgent(true);
      const agentWallet = generateRandomAgent();
      await approveAgentWallet(agentWallet.address);
      setApprovingAgent(false);

      // setUpdatingReferrer(true);
      // await setReferrer(agentWallet, HYPERLIQUID_REFERRAL_CODE);
      // setUpdatingReferrer(false);

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
      if (props.name === "HYPE" || props.name === "PURR") {
        await openOrder(
          Number(transactionValue),
          props.perpDecimals,
          "buy",
          0.001,
          props.assetIndex,
          agentWallet
        );
      } else {
        await swapTokens(
          USDC_PROXY_ADDRESS,
          tokens[props.name].tokenAddress,
          Number(transactionValue) * leverageRatio,
          6,
          address
        );
      }
      setExecutingSwap(false);
    } catch (error) {
      console.log("Error:", error);
      setIsError(true);
      setBridgeActive(false);
      setUpdatingReferrer(false);
      setApprovingAgent(false);
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
    <div className="box-border flex flex-col items-start p-4 w-full sm:w-[397.67px] min-w-[320px] max-w-[400px] h-auto sm:h-[650px] bg-white border border-[#757575] gap-4">
      {/* Product Image */}
      <div className="flex justify-center items-center w-full sm:w-[365.67px] h-[200px]">
        {tokens[props.name] && (
          <TokenIcon
            symbol={tokens[props.name].iconSymbol}
            variant="branded"
            size={96}
          />
        )}
        <TokenIcon symbol="usdc" variant="branded" size={96} />
      </div>

      {/* Column section */}
      <div className="flex flex-col justify-center items-start p-0 w-full sm:w-[365.67px] gap-6 order-1 self-stretch">
        {/* Body section */}
        <div className="flex flex-col items-start p-0 w-full gap-4 order-0 self-stretch">
          {/* Product Info */}
          <div className="relative w-full sm:w-[368px] order-0">
            <h2 className="font-inter font-semibold text-2xl leading-[120%] tracking-[-0.02em] text-[#1E1E1E]">
              {props.name}
            </h2>
            <p className="font-inter font-normal text-base leading-[140%] text-[#757575] mb-[25px]">
              Strategy Info
            </p>
          </div>

          {/* Price section with APY */}
          <div className="flex flex-row items-center p-0 w-full gap-2 order-1 self-stretch">
            <div className="flex flex-row items-center gap-2">
              <span className="font-inter font-bold text-2xl leading-[100%] tracking-[-0.02em] text-[#1E1E1E] w-auto sm:w-[85px]">
                {calculateEffectiveAPY(leverageRatio, props.fundingYrly)}%
              </span>

              {/* APY Tag */}
              <div className="flex flex-row justify-center items-center p-2 w-12 h-8 bg-[#CFF7D3] rounded-lg ml-4">
                <span className="w-8 h-4 font-inter font-normal text-base leading-[100%] text-[#02542D]">
                  APY
                </span>
              </div>
            </div>
          </div>

          {/* Info rows */}
          <div className="flex flex-row items-start p-0 gap-4 w-full order-2 self-stretch">
            <span className="font-inter font-bold text-base leading-[140%] text-[#757575] flex-grow">
              Average APY (Past year):
            </span>
            <span className="font-inter font-bold text-base leading-[140%] text-[#757575]">
              {calculateEffectiveAPY(leverageRatio, props.fundingAvgMonthly)}%
            </span>
          </div>

          {/* Slider section */}
          <div className="flex flex-col w-full gap-2 order-1 self-stretch">
            <div className="flex flex-row items-center justify-between w-full">
              <strong className="font-inter font-bold text-base leading-[140%] text-[#757575]">
                Adjust your leverage ratio:
              </strong>
              <span className="font-inter font-bold text-base leading-[140%] text-[#757575]">
                {leverageRatio}x
              </span>
            </div>
            <div className="w-full">
              <DiscreteSlider
                aria-label="Leverage"
                value={leverageRatio}
                onChange={(_, value) => setLeverageRatio(value)}
                min={1}
                max={5}
              />
            </div>
          </div>

          {/* Input section */}
          <div className="flex flex-col items-start p-0 gap-2 w-full order-3 self-stretch">
            <label className="w-full font-inter font-normal text-base leading-[140%] text-[#1E1E1E]">
              Transaction Value (USDC):
            </label>
            <input
              type="number"
              className="flex flex-row items-center px-4 py-3 w-full h-10 bg-white border border-[#D9D9D9] rounded-lg"
              placeholder="Enter value in USDC"
              min="10"
              step="1"
              onChange={(e) => setTransactionValue(e.target.value)}
            />
          </div>

          {/* Button */}
          <button
            onClick={handleButtonClick}
            disabled={isError}
            className={`box-border flex flex-row justify-center items-center p-3 gap-2 w-full
              ${
                isError
                  ? "bg-red-500 border-red-500"
                  : "bg-[#313131] border-[#313131] hover:bg-black hover:border-[#1E1E1E]"
              }
              border rounded-lg order-4 self-stretch`}
          >
            <span className="font-inter font-normal text-base leading-[100%] text-[#F5F5F5]">
              {isError
                ? "Strategy Error"
                : bridgeActive
                ? "Bridging Funds..."
                : updatingReferrer
                ? "Setting Referrer..."
                : approvingAgent
                ? "Approving Agent Wallet..."
                : executingPerp
                ? "Shorting Perp..."
                : executingSwap
                ? "Swapping Tokens..."
                : executingLeverage
                ? "Updating Leverage..."
                : "Execute Strategy"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
