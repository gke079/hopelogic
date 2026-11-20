import { useEffect, useRef, useState } from 'react';
import chart_api from '@/external/bot-skeleton/services/api/chart-api';

export type TCandle = {
    epoch: number;
    open: number;
    high: number;
    low: number;
    close: number;
};

type TSubscription = {
    real_id: string | null;
    listener: { unsubscribe: () => void } | null;
};

const CANDLE_COUNT = 120;

const mergeCandle = (candles: TCandle[], candle: TCandle): TCandle[] => {
    if (!candles.length) return [candle];

    const last = candles[candles.length - 1];
    if (candle.epoch === last.epoch) {
        return [...candles.slice(0, -1), candle];
    }
    if (candle.epoch < last.epoch) return candles;

    const merged = [...candles, candle];
    return merged.length > CANDLE_COUNT ? merged.slice(merged.length - CANDLE_COUNT) : merged;
};

/**
 * Subscribes to candles for a symbol/granularity pair using the shared
 * chart API connection. Returns the rolling window of candles used by the
 * signal's candlestick chart and MACD calculation.
 */
export const useCandles = (symbol: string, granularity: number) => {
    const [candles, setCandles] = useState<TCandle[]>([]);
    const [is_loading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const subscription_ref = useRef<TSubscription | null>(null);
    const candles_ref = useRef<TCandle[]>([]);

    useEffect(() => {
        let is_current = true;
        candles_ref.current = [];
        setCandles([]);
        setIsLoading(true);
        setError('');

        const cleanupSubscription = () => {
            const subscription = subscription_ref.current;
            subscription_ref.current = null;
            if (!subscription) return;
            subscription.listener?.unsubscribe();
            if (subscription.real_id && chart_api.api) {
                try {
                    chart_api.api.send({ forget: subscription.real_id });
                } catch (forget_error) {
                    console.warn('Failed to forget candle subscription:', forget_error);
                }
            }
        };

        const subscribe = async () => {
            try {
                await chart_api.init();
                if (!is_current || !chart_api.api) return;

                const history_response = (await chart_api.api.send({
                    ticks_history: symbol,
                    adjust_start_time: 1,
                    count: CANDLE_COUNT,
                    end: 'latest',
                    style: 'candles',
                    granularity,
                })) as { candles?: TCandle[]; error?: { message: string } };

                if (!is_current) return;

                if (history_response?.error) {
                    throw new Error(history_response.error.message);
                }

                const history = (history_response?.candles || []).map(candle => ({
                    epoch: Number(candle.epoch),
                    open: Number(candle.open),
                    high: Number(candle.high),
                    low: Number(candle.low),
                    close: Number(candle.close),
                }));

                candles_ref.current = history;
                setCandles(history);
                setIsLoading(false);

                const subscription: TSubscription = { real_id: null, listener: null };
                subscription_ref.current = subscription;

                subscription.listener = chart_api.api.onMessage()?.subscribe(({ data }: { data: any }) => {
                    if (!is_current || !subscription.real_id) return;
                    if (data?.subscription?.id !== subscription.real_id) return;
                    if (data?.msg_type !== 'ohlc' || !data?.ohlc) return;

                    const update: TCandle = {
                        epoch: Number(data.ohlc.epoch),
                        open: Number(data.ohlc.open),
                        high: Number(data.ohlc.high),
                        low: Number(data.ohlc.low),
                        close: Number(data.ohlc.close),
                    };

                    candles_ref.current = mergeCandle(candles_ref.current, update);
                    setCandles(candles_ref.current);
                });

                const stream_response = (await chart_api.api.send({
                    ticks_history: symbol,
                    adjust_start_time: 1,
                    count: CANDLE_COUNT,
                    end: 'latest',
                    style: 'candles',
                    granularity,
                    subscribe: 1,
                })) as { subscription?: { id: string }; error?: { message: string } };

                if (!is_current) return;

                if (stream_response?.error) {
                    throw new Error(stream_response.error.message);
                }

                subscription.real_id = stream_response?.subscription?.id || null;
            } catch (subscribe_error) {
                if (!is_current) return;
                console.error('Failed to load candles:', subscribe_error);
                setError(subscribe_error instanceof Error ? subscribe_error.message : 'Failed to load candles');
                setIsLoading(false);
                cleanupSubscription();
            }
        };

        subscribe();

        return () => {
            is_current = false;
            cleanupSubscription();
        };
    }, [symbol, granularity]);

    return { candles, is_loading, error };
};
