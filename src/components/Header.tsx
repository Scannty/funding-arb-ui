import { ConnectKitButton } from "connectkit";

export default function Header() {
  return (
    <header className="flex justify-between items-center p-4 bg-gray-200">
      <h1 className="text-xl">Funding Arbitrage Farming</h1>
      <ConnectKitButton />
    </header>
  );
}
