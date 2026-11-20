import React, { useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import Checkbox from '@/components/shared_ui/checkbox';
import SelectNative from '@/components/shared_ui/select-native';
import Text from '@/components/shared_ui/text';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import CandlestickChart from './candlestick-chart';
import {
    DEFAULT_MAX_DARK_GREEN_RUN,
    SECONDS_BEFORE_CLOSE,
    calculateMACDHistogram,
    classifyHistogram,
    evaluateSignal,
} from './macd';
import MacdStrip from './macd-strip';
import { useCandles } from './use-candles';

type TLogEntry = {
    epoch: number;
    time: string;
    reason: string;
    action: string;
};

const VOLATILITY_MARKETS = [
    { text: 'Volatility 10 Index', value: 'R_10' },
    { text: 'Volatility 25 Index', value: 'R_25' },
    { text: 'Volatility 50 Index', value: 'R_50' },
    { text: 'Volatility 75 Index', value: 'R_75' },
    { text: 'Volatility 100 Index', value: 'R_100' },
    { text: 'Volatility 10 (1s) Index', value: '1HZ10V' },
    { text: 'Volatility 25 (1s) Index', value: '1HZ25V' },
    { text: 'Volatility 50 (1s) Index', value: '1HZ50V' },
    { text: 'Volatility 75 (1s) Index', value: '1HZ75V' },
    { text: 'Volatility 100 (1s) Index', value: '1HZ100V' },
];

const CANDLE_LENGTHS = [1, 2, 3, 5, 10, 15].map(minutes => ({
    text: localize('{{minutes}} min', { minutes }),
    value: String(minutes),
}));

const DARK_GREEN_RUN_LIMITS = [1, 2, 3, 4, 5].map(limit => ({
    text: localize('{{limit}} candles', { limit }),
    value: String(limit),
}));

const OnlyUp = observer(() => {
    const { common, run_panel } = useStore();
    const [symbol, setSymbol] = useState(VOLATILITY_MARKETS[0].value);
    const [candle_minutes, setCandleMinutes] = useState(1);
    const [max_dark_green_run, setMaxDarkGreenRun] = useState(DEFAULT_MAX_DARK_GREEN_RUN);
    const [is_auto_run, setIsAutoRun] = useState(false);
    const [should_stop_on_bad_market, setShouldStopOnBadMarket] = useState(true);
    const [log, setLog] = useState<TLogEntry[]>([]);
    const [last_evaluation, setLastEvaluation] = useState<{ epoch: number; reason: string; is_good: boolean } | null>(
        null
    );

    const last_evaluated_epoch_ref = useRef<number>(0);
    const started_by_signal_ref = useRef(false);

    const { candles, is_loading, error } = useCandles(symbol, candle_minutes * 60);

    const granularity_seconds = candle_minutes * 60;
    const server_time = common.server_time;
    const now_epoch = server_time ? server_time.unix() : Math.floor(Date.now() / 1000);
    const candle_start = Math.floor(now_epoch / granularity_seconds) * granularity_seconds;
    const candle_end = candle_start + granularity_seconds;
    const seconds_remaining = Math.max(candle_end - now_epoch, 0);

    const closes = useMemo(() => candles.map(candle => candle.close), [candles]);
    const histogram = useMemo(() => calculateMACDHistogram(closes), [closes]);
    const preview_signal = useMemo(() => evaluateSignal(histogram, max_dark_green_run), [histogram, max_dark_green_run]);

    const addLog = (reason: string, action: string, epoch: number) => {
        const time = server_time ? server_time.format('HH:mm:ss') : new Date().toLocaleTimeString();
        setLog(previous => [{ epoch, time, reason, action }, ...previous].slice(0, 30));
    };

    useEffect(() => {
        if (!candles.length || error) return;
        if (seconds_remaining > SECONDS_BEFORE_CLOSE) return;
        if (last_evaluated_epoch_ref.current === candle_start) return;
        last_evaluated_epoch_ref.current = candle_start;

        const signal = evaluateSignal(histogram, max_dark_green_run);
        if (!signal) return;

        setLastEvaluation({ epoch: candle_start, reason: signal.reason, is_good: signal.is_good });

        let action = localize('No action');

        if (is_auto_run) {
            if (signal.is_good && !run_panel.is_running) {
                started_by_signal_ref.current = true;
                action = localize('Pressed Run');
                run_panel.onRunButtonClick();
            } else if (
                !signal.is_good &&
                run_panel.is_running &&
                started_by_signal_ref.current &&
                should_stop_on_bad_market
            ) {
                started_by_signal_ref.current = false;
                action = localize('Stopped bot');
                run_panel.onStopBotClick();
            }
        }

        addLog(signal.reason, action, candle_start);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seconds_remaining, candle_start, candles, histogram, max_dark_green_run, is_auto_run, should_stop_on_bad_market]);

    useEffect(() => () => setLog([]), []);

    const colours = classifyHistogram(histogram);
    const latest_colour = colours[colours.length - 1];
    const is_good_market = preview_signal?.is_good ?? false;
    const has_evaluation_for_current_candle = last_evaluation?.epoch === candle_start;

    return (
        <div className='only-up'>
            <div className='only-up__description'>
                <Text as='p' size='xs' color='less-prominent' lineHeight='s'>
                    {localize(
                        'Watches the market with candlesticks and the MACD histogram. A good market is when the histogram is faded red or a short dark green run. Entry is checked 7 seconds before the candle closes.'
                    )}
                </Text>
            </div>
            <div className='only-up__controls'>
                <div className='only-up__control'>
                    <Text as='label' size='xxs' color='less-prominent'>
                        {localize('Market')}
                    </Text>
                    <SelectNative
                        value={symbol}
                        list_items={VOLATILITY_MARKETS}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSymbol(e.target.value)}
                    />
                </div>
                <div className='only-up__control'>
                    <Text as='label' size='xxs' color='less-prominent'>
                        {localize('Candle length')}
                    </Text>
                    <SelectNative
                        value={String(candle_minutes)}
                        list_items={CANDLE_LENGTHS}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCandleMinutes(Number(e.target.value))}
                    />
                </div>
                <div className='only-up__control'>
                    <Text as='label' size='xxs' color='less-prominent'>
                        {localize('Max dark green run')}
                    </Text>
                    <SelectNative
                        value={String(max_dark_green_run)}
                        list_items={DARK_GREEN_RUN_LIMITS}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMaxDarkGreenRun(Number(e.target.value))}
                    />
                </div>
                <div className='only-up__toggles'>
                    <Checkbox
                        label={localize('Auto-run on good market')}
                        value={is_auto_run}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsAutoRun(e.target.checked)}
                    />
                    <Checkbox
                        label={localize('Stop bot when the market turns bad')}
                        value={should_stop_on_bad_market}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShouldStopOnBadMarket(e.target.checked)}
                    />
                </div>
            </div>
            <div
                className={classNames('only-up__banner', {
                    'only-up__banner--good': is_good_market,
                    'only-up__banner--bad': !is_good_market,
                })}
            >
                <Text as='p' size='s' weight='bold' color='colored-background'>
                    {is_loading
                        ? localize('Loading candles...')
                        : error
                          ? error
                          : is_good_market
                            ? localize('Good market — ready for an up trade')
                            : localize('No trade')}
                </Text>
                <Text as='p' size='xxs' color='colored-background'>
                    {has_evaluation_for_current_candle && last_evaluation
                        ? last_evaluation.reason
                        : (preview_signal?.reason ?? localize('Waiting for enough candles...'))}
                </Text>
                <Text as='p' size='xxs' color='colored-background'>
                    {localize('Next candle closes in {{seconds}}s', { seconds: seconds_remaining })}
                </Text>
            </div>
            <div className='only-up__charts'>
                {is_loading ? (
                    <Text as='p' size='xs' color='less-prominent'>
                        {localize('Please wait, loading candles...')}
                    </Text>
                ) : (
                    <>
                        <CandlestickChart candles={candles} />
                        <MacdStrip histogram={histogram} />
                    </>
                )}
            </div>
            <div className='only-up__legend'>
                <span className='only-up__legend-item'>
                    <span className='only-up__swatch only-up__swatch--dark-green' />
                    {localize('Dark green (above zero, rising)')}
                </span>
                <span className='only-up__legend-item'>
                    <span className='only-up__swatch only-up__swatch--faded-green' />
                    {localize('Faded green — never traded')}
                </span>
                <span className='only-up__legend-item'>
                    <span className='only-up__swatch only-up__swatch--faded-red' />
                    {localize('Faded red — good market')}
                </span>
                <span className='only-up__legend-item'>
                    <span className='only-up__swatch only-up__swatch--dark-red' />
                    {localize('Dark red (below zero, falling)')}
                </span>
            </div>
            <div className='only-up__log'>
                <Text as='h3' size='xs' weight='bold' color='prominent'>
                    {localize('Signal checks')}
                </Text>
                {!log.length && (
                    <Text as='p' size='xxs' color='less-prominent'>
                        {localize('Checks appear here as each candle approaches its close.')}
                    </Text>
                )}
                {!!log.length && (
                    <ul className='only-up__log-list'>
                        {log.map(entry => (
                            <li key={`${entry.epoch}-${entry.time}`} className='only-up__log-entry'>
                                <span className='only-up__log-time'>{entry.time}</span>
                                <span className='only-up__log-reason'>{entry.reason}</span>
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
