import React from "react";

import Header from "./components/Header";
import CardComponent from "./components/CardComponent";
import LoadingSpinner from "./components/LoadingSpinner";
import { tokens } from "./constants/tokens";

function App() {
  interface Perp {
    name: string;
    assetIndex: number;
    decimals: number;
    fundingHrly: number;
    fundingYrly: number;
    fundingAvgMonthly: number;
  }

  const [perpsInfo, setPerpsInfo] = React.useState<Perp[]>([]);
  const [loading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const perps = Object.keys(tokens);
    perps.push("HYPE", "PURR");
    const queryString = `perps=${perps.join(",")}`;
    const fetchData = async () => {
      const res = await fetch(
        "http://localhost:8000/getPerpsInfo?" + queryString
      );
      const data = await res.json();
      setPerpsInfo(data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <>
      <Header />
      <div className="container mx-auto px-4">
        {loading ? (
          <div className="flex justify-center items-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {perpsInfo.map((perp, index) => (
              <CardComponent
                key={index}
                name={perp.name}
                assetIndex={perp.assetIndex}
                fundingHrly={perp.fundingHrly}
                fundingYrly={perp.fundingYrly}
                fundingAvgMonthly={perp.fundingAvgMonthly}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
