import React from 'react';
import type { TCandle } from './use-candles';

type TCandlestickChartProps = {
    candles: TCandle[];
    height?: number;
};

const WIDTH = 800;
const PADDING = 6;

const CandlestickChart = ({ candles, height = 260 }: TCandlestickChartProps) => {
    const visible_candles = candles.slice(-60);
    const width_scale = 12;
    const body_width = 8;
    const chart_width = Math.max(visible_candles.length * width_scale, 1);

    const highs = visible_candles.map(candle => candle.high);
    const lows = visible_candles.map(candle => candle.low);
    const max = highs.length ? Math.max(...highs) : 1;
    const min = lows.length ? Math.min(...lows) : 0;
    const range = max - min || 1;

    const y = (value: number) => PADDING + (1 - (value - min) / range) * (height - PADDING * 2);

    return (
        <svg
            className='only-up__chart'
            viewBox={`0 0 ${chart_width} ${height}`}
            preserveAspectRatio='none'
            role='img'
            aria-label='Candlestick chart'
        >
            {visible_candles.map((candle, index) => {
                const is_up = candle.close >= candle.open;
                const x = index * width_scale + (width_scale - body_width) / 2;
                const top = y(Math.max(candle.open, candle.close));
                const bottom = y(Math.min(candle.open, candle.close));
                const fill = is_up ? 'var(--only-up-dark-green)' : 'var(--only-up-dark-red)';

                return (
                    <g key={`${candle.epoch}-${index}`}>
                        <line
                            x1={x + body_width / 2}
                            x2={x + body_width / 2}
                            y1={y(candle.high)}
                            y2={y(candle.low)}
                            stroke={fill}
                            strokeWidth={1}
                        />
                        <rect
                            x={x}
                            y={top}
                            width={body_width}
                            height={Math.max(bottom - top, 1)}
                            fill={fill}
                        />
                    </g>
                );
            })}
        </svg>
    );
};

export default CandlestickChart;
