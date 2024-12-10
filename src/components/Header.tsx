import { ConnectKitButton } from "connectkit";

export default function Header() {
  return (
    <header className="flex justify-between items-center p-4 shadow-md">
      <div className="flex items-center">
        <img
          src="https://pbs.twimg.com/profile_images/1646991609416806408/vKLEZxhh_400x400.png"
          alt="Hyperliquid Logo"
          className="w-12"
        />
        <h1 className="ml-6 text-xl font-medium">Hyperliquid FF Strategy</h1>
      </div>
      <ConnectKitButton />
    </header>
  );
}
