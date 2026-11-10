import React from 'react';
import { localize } from '@deriv-com/translations';
import { TCandle, THistogramColor } from './macd';

type TProps = {
    candles: TCandle[];
    histogram: number[];
    colors: (THistogramColor | null)[];
    visible?: number;
};

const WIDTH = 800;
const HEIGHT = 90;

export const HISTOGRAM_FILL: Record<THistogramColor, string> = {
    dark_green: '#089981',
    faded_green: '#9ed9cd',
    faded_red: '#f7b9b9',
    dark_red: '#f23645',
};

const MacdStrip = ({ candles, histogram, colors, visible = 60 }: TProps) => {
    if (!candles.length) {
        return <div className='only-up__chart only-up__chart--empty'>{localize('Loading candles...')}</div>;
    }

    const start = Math.max(0, candles.length - visible);
    const shown_hist = histogram.slice(start);
    const shown_colors = colors.slice(start);
    const shown_epochs = candles.slice(start).map(c => c.epoch);

    const step = WIDTH / visible;
    const bar_width = Math.max(2, step * 0.6);
    const x = (i: number) => i * step + step / 2;

    const max_abs = Math.max(...shown_hist.map(Math.abs)) || 1;
    const zero_y = HEIGHT / 2;
    const hist_y = (value: number) => zero_y - (value / max_abs) * (HEIGHT / 2 - 2);

    return (
        <div className='only-up__chart'>
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio='none' role='img'>
                <title>{localize('MACD histogram')}</title>
                <line x1={0} x2={WIDTH} y1={zero_y} y2={zero_y} stroke='var(--border-normal)' strokeWidth={1} />
                {shown_hist.map((value, i) => {
                    const color = shown_colors[i];
                    const bar_top = Math.min(zero_y, hist_y(value));
                    return (
                        <rect
                            key={shown_epochs[i]}
                            x={x(i) - bar_width / 2}
                            y={bar_top}
                            width={bar_width}
                            height={Math.max(1, Math.abs(hist_y(value) - zero_y))}
                            fill={color ? HISTOGRAM_FILL[color] : 'var(--border-normal)'}
                        />
                    );
                })}
            </svg>
            <div className='only-up__legend'>
                <span>MACD (12, 26, 9)</span>
                <span>
                    <i style={{ background: HISTOGRAM_FILL.faded_red }} /> {localize('Faded red: trade')}
                </span>
                <span>
                    <i style={{ background: HISTOGRAM_FILL.dark_green }} /> {localize('Short dark green: trade')}
                </span>
                <span>
                    <i style={{ background: HISTOGRAM_FILL.faded_green }} /> {localize('Faded green: no trade')}
                </span>
                <span>
                    <i style={{ background: HISTOGRAM_FILL.dark_red }} /> {localize('Dark red: no trade')}
                </span>
            </div>
        </div>
    );
};

export default MacdStrip;
