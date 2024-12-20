import React from "react";
import { erc20ABI, useAccount, useBalance } from "wagmi";
import { readContract } from "wagmi/actions";

import Header from "./components/Header";
import Footer from "./components/Footer";
import CardComponent from "./components/CardComponent";
import LoadingSpinner from "./components/LoadingSpinner";
import { tokens } from "./constants/tokens";
import PortfolioDashboard from "./components/PortfolioDashboard";
import { getPortfolioInfo } from "./utils/database";
import { getAccountSummary } from "./utils/hyperliquid";
import { USDC_PROXY_ADDRESS } from "./constants/config";
import { Perp } from "./constants/types";

function App() {
  const [usdcBalance, setUsdcBalance] = React.useState(0);
  const [tokensBalances, setTokensBalances] = React.useState<Object>({});
  const [perpsInfo, setPerpsInfo] = React.useState<Perp[]>([]);
  const [loading, setIsLoading] = React.useState(true);
  const [hyperliquidBalance, setHyperLiquidBalance] = React.useState(0);
  const [portfolioValue, setPortfolioValue] = React.useState(0);
  const [hyperliquidPositions, setHyperliquidPositions] = React.useState<any>(
    []
  );
  const [openPositions, setOpenPositions] = React.useState<any>([]);
  const [validPositions, setValidPositions] = React.useState<
    Record<string, boolean>
  >({});

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

    const perps = Object.keys(tokens);
    perps.push("HYPE", "PURR");
    const queryString = `perps=${perps.join(",")}`;

    const fetchTokensBalances = async () => {
      Object.entries(tokens).forEach(async ([ticker, token]) => {
        const tokenBalance = await readContract({
          addressOrName: token.tokenAddress,
          chainId: 42161,
          contractInterface: erc20ABI,
          functionName: "balanceOf",
          args: [address],
        });

        setTokensBalances((prev) => ({
          ...prev,
          [ticker]: tokenBalance,
        }));
      });
    };

    const fetchPerpData = async () => {
      const res = await fetch(
        "http://localhost:8000/getPerpsInfo?" + queryString
      );
      const data = await res.json();

      setPerpsInfo(data);
      setIsLoading(false);
    };

    const fetchUserPositions = async () => {
      if (!address) return;
      const positions = await getPortfolioInfo(address);

      setOpenPositions(positions);
    };

    const fetchHyperliquidInfo = async () => {
      if (!address) return;
      const accountSummary = await getAccountSummary(address);
      setHyperLiquidBalance(
        Number(Number(accountSummary.withdrawable).toFixed(2))
      );
      setPortfolioValue(
        Number(Number(accountSummary.marginSummary.accountValue).toFixed(2))
      );
      setHyperliquidPositions(accountSummary.assetPositions);
    };

    fetchTokensBalances();
    fetchPerpData();
    fetchUserPositions();
    fetchHyperliquidInfo();
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
            <PortfolioDashboard
              usdcBalance={usdcBalance}
              hyperliquidBalance={hyperliquidBalance}
              portfolioValue={portfolioValue}
              hyperliquidPositions={hyperliquidPositions}
              openPositions={openPositions}
              validPositions={validPositions}
              perpsInfo={perpsInfo}
              setValidPositions={setValidPositions}
              tokensBalances={tokensBalances}
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
                    hyperliquidBalance={hyperliquidBalance}
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
