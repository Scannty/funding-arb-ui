interface TokenInfo {
  tokenAddress: string;
  decimals: number;
  iconSymbol: string;
}

export const tokens: { [perpTicker: string]: TokenInfo } = {
  BTC: {
    tokenAddress: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
    decimals: 8,
    iconSymbol: "btc",
  },
  ETH: {
    tokenAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    decimals: 18,
    iconSymbol: "eth",
  },
  LINK: {
    tokenAddress: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
    decimals: 18,
    iconSymbol: "link",
  },
  ARB: {
    tokenAddress: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    decimals: 18,
    iconSymbol: "arbi",
  },
};
