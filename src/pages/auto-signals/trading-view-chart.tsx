import React from 'react';
import { useStore } from '@/hooks/useStore';

type TProps = {
    symbol: string;
    granularity: number;
};

const TradingViewChart = ({ symbol, granularity }: TProps) => {
    const { ui } = useStore();
    const theme = ui.is_dark_mode_on ? 'dark' : 'light';
    const interval = Math.max(1, Math.round(granularity / 60));

    const params = new URLSearchParams({
        symbol,
        theme,
        interval: String(interval),
        'hide-signup': 'true',
        hide_top_toolbar: 'false',
        hide_side_toolbar: 'false',
        allow_symbol_change: 'true',
        withdateranges: 'false',
    });

    return (
        <div className='only-up__tv-chart'>
            <iframe
                id='only-up-trading-view'
                src={`https://charts.deriv.com/deriv?${params.toString()}`}
                title='Deriv advanced chart'
                allowFullScreen
            />
        </div>
    );
};

export default TradingViewChart;
