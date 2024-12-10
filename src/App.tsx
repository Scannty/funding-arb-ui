import React from "react";
import { useAccount, useBalance } from "wagmi";

import Header from "./components/Header";
import CardComponent from "./components/CardComponent";
import LoadingSpinner from "./components/LoadingSpinner";
import { tokens } from "./constants/tokens";
import PortfolioInfo from "./components/PortfolioInfo";
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
    <>
      <Header />
      {loading ? (
        <div className="flex justify-center items-center">
          <LoadingSpinner />
        </div>
      ) : (
        <main>
          <PortfolioInfo
            usdcBalance={usdcBalance}
            hyperliquidBalance={hyperliquidBalance}
            portfolioValue={portfolioValue}
            openPositions={openPositions}
          />
          <div className="mx-32 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        </main>
      )}
    </>
  );
}

export default App;
