export default function PortfolioInfo(props: {
  usdcBalance: number;
  hyperliquidBalance: number;
  portfolioValue: number;
  openPositions: any;
}) {
  return (
    <div className="bg-slate-100">
      <div className="p-4">
        <h2 className="text-xl font-semibold">Portfolio Info</h2>
        <div className="flex justify-between">
          <div>
            <p className="text-sm">Hyperliquid Balance</p>
            <p className="text-lg">{props.hyperliquidBalance}</p>
          </div>
          <div>
            <p className="text-sm">USDC Balance</p>
            <p className="text-lg">{props.usdcBalance}</p>
          </div>
          <div>
            {props.openPositions.map((position: any) => {
              return (
                <>
                  <div>
                    <p className="text-sm">Open Positions</p>
                    <p className="text-lg">{position.position.coin}</p>
                  </div>
                  <div>
                    <p className="text-sm">APY</p>
                    <p className="text-lg">
                      {Number(position.position.returnOnEquity * 100).toFixed(
                        2
                      )}
                      %
                    </p>
                  </div>
                </>
              );
            })}
          </div>
          <div>
            <p className="text-sm">Portfolio Value</p>
            <p className="text-lg">{props.portfolioValue}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
