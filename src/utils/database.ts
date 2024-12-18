export async function storeTradeInfo(
  userAddress: string,
  asset: string,
  spotAmount: string,
  perpAmount: string,
  leverage: string
) {
  try {
    const res = await fetch(
      "http://localhost:8000/api/storage/store-position",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_address: userAddress,
          asset,
          spot_amount: spotAmount,
          perp_size: perpAmount,
          leverage,
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message);
    }

    console.log(data);
    return data;
  } catch (error) {
    console.log(error);
  }
}

export async function getPortfolioInfo(userAddress: string): Promise<any> {
  try {
    const res = await fetch(
      "http://localhost:8000/api/storage/get-portfolio/" + userAddress,
      {
        method: "GET",
      }
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message);
    }

    console.log(data);
    return data.portfolio;
  } catch (error) {
    console.log(error);
    return [];
  }
}
