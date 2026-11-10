import React, { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { Localize, localize } from '@deriv-com/translations';
import CandleMacdChart from './candle-macd-chart';
import { calculateMacd, evaluateOnlyUp, getHistogramColors, THistogramColor, TSignalVerdict } from './macd';
import { useCandles } from './use-candles';

export const ENTRY_SECONDS_LEFT = 7;
// Entry window: from 7s left down to this many seconds left
const ENTRY_WINDOW_END = 5;

const SYMBOLS = [
    { value: '1HZ10V', label: 'Volatility 10 (1s) Index' },
    { value: 'R_10', label: 'Volatility 10 Index' },
    { value: '1HZ25V', label: 'Volatility 25 (1s) Index' },
    { value: 'R_25', label: 'Volatility 25 Index' },
    { value: '1HZ50V', label: 'Volatility 50 (1s) Index' },
    { value: 'R_50', label: 'Volatility 50 Index' },
    { value: '1HZ75V', label: 'Volatility 75 (1s) Index' },
    { value: 'R_75', label: 'Volatility 75 Index' },
    { value: '1HZ100V', label: 'Volatility 100 (1s) Index' },
    { value: 'R_100', label: 'Volatility 100 Index' },
];

const GRANULARITIES = [
    { value: 60, label: '1 minute' },
    { value: 120, label: '2 minutes' },
    { value: 180, label: '3 minutes' },
    { value: 300, label: '5 minutes' },
    { value: 900, label: '15 minutes' },
];

const COLOR_LABELS: Record<THistogramColor, string> = {
    dark_green: 'Dark green',
    faded_green: 'Faded green',
    faded_red: 'Faded red',
    dark_red: 'Dark red',
};

type TLogEntry = {
    id: number;
    time: string;
    verdict: TSignalVerdict;
    action: string;
};

const OnlyUp = observer(() => {
    const { run_panel } = useStore();
    const [symbol, setSymbol] = useState('1HZ100V');
    const [granularity, setGranularity] = useState(60);
    const [max_dark_green_bars, setMaxDarkGreenBars] = useState(2);
    const [is_armed, setIsArmed] = useState(false);
    const [stop_on_bad_market, setStopOnBadMarket] = useState(true);
    const [seconds_left, setSecondsLeft] = useState<number | null>(null);
    const [log, setLog] = useState<TLogEntry[]>([]);

    const { candles, error, getServerNow } = useCandles(symbol, granularity);

    const histogram = useMemo(() => calculateMacd(candles.map(c => c.close)).map(p => p.histogram), [candles]);
    const colors = useMemo(() => getHistogramColors(histogram), [histogram]);
    const verdict = useMemo(() => evaluateOnlyUp(histogram, max_dark_green_bars), [histogram, max_dark_green_bars]);

    // Latest values in refs so the timer always sees current data
    const latest = useRef({ candles, verdict, is_armed, stop_on_bad_market });
    latest.current = { candles, verdict, is_armed, stop_on_bad_market };
    const fired_for_candle = useRef<number | null>(null);
    const started_by_signal = useRef(false);

    useEffect(() => {
        fired_for_candle.current = null;
    }, [symbol, granularity]);

    useEffect(() => {
        if (!run_panel.is_running) started_by_signal.current = false;
    }, [run_panel.is_running]);

    useEffect(() => {
        const timer = setInterval(() => {
            const { candles: current_candles, verdict: current_verdict } = latest.current;
            const last = current_candles[current_candles.length - 1];
            if (!last) {
                setSecondsLeft(null);
                return;
            }
            const remaining = last.epoch + granularity - getServerNow();
            setSecondsLeft(Math.max(0, Math.ceil(remaining)));

            const in_entry_window = remaining <= ENTRY_SECONDS_LEFT && remaining > ENTRY_WINDOW_END;
            if (!in_entry_window || fired_for_candle.current === last.epoch) return;
            fired_for_candle.current = last.epoch;

            let action = localize('Monitoring only');
            if (latest.current.is_armed) {
                if (current_verdict.is_good) {
                    if (!run_panel.is_running) {
                        started_by_signal.current = true;
                        run_panel.onRunButtonClick();
                        action = localize('Run pressed');
                    } else {
                        action = localize('Bot already running');
                    }
                } else if (latest.current.stop_on_bad_market && run_panel.is_running && started_by_signal.current) {
                    run_panel.onStopButtonClick();
                    started_by_signal.current = false;
                    action = localize('Bot stopped');
                } else {
                    action = localize('No trade');
                }
            }

            setLog(prev =>
                [
                    {
                        id: last.epoch,
                        time: new Date(last.epoch * 1000).toLocaleTimeString(),
                        verdict: current_verdict,
                        action,
                    },
                    ...prev,
                ].slice(0, 12)
            );
        }, 250);
        return () => clearInterval(timer);
    }, [granularity, getServerNow, run_panel]);

    const is_entry_now = seconds_left !== null && seconds_left <= ENTRY_SECONDS_LEFT && seconds_left > ENTRY_WINDOW_END;

    return (
        <div className='only-up'>
            <div className='only-up__controls'>
                <label className='only-up__field'>
                    <span>
                        <Localize i18n_default_text='Market' />
                    </span>
                    <select value={symbol} onChange={e => setSymbol(e.target.value)}>
                        {SYMBOLS.map(s => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className='only-up__field'>
                    <span>
                        <Localize i18n_default_text='Candle' />
                    </span>
                    <select value={granularity} onChange={e => setGranularity(Number(e.target.value))}>
                        {GRANULARITIES.map(g => (
                            <option key={g.value} value={g.value}>
                                {g.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className='only-up__field'>
                    <span>
                        <Localize i18n_default_text='Max dark green bars' />
                    </span>
                    <select value={max_dark_green_bars} onChange={e => setMaxDarkGreenBars(Number(e.target.value))}>
                        {[1, 2, 3, 4, 5].map(n => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </label>
                <label className='only-up__checkbox'>
                    <input
                        type='checkbox'
                        checked={stop_on_bad_market}
                        onChange={e => setStopOnBadMarket(e.target.checked)}
                    />
                    <Localize i18n_default_text='Stop bot when market turns bad' />
                </label>
                <button
                    type='button'
                    className={classNames('only-up__arm', { 'only-up__arm--active': is_armed })}
                    onClick={() => setIsArmed(v => !v)}
                >
                    {is_armed ? localize('Auto-run ON') : localize('Auto-run OFF')}
                </button>
            </div>

            <div className='only-up__status'>
                <div
                    className={classNames('only-up__verdict', {
                        'only-up__verdict--good': verdict.is_good,
                        'only-up__verdict--bad': !verdict.is_good,
                    })}
                >
                    <strong>{verdict.is_good ? localize('GOOD MARKET - TRADE UP') : localize('NO TRADE')}</strong>
                    <span>
                        {verdict.color ? `${COLOR_LABELS[verdict.color]} · ` : ''}
                        {verdict.reason}
                    </span>
                </div>
                <div className={classNames('only-up__countdown', { 'only-up__countdown--entry': is_entry_now })}>
                    <span>
                        <Localize i18n_default_text='Candle closes in' />
                    </span>
                    <strong>{seconds_left === null ? '--' : `${seconds_left}s`}</strong>
                    <small>
                        <Localize
                            i18n_default_text='Entry at {{seconds}}s left'
                            values={{ seconds: ENTRY_SECONDS_LEFT }}
                        />
                    </small>
                </div>
            </div>

            {error && <p className='only-up__error'>{error}</p>}

            <CandleMacdChart candles={candles} histogram={histogram} colors={colors} />

            <div className='only-up__log'>
                <h3>
                    <Localize i18n_default_text='Signal log' />
                </h3>
                {log.length === 0 ? (
                    <p className='only-up__log-empty'>
                        <Localize
                            i18n_default_text='Signals are checked at {{seconds}} seconds before each candle closes.'
                            values={{ seconds: ENTRY_SECONDS_LEFT }}
                        />
                    </p>
                ) : (
                    <ul>
                        {log.map(entry => (
                            <li key={entry.id}>
                                <span className='only-up__log-time'>{entry.time}</span>
                                <span
                                    className={classNames('only-up__log-verdict', {
                                        'only-up__log-verdict--good': entry.verdict.is_good,
                                    })}
                                >
                                    {entry.verdict.color ? COLOR_LABELS[entry.verdict.color] : '--'}
                                </span>
                                <span className='only-up__log-action'>{entry.action}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
});

export default OnlyUp;
