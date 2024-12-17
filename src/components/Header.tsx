import { ConnectKitButton } from "connectkit";

export default function Header() {
  return (
    <header className="box-border flex flex-row flex-wrap items-center content-start justify-between p-4 sm:p-8 min-h-[99px] bg-white border-b border-[#D9D9D9]">
      {/* Logo and Title Container */}
      <div className="flex flex-row items-center gap-3 sm:gap-6 flex-shrink-0">
        <img
          src="https://pbs.twimg.com/profile_images/1646991609416806408/vKLEZxhh_400x400.png"
          alt="Hyperliquid Logo"
          className="w-[35px] h-[35px] sm:w-[40px] sm:h-[40px] flex-shrink-0"
        />
        <h1 className="font-inter font-bold text-sm sm:text-base leading-[100%] flex items-center text-[#1E1E1E] flex-shrink-0">
          Hyperliquid FF Strategy
        </h1>
      </div>
      
      {/* Connect Button Container */}
      <div className="flex flex-row items-center p-0 gap-3 flex-shrink-0 mt-2 sm:mt-0">
        <ConnectKitButton />
      </div>
    </header>
  );
}