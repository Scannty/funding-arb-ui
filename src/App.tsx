import React from "react";
import { useAccount, useBalance } from "wagmi";

import Header from "./components/Header";
import Footer from "./components/Footer";
import CardComponent from "./components/CardComponent";
import LoadingSpinner from "./components/LoadingSpinner";
import { tokens } from "./constants/tokens";
import PortfolioInfo from "./components/PortfolioInfo";
import { getPortfolioInfo } from "./utils/database";
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
  const [portfolio, setPortfolio] = React.useState<any>([]);

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

    if (!address) return;

    console.log("heehsk");
    const perps = Object.keys(tokens);
    perps.push("HYPE", "PURR");
    const queryString = `perps=${perps.join(",")}`;
    const fetchPerpData = async () => {
      const res = await fetch(
        "http://localhost:8000/getPerpsInfo?" + queryString
      );
      const data = await res.json();

      const portfolio = await getPortfolioInfo(address);

      setPortfolio(portfolio);
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
            <PortfolioInfo
              usdcBalance={usdcBalance}
              hyperliquidBalance={hyperliquidBalance}
              portfolioValue={portfolioValue}
              openPositions={openPositions}
              portfolio={portfolio}
            />

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
