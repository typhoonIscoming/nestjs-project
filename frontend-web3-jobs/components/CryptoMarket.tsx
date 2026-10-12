import Link from 'next/link';

interface CryptoMarketItem {
	symbol: string;
	name: string;
	price: string;
	change: number;
	chart: number[];
}

const markets: CryptoMarketItem[] = [
	{
		symbol: 'BTC/USDT',
		name: 'Bitcoin',
		price: '67,842.10',
		change: 2.84,
		chart: [
			42, 43, 42, 44, 43, 45, 44, 42, 41, 41, 40, 39, 38, 35, 35, 34, 35, 52, 55, 54, 56, 57,
			50, 49, 48, 41, 40, 42, 44, 43, 46, 38, 37, 36, 39, 38, 30, 39, 32, 31, 33, 32, 34, 43,
			45, 44, 46, 48,
		],
	},
	{
		symbol: 'ETH/USDT',
		name: 'Ethereum',
		price: '3,521.76',
		change: 1.62,
		chart: [
			0, 0.28, 1.05, 2.64, 2.09, 1.84, 1.43, 1.37, 1.61, 2.13, 2.35, 14.89, 15.25, 14.86,
			16.31, 13.44, 14.28, 11.12, 11.23, 10.88, 10.38, 11.12, 7.32, 8.69, 10.46, 10.6, 11.8,
			12.65, 13.98, 15.84, 13.16, 10.98, 14.1, 13.76, 10.85, 10.1, 11.49, 18.77, 16.62, 16.76,
			12.68, 20, 18.52, 16.35, 11.07, 8.05, 7.52, 8.03,
		],
	},
	{
		symbol: 'SOL/USDT',
		name: 'Solana',
		price: '186.42',
		change: -0.73,
		chart: [
			0.04, 0, 0.26, 1.49, 1.28, 1.07, 1.14, 0.42, 1.09, 1.87, 2.09, 9.63, 12.35, 13.89,
			12.77, 10.38, 11.13, 9.47, 9.33, 9.88, 9.55, 10.3, 6.74, 7.96, 9.14, 9.14, 9.74, 9.96,
			11.1, 12.62, 11.19, 11.49, 14.03, 12.97, 11.71, 12.69, 14.09, 18.39, 16.62, 17.95,
			15.37, 19.61, 20, 17.57, 15.16, 14.23, 14.62, 15.53,
		],
	},
	{
		symbol: 'XRP/USDT',
		name: 'XRP',
		price: '0.5274',
		change: 3.18,
		chart: [
			0.99, 0, 1.65, 4.78, 4.37, 4.37, 4.05, 3.52, 4.69, 6.71, 7.01, 17.71, 18.71, 20,
			18.71, 14.73, 13.95, 10.83, 11.7, 12.41, 12.07, 14.3, 8.53, 10.12, 11.23, 12.95, 14.02,
			14.66, 13.25, 13.42, 12, 10.5, 14.32, 14.94, 10.87, 8.81, 10.14, 16.46, 12.28, 13.4,
			9.69, 16.98, 18.56, 15.46, 11.23, 8.94, 6.84, 6.39,
		],
	},
];

const chartWidth = 148;
const chartHeight = 44;
const fameexChartWidth = 88;
const fameexChartTop = 3;
const fameexChartBottom = 23;

function getChartPath(values: number[]) {
	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min || 1;
	const points = values.map((value, index) => {
		const x = (index / (values.length - 1)) * chartWidth;
		const y = chartHeight - ((value - min) / range) * (chartHeight - 4) - 2;
		return `${x.toFixed(2)},${y.toFixed(2)}`;
	});
	return `M ${points.join(' L ')}`;
}

function Sparkline({ item }: { item: CryptoMarketItem }) {
	const positive = item.change >= 0;
	return (
		<svg
			className="h-11 w-36"
			viewBox={`0 0 ${chartWidth} ${chartHeight}`}
			role="img"
			aria-label={`${item.symbol} ${item.change >= 0 ? '上涨' : '下跌'}走势图`}
		>
			<path
				d={getChartPath(item.chart)}
				fill="none"
				stroke={positive ? '#34d399' : '#fb7185'}
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function getChartPoints(values: number[]) {
	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min || 1;

	const point = values
		.map((value, index) => {
			const x = (index / (values.length - 1)) * fameexChartWidth;
			const y =
				fameexChartBottom - ((value - min) / range) * (fameexChartBottom - fameexChartTop);
			return `${x.toFixed(2)},${y.toFixed(2)}`;
		})
		.join(' ');
	// console.log('Chart points:', point);
	return point;
}

function PolylineSparkline({ item }: { item: CryptoMarketItem }) {
	const positive = item.change >= 0;
	return (
		<svg
			className="h-6.5 w-22"
			viewBox={`0 0 ${fameexChartWidth} ${fameexChartBottom + fameexChartTop}`}
			preserveAspectRatio="none"
			role="img"
			aria-label={`${item.symbol} ${item.change >= 0 ? '上涨' : '下跌'}走势图`}
		>
			<polyline
				points={getChartPoints(item.chart)}
				fill="none"
				stroke={positive ? '#34d399' : '#fb7185'}
				strokeWidth="0.7"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export default function CryptoMarket() {
	return (
		<section className="container-page py-10" aria-labelledby="market-title">
			<div className="mb-5 flex items-end justify-between gap-4">
				<div>
					<h2 id="market-title" className="section-title">
						热门加密货币
					</h2>
					<p className="mt-1 text-sm text-slate-400">实时行情趋势，发现 Web3 市场机会</p>
				</div>
				<Link href="/community" className="text-sm text-emerald-300 hover:underline">
					进入社区 →
				</Link>
			</div>

			<div className="card overflow-hidden">
				<div className="hidden grid-cols-[minmax(150px,1.4fr)_1fr_1fr_180px] gap-4 border-b border-slate-800 px-5 py-3 text-xs font-medium text-slate-500 sm:grid">
					<span>交易对</span>
					<span>最新价</span>
					<span>24h 涨跌</span>
					<span>走势图</span>
				</div>
				<ul className="divide-y divide-slate-800">
					{markets.map((item) => {
						const positive = item.change >= 0;
						return (
							<li
								key={item.symbol}
								className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(150px,1.4fr)_1fr_1fr_180px] sm:items-center sm:gap-4"
							>
								<div>
									<p className="font-semibold text-white">{item.symbol}</p>
									<p className="mt-0.5 text-xs text-slate-500">{item.name}</p>
								</div>
								<div>
									<p className="text-sm font-medium text-slate-200">
										{item.price}
									</p>
									<p className="text-xs text-slate-500 sm:hidden">最新价</p>
								</div>
								<div>
									<p
										className={
											positive
												? 'text-sm font-semibold text-emerald-300'
												: 'text-sm font-semibold text-rose-300'
										}
									>
										{positive ? '+' : ''}
										{item.change.toFixed(2)}%
									</p>
									<p className="text-xs text-slate-500 sm:hidden">24h 涨跌</p>
								</div>
								<div>
									<PolylineSparkline item={item} />
									<p className="text-xs text-slate-500 sm:hidden">走势图</p>
								</div>
							</li>
						);
					})}
				</ul>
			</div>
			<p className="mt-3 text-xs text-slate-500">
				行情数据为演示数据，仅用于展示走势图绘制效果，不构成投资建议。
			</p>
		</section>
	);
}
