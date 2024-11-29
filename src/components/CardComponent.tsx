interface CardComponentProps {
  name: string;
  fundingHrly: number;
  fundingYrly: number;
  fundingAvgMonthly: number;
}

export default function CardComponent(props: CardComponentProps) {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg m-4">
      <img
        src={
          "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/1200px-Bitcoin.svg.png"
        }
        alt={props.name}
        className="w-full h-48 object-cover"
      />
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">{props.name}</div>
        <p className="text-gray-700 text-base">Strategy Info</p>
        <div className="mt-4 text-lg">
          <div>
            <strong>Current APY:</strong> {props.fundingYrly}%
          </div>
          <div>
            <strong>Average APY (Past year):</strong> {props.fundingAvgMonthly}%
          </div>
        </div>
        <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Execute Strategy
        </button>
      </div>
    </div>
  );
}
