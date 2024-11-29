import React from "react";

import Header from "./components/Header";
import CardComponent from "./components/CardComponent";
import LoadingSpinner from "./components/LoadingSpinner";

function App() {
  interface Perp {
    name: string;
    fundingHrly: number;
    fundingYrly: number;
    fundingAvgMonthly: number;
  }

  const [perps, setPerps] = React.useState<Perp[]>([]);
  const [loading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(
        "http://localhost:8000/getHyperliquidData?numOfPerps=9"
      );
      const data = await res.json();
      setPerps(data);
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
            {perps.map((perp, index) => (
              <CardComponent
                key={index}
                name={perp.name}
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
