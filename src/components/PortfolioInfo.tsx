import React from "react";
import { tokens } from "../constants/tokens";
import { USDC_PROXY_ADDRESS, API_BASE_URL } from "../constants/config";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

export default function PortfolioInfo(props: {
  usdcBalance: number;
  hyperliquidBalance: number;
  portfolioValue: number;
  openPositions: any;
  portfolio: any;
}) {
  const { address } = useAccount();
  const [quotes, setQuotes] = React.useState<number[]>([]);
  const [isFetched, setIsFetched] = React.useState(false);

  React.useEffect(() => {
    const fetchQuotes = async () => {
      if (!address || isFetched) return;

      const newQuotes = await Promise.all(
        props.openPositions.map(async (position: any) => {
          const assetTicker = position.position.coin;
          const params = new URLSearchParams({
            endpoint: "quote",
            src: tokens[assetTicker].tokenAddress,
            dst: USDC_PROXY_ADDRESS,
            amount: ethers.utils
              .parseUnits("0.007588", tokens[assetTicker].decimals) // Placeholder value
              .toString(),
          });

          const response = await fetch(
            `${API_BASE_URL}/dex/1inch/quote?${params}`
          );
          if (!response.ok) {
            const errorText = await response.text();
            console.log(errorText);
            return 0;
          }
          const data = await response.json();
          const oneInchQuote = ethers.utils.formatUnits(data.dstAmount, 6);

          console.log(oneInchQuote);
          return Number(oneInchQuote);
        })
      );
      console.log(newQuotes);

      setQuotes(newQuotes);
      setIsFetched(true);
    };

    fetchQuotes();
  }, [props.openPositions, address, isFetched]);

  return (
    <div className="flex flex-col items-center px-4 sm:px-16 bg-[#F5F5F5] relative w-full">
      <h1 className="font-inter font-bold text-4xl my-10 leading-[120%] text-center tracking-[-0.03em] text-[#1E1E1E] mb-8 sm:mb-0">
        Funding Strategy
      </h1>
      <div className="w-full max-w-[1305px] mt-8 px-4 sm:px-0">
        <div>
          <h2 className="font-inter font-semibold text-xl sm:text-2xl leading-[120%] tracking-[-0.02em] text-[#1E1E1E] mb-6 text-center">
            Current Portfolio Statistics
          </h2>
          <div className="flex flex-col sm:flex-row justify-between w-full gap-4 sm:gap-0">
            <div className="text-center">
              <p className="font-inter font-normal text-sm text-[#757575] mb-2">
                Hyperliquid Balance
              </p>
              <p className="font-inter font-semibold text-lg text-[#1E1E1E]">
                ${props.hyperliquidBalance}
              </p>
            </div>
            <div className="text-center">
              <p className="font-inter font-normal text-sm text-[#757575] mb-2">
                USDC Balance
              </p>
              <p className="font-inter font-semibold text-lg text-[#1E1E1E]">
                ${props.usdcBalance}
              </p>
            </div>
            <div className="text-center">
              <p className="font-inter font-normal text-sm text-[#757575] mb-2">
                Perpetuals Balance
              </p>
              <p className="font-inter font-semibold text-lg text-[#1E1E1E]">
                ${props.portfolioValue}
              </p>
            </div>
          </div>
        </div>
        <div>
          <h2>Asset: {props.portfolio.ETH.asset}</h2>
          <h2>Spot Amount: {props.portfolio.ETH.spot_amount}</h2>
          <h2>Perp Amount: {props.portfolio.ETH.perp_size}</h2>
          <h2>Leverage: {props.portfolio.ETH.leverage}x</h2>
        </div>
        <div className="my-8">
          <h2 className="font-inter font-semibold text-xl sm:text-2xl leading-[120%] tracking-[-0.02em] text-[#1E1E1E] mb-6 text-center">
            Positions Opened
          </h2>
          <div className="w-full">
            {props.openPositions.map((position: any, index: number) => {
              const fundingFeeCollected =
                Number(position.position.cumFunding.allTime) * -1;
              const targetQuote = quotes[index];

              const slippageAmount =
                Number(position.position.positionValue) + targetQuote - 60;

              const positionPnL = slippageAmount + fundingFeeCollected;

              return (
                <div
                  key={position.position.coin}
                  className="flex justify-between"
                >
                  <div className="text-center">
                    <p className="font-inter font-normal text-sm text-[#757575] mb-2">
                      Open Positions
                    </p>
                    <p className="font-inter font-semibold text-lg text-[#1E1E1E]">
                      {position.position.coin}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-inter font-normal text-sm text-[#757575] mb-2">
                      Leverage Used
                    </p>
                    <p className="font-inter font-semibold text-lg text-[#1E1E1E]">
                      {position.position.leverage.value}x
                    </p>
                  </div>
                  {/* <div className="text-center">
                  <p className="font-inter font-normal text-sm text-[#757575] mb-2">
                    APY
                  </p>
                  <p className="font-inter font-semibold text-lg text-[#1E1E1E]">
                    {Number(position.position.returnOnEquity * 100).toFixed(2)}%
                  </p>
                </div> */}
                  <div className="text-center">
                    <p className="font-inter font-normal text-sm text-[#757575] mb-2">
                      Funding Fee Collected
                    </p>
                    <p className="font-inter font-semibold text-lg text-[#1E1E1E]">
                      ${fundingFeeCollected.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-inter font-normal text-sm text-[#757575] mb-2">
                      Total Slippage Estimate
                    </p>
                    <p className="font-inter font-semibold text-lg text-[#1E1E1E]">
                      ${slippageAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-inter font-normal text-sm text-[#757575] mb-2">
                      Position PnL
                    </p>
                    <p className="font-inter font-semibold text-lg text-[#1E1E1E]">
                      ${positionPnL.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
