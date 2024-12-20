import React from "react";
import { useAccount } from "wagmi";
import { BigNumber, ethers } from "ethers";

import { tokens } from "../constants/tokens";
import { USDC_PROXY_ADDRESS, API_BASE_URL } from "../constants/config";
import { Perp } from "../constants/types";

export default function PortfolioInfo(props: {
  usdcBalance: number;
  hyperliquidBalance: number;
  portfolioValue: number;
  hyperliquidPositions: any;
  openPositions: any;
  validPositions: boolean;
  perpsInfo: Perp[];
  setValidPositions: React.Dispatch<React.SetStateAction<boolean>>;
  tokensBalances: any;
}) {
  const { address } = useAccount();

  const [quotes, setQuotes] = React.useState<number[]>([]);
  const [perpPrices, setPerpPrices] = React.useState<any>({});
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

    const fetchHyperliquidPrices = async () => {
      const assetIndexes = props.perpsInfo.map((perp: Perp) => perp.assetIndex);
      const queryString = `assetIndexes=${assetIndexes.join(",")}`;

      const res = await fetch(
        "http://localhost:8000/getCurrentMidPrice?" + queryString
      );
      const data = await res.json();

      setPerpPrices(data);
    };

    checkManualPositionChanges();
    fetchQuotes();
    fetchHyperliquidPrices();
  }, [props.hyperliquidPositions, address, isFetched]);

  function calculatePnL(
    usdAmountIn: string,
    spotAmount: string,
    perpAmount: string
  ) {
    return Number(spotAmount) + Number(perpAmount) - Number(usdAmountIn);
  }

  if (props.perpsInfo.length != 0 && perpPrices.length != 0) {
    return (
      <div className="bg-[#f2f2f2] p-6">
        <h1 className="text-2xl font-inter font-semibold ml-4 my-4">
          Positions
        </h1>
        <div className="overflow-x-auto ">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b-2 border-gray-200 text-left text-xl font-medium">
                  Asset
                </th>
                <th className="py-2 px-4 border-b-2 border-gray-200 text-left text-xl font-medium">
                  Current Price
                </th>
                <th className="py-2 px-4 border-b-2 border-gray-200 text-left text-xl font-medium">
                  Liquidation Price
                </th>
                <th className="py-2 px-4 border-b-2 border-gray-200 text-left text-xl font-medium">
                  Leverage
                </th>
                <th className="py-2 px-4 border-b-2 border-gray-200 text-left text-xl font-medium">
                  Capital Invested
                </th>
                <th className="py-2 px-4 border-b-2 border-gray-200 text-left text-xl font-medium">
                  Funding Fees Collected
                </th>
                <th className="py-2 px-4 border-b-2 border-gray-200 text-left text-xl font-medium">
                  PnL
                </th>
                <th className="py-2 px-4 border-b-2 border-gray-200 text-left text-xl font-medium">
                  Current APY
                </th>
              </tr>
            </thead>
            <tbody>
              {quotes.length > 0 &&
                Object.values(props.openPositions).map(
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

                    const fundingFeeCollected =
                      hyperliquidPosition.position.cumFunding.sinceOpen * -1;
                    const currentApy =
                      (positionPnL / Number(position.amount)) * 100;
                    const liquidationPrice = Number(
                      hyperliquidPosition.position.liquidationPx
                    );
                    const targetPerpInfo = props.perpsInfo.find(
                      (perp) => perp.name === position.asset
                    );
                    const currentPrice = Number(
                      //@ts-ignore
                      perpPrices[targetPerpInfo?.assetIndex]
                    );

                    return (
                      <tr key={index}>
                        <td className="py-4 px-4 font-inter text-gray-500 font-semibold">
                          {position.asset}
                        </td>
                        <td className="py-4 px-4 font-inter text-gray-500 font-semibold">
                          ${currentPrice.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 font-inter text-gray-500 font-semibold">
                          ${liquidationPrice.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 font-inter text-gray-500 font-semibold">
                          {position.leverage}x
                        </td>
                        <td className="py-4 px-4 font-inter text-gray-500 font-semibold">
                          ${position.amount}
                        </td>
                        <td
                          className={`py-4 px-4 font-inter font-semibold ${
                            fundingFeeCollected < 0
                              ? "text-red-500"
                              : "text-green-500"
                          }`}
                        >
                          {fundingFeeCollected >= 0 ? "+" : "-"}$
                          {Math.abs(fundingFeeCollected).toFixed(2)}
                        </td>
                        <td
                          className={`py-4 px-4 font-inter font-semibold ${
                            positionPnL < 0 ? "text-red-500" : "text-green-500"
                          }`}
                        >
                          {positionPnL >= 0 ? "+" : "-"}$
                          {Math.abs(positionPnL).toFixed(2)}
                        </td>
                        <td
                          className={`py-4 px-4 font-inter font-semibold ${
                            currentApy < 0 ? "text-red-500" : "text-green-500"
                          }`}
                        >
                          {currentApy >= 0 ? "+" : "-"}
                          {Math.abs(currentApy).toFixed(2)}%
                        </td>
                      </tr>
                    );
                  }
                )}
            </tbody>
          </table>
        </div>
      </div>
    );
  } else {
    return <div>Loading...</div>;
  }
}
