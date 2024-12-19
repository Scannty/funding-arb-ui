import React from "react";
import { useAccount } from "wagmi";
import { BigNumber, ethers } from "ethers";

import { tokens } from "../constants/tokens";
import { USDC_PROXY_ADDRESS, API_BASE_URL } from "../constants/config";

export default function PortfolioInfo(props: {
  usdcBalance: number;
  hyperliquidBalance: number;
  portfolioValue: number;
  hyperliquidPositions: any;
  openPositions: any;
  validPositions: boolean;
  setValidPositions: React.Dispatch<React.SetStateAction<boolean>>;
  tokensBalances: any;
}) {
  const { address } = useAccount();

  const [quotes, setQuotes] = React.useState<number[]>([]);
  const [isFetched, setIsFetched] = React.useState(false);

  React.useEffect(() => {
    const checkManualPositionChanges = async () => {
      if (!address) return;

      Object.values(props.openPositions).forEach(async (position: any) => {
        const hyperliquidPosition = props.hyperliquidPositions.find(
          (hlPosition: any) => hlPosition.position.coin === position.asset
        );

        if (!hyperliquidPosition) {
          props.setValidPositions(false);
          return;
        }

        const spotAmountPosition = BigNumber.from(position.spot_amount);
        const spotAmountCurrent = BigNumber.from(
          props.tokensBalances[position.asset]
        );

        if (
          spotAmountPosition.gt(spotAmountCurrent) ||
          "-" + position.perp_size !== hyperliquidPosition.position.szi ||
          position.leverage != hyperliquidPosition.position.leverage.value
        ) {
          props.setValidPositions(false);
          console.log("Invalid position");
          return;
        }
      });
    };

    const fetchQuotes = async () => {
      if (
        !address ||
        isFetched ||
        Object.values(props.openPositions).length === 0
      )
        return;

      const newQuotes = await Promise.all(
        Object.values(props.openPositions).map(async (position: any) => {
          const assetTicker = position.asset;
          const params = new URLSearchParams({
            endpoint: "quote",
            src: tokens[assetTicker].tokenAddress,
            dst: USDC_PROXY_ADDRESS,
            amount: position.spot_amount,
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

      setQuotes(newQuotes);
      setIsFetched(true);
    };

    checkManualPositionChanges();
    fetchQuotes();
  }, [props.hyperliquidPositions, address, isFetched]);

  function calculatePnL(
    usdAmountIn: string,
    spotAmount: string,
    perpAmount: string
  ) {
    return Number(spotAmount) + Number(perpAmount) - Number(usdAmountIn);
  }

  return (
    <div className="flex flex-col items-center px-4 sm:px-16 bg-[#F5F5F5] relative w-full">
      <h1 className="font-inter font-bold text-4xl my-10 leading-[120%] text-center tracking-[-0.03em] text-[#1E1E1E] mb-8 sm:mb-0">
        Funding Strategy
      </h1>
      {props.validPositions ? (
        <h1 className="bg-green-600">Good</h1>
      ) : (
        <h1 className="bg-red-600">Bad</h1>
      )}
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
        {quotes.length && (
          <ul>
            {Object.values(props.openPositions).map(
              (position: any, index: number) => {
                const hyperliquidPosition = props.hyperliquidPositions.find(
                  (hlPosition: any) =>
                    hlPosition.position.coin === position.asset
                );

                const spotAmountOut = quotes[index];

                const positionPnL = calculatePnL(
                  position.amount,
                  spotAmountOut.toString(),
                  hyperliquidPosition.position.marginUsed
                );

                return (
                  <div>
                    <h2>Asset: {position.asset}</h2>
                    <h2>Leverage: {position.leverage}x</h2>
                    <h2>PnL: ${positionPnL.toFixed(2)}</h2>
                  </div>
                );
              }
            )}
          </ul>
        )}
        <div className="my-8">
          <h2 className="font-inter font-semibold text-xl sm:text-2xl leading-[120%] tracking-[-0.02em] text-[#1E1E1E] mb-6 text-center">
            Positions Opened
          </h2>
          <div className="w-full">
            {props.hyperliquidPositions.map((position: any, index: number) => {
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
