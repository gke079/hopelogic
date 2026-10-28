import React, { useState } from 'react';
import classNames from 'classnames';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { useApiBase } from '@/hooks/useApiBase';
import { Localize, localize } from '@deriv-com/translations';
import { useTickStream } from './analysis-utils';
import CircleAnalysis from './circle-analysis';
import GraphicalAnalysis from './graphical-analysis';
import './analysis.scss';

const VIEWS = [
    { id: 'circle', label: () => localize('Circle Analysis'), Component: CircleAnalysis },
    { id: 'graphical', label: () => localize('Graphical Analysis'), Component: GraphicalAnalysis },
];

const Analysis = () => {
    const { connectionStatus } = useApiBase();
    const [view, setView] = useState(VIEWS[0].id);
    // Market and window are shared so both views analyse the same ticks over one subscription.
    const [symbol, setSymbol] = useState('1HZ100V');
    const [tick_count, setTickCount] = useState(1000);
    const is_connected = connectionStatus === CONNECTION_STATUS.OPENED;
    const stream = useTickStream(symbol, tick_count, is_connected);
    const { Component } = VIEWS.find(item => item.id === view) ?? VIEWS[0];

    return (
        <div className='analysis'>
            <div className='analysis__subtabs' role='tablist'>
                {VIEWS.map(item => (
                    <button
                        key={item.id}
                        type='button'
                        role='tab'
                        aria-selected={view === item.id}
                        className={classNames('analysis__subtab', { 'analysis__subtab--active': view === item.id })}
                        onClick={() => setView(item.id)}
                    >
                        {item.label()}
                    </button>
                ))}
            </div>

            {!is_connected && (
                <div className='analysis__notice'>
                    <Localize i18n_default_text='Connecting to market data...' />
                </div>
            )}
            {stream.error && <div className='analysis__notice analysis__notice--error'>{stream.error}</div>}

            <Component
                symbol={symbol}
                onSymbolChange={setSymbol}
                tick_count={tick_count}
                onTickCountChange={setTickCount}
                stream={stream}
            />

            <p className='analysis__disclaimer'>
                <Localize i18n_default_text='Past results do not predict future ticks. Synthetic indices are generated randomly.' />
            </p>
        </div>
    );
};

export default Analysis;
