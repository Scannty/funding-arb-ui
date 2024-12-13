import { ConnectKitButton } from "connectkit";

export default function Header() {
  return (
    <header className="box-border flex flex-row flex-wrap items-center content-start justify-between p-8 gap-x-6 h-[99px] bg-white border-b border-[#D9D9D9]">
      <div className="flex flex-row items-center p-0 gap-6 w-10 h-[35px] order-0 flex-none">
        <img
          src="https://pbs.twimg.com/profile_images/1646991609416806408/vKLEZxhh_400x400.png"
          alt="Hyperliquid Logo"
          className="w-[40px] h-[40px] order-0 flex-none"
        />
        <h1 className="font-inter font-bold text-base leading-[100%] flex items-center text-[#1E1E1E] order-0 flex-none">
          Hyperliquid FF Strategy
        </h1>
      </div>
      
      <div className="flex flex-row items-center ml-auto p-0 gap-3 w-[178px] h-8">
        <ConnectKitButton />
      </div>
    </header>
  );
}
