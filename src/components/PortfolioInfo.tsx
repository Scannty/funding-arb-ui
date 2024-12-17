export default function PortfolioInfo(props: {
  usdcBalance: number;
  hyperliquidBalance: number;
  portfolioValue: number;
  openPositions: any;
}) {
  return (
    <div className="flex flex-col items-center py-40 px-16 h-[452px] bg-[#F5F5F5]">
      {/* Title Section */}
      <h1 className="w-[707px] h-[86px] font-inter font-bold text-[72px] leading-[120%] text-center tracking-[-0.03em] text-[#1E1E1E] mb-auto">
        Funding Strategy
      </h1>
      <div className="w-full mt-auto">
        <h2 className="font-inter font-semibold text-2xl leading-[120%] tracking-[-0.02em] text-[#1E1E1E] mb-6 text-center">
          Current Portfolio Statistics
        </h2>
        <div className="flex justify-between w-full">
          <div className="text-center">
            <p className="font-inter font-normal text-sm text-[#757575] mb-2">Hyperliquid Balance</p>
            <p className="font-inter font-semibold text-lg text-[#1E1E1E]">{props.hyperliquidBalance}</p>
          </div>
          <div className="text-center">
            <p className="font-inter font-normal text-sm text-[#757575] mb-2">USDC Balance</p>
            <p className="font-inter font-semibold text-lg text-[#1E1E1E]">{props.usdcBalance}</p>
          </div>
          {props.openPositions.map((position: any) => (
            <div key={position.position.coin} className="flex gap-8">
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
            <p className="font-inter font-semibold text-lg text-[#1E1E1E]">{props.portfolioValue}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
