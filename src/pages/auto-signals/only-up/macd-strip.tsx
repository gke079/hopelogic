import React from 'react';
import { classifyHistogram, type TMacdColour } from './macd';

type TMacdStripProps = {
    histogram: number[];
    height?: number;
};

const WIDTH_SCALE = 12;
const BAR_WIDTH = 8;
const PADDING = 4;

const COLOUR_MAP: Record<TMacdColour, string> = {
    dark_green: 'var(--only-up-dark-green)',
    faded_green: 'var(--only-up-faded-green)',
    faded_red: 'var(--only-up-faded-red)',
    dark_red: 'var(--only-up-dark-red)',
};

const MacdStrip = ({ histogram, height = 90 }: TMacdStripProps) => {
    const visible_histogram = histogram.slice(-60);
    const colours = classifyHistogram(visible_histogram);
    const chart_width = Math.max(visible_histogram.length * WIDTH_SCALE, 1);
    const max = visible_histogram.length ? Math.max(...visible_histogram.map(Math.abs)) : 1;
    const mid = height / 2;

    const bar_height = (value: number) => Math.max((Math.abs(value) / (max || 1)) * (height / 2 - PADDING), 1);

    return (
        <svg
            className='only-up__macd-strip'
            viewBox={`0 0 ${chart_width} ${height}`}
            preserveAspectRatio='none'
            role='img'
            aria-label='MACD histogram'
        >
            <line x1={0} x2={chart_width} y1={mid} y2={mid} stroke='var(--text-less-prominent)' strokeWidth={1} />
            {visible_histogram.map((value, index) => {
                const bar = bar_height(value);
                const x = index * WIDTH_SCALE + (WIDTH_SCALE - BAR_WIDTH) / 2;
                return (
                    <rect
                        key={index}
                        x={x}
                        y={value >= 0 ? mid - bar : mid}
                        width={BAR_WIDTH}
                        height={bar}
                        fill={COLOUR_MAP[colours[index]]}
                    />
                );
            })}
        </svg>
    );
};

export default MacdStrip;
