import React from "react";
import { useAccount, useBalance } from "wagmi";

import Header from "./components/Header";
import Footer from "./components/Footer";
import CardComponent from "./components/CardComponent";
import LoadingSpinner from "./components/LoadingSpinner";
import { tokens } from "./constants/tokens";
// import PortfolioInfo from "./components/PortfolioInfo";
import { getAccountSummary } from "./utils/hyperliquid";
import { USDC_PROXY_ADDRESS } from "./constants/config";

function App() {
  interface Perp {
    name: string;
    assetIndex: number;
    decimals: number;
    fundingHrly: number;
    fundingYrly: number;
    fundingAvgMonthly: number;
  }

  const [usdcBalance, setUsdcBalance] = React.useState(0);
  const [perpsInfo, setPerpsInfo] = React.useState<Perp[]>([]);
  const [loading, setIsLoading] = React.useState(true);
  const [hyperliquidBalance, setHyperLiquidBalance] = React.useState(0);
  const [portfolioValue, setPortfolioValue] = React.useState(0);
  const [openPositions, setOpenPositions] = React.useState<any>([]);

  const { address } = useAccount();
  const { data } = useBalance({
    addressOrName: address,
    token: USDC_PROXY_ADDRESS,
  });

  React.useEffect(() => {
    // Set USDC balance
    if (data) {
      setUsdcBalance(Number((data.value.toNumber() / 10 ** 6).toFixed(2)));
    }

    const perps = Object.keys(tokens);
    perps.push("HYPE", "PURR");
    const queryString = `perps=${perps.join(",")}`;
    const fetchPerpData = async () => {
      const res = await fetch(
        "http://localhost:8000/getPerpsInfo?" + queryString
      );
      const data = await res.json();
      setPerpsInfo(data);
      setIsLoading(false);
    };
    const fetchUserBalance = async () => {
      if (!address) return;
      const accountSummary = await getAccountSummary(address);
      setHyperLiquidBalance(
        Number(Number(accountSummary.withdrawable).toFixed(2))
      );
      setPortfolioValue(
        Number(Number(accountSummary.marginSummary.accountValue).toFixed(2))
      );
      setOpenPositions(accountSummary.assetPositions);
    };

    fetchPerpData();
    fetchUserBalance();
  }, []);

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Header />
      {loading ? (
        <div className="flex justify-center items-center">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <main>
            {/* Hero section with title and stats */}
            <div className="flex flex-col items-center py-20 sm:pt-40 px-4 sm:px-16 min-h-[452px] bg-[#F5F5F5] relative w-full">
              {/* Title */}
              <h1 className="font-inter font-bold text-4xl sm:text-[72px] leading-[120%] text-center tracking-[-0.03em] text-[#1E1E1E] mb-8 sm:mb-0">
                Funding Strategy
              </h1>

              {/* Portfolio Info */}    
              <div className="w-full max-w-[1305px] mt-8 sm:mt-32 px-4 sm:px-0">
                <h2 className="font-inter font-semibold text-xl sm:text-2xl leading-[120%] tracking-[-0.02em] text-[#1E1E1E] mb-6 text-center">
                  Current Portfolio Statistics
                </h2>
                <div className="flex flex-col sm:flex-row justify-between w-full gap-4 sm:gap-0">
                  <div className="text-center">
                    <p className="font-inter font-normal text-sm text-[#757575] mb-2">Hyperliquid Balance</p>
                    <p className="font-inter font-semibold text-lg text-[#1E1E1E]">{hyperliquidBalance}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-inter font-normal text-sm text-[#757575] mb-2">USDC Balance</p>
                    <p className="font-inter font-semibold text-lg text-[#1E1E1E]">{usdcBalance}</p>
                  </div>
                  {openPositions.map((position: any) => (
                    <div key={position.position.coin} className="flex flex-col sm:flex-row gap-8">
                      <div className="text-center">
                        <p className="font-inter font-normal text-sm text-[#757575] mb-2">Open Positions</p>
                        <p className="font-inter font-semibold text-lg text-[#1E1E1E]">{position.position.coin}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-inter font-normal text-sm text-[#757575] mb-2">APY</p>
                        <p className="font-inter font-semibold text-lg text-[#1E1E1E]">
                          {Number(position.position.returnOnEquity * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="text-center">
                    <p className="font-inter font-normal text-sm text-[#757575] mb-2">Portfolio Value</p>
                    <p className="font-inter font-semibold text-lg text-[#1E1E1E]">{portfolioValue}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card grid section */}
            <div className="flex flex-col items-center py-16 px-8 gap-10 bg-white">
              <div className="grid-cols-3 gap-x-24 gap-y-16 w-full place-items-center flex flex-wrap justify-center">
                {perpsInfo.map((perp, index) => (
                  <CardComponent
                    key={index}
                    name={perp.name}
                    perpDecimals={perp.decimals}
                    assetIndex={perp.assetIndex}
                    fundingHrly={perp.fundingHrly}
                    fundingYrly={perp.fundingYrly}
                    fundingAvgMonthly={perp.fundingAvgMonthly}
                  />
                ))}
              </div>
            </div>
          </main>
          <Footer />
        </>
      )}
    </div>
  );
}

export default App;