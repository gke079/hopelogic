import { useCallback, useEffect, useRef, useState } from 'react';
import chart_api from '@/external/bot-skeleton/services/api/chart-api';
import { TCandle } from './macd';

const MAX_CANDLES = 200;

const toCandle = (c: Record<string, string | number>): TCandle => ({
    epoch: Number(c.open_time ?? c.epoch),
    open: Number(c.open),
    high: Number(c.high),
    low: Number(c.low),
    close: Number(c.close),
});

/**
 * Loads candle history for a symbol and keeps it updated from the live `ohlc` stream.
 * Also tracks the offset between the server clock and the local clock so the
 * candle countdown is accurate.
 */
export const useCandles = (symbol: string, granularity: number) => {
    const [candles, setCandles] = useState<TCandle[]>([]);
    const [error, setError] = useState<string | null>(null);
    const server_offset = useRef(0);

    useEffect(() => {
        let cancelled = false;
        let message_subscription: { unsubscribe: () => void } | undefined;
        let subscription_id: string | undefined;

        setCandles([]);
        setError(null);

        const upsert = (candle: TCandle) =>
            setCandles(prev => {
                if (!prev.length) return prev;
                const last = prev[prev.length - 1];
                if (candle.epoch < last.epoch) return prev;
                if (candle.epoch === last.epoch) return [...prev.slice(0, -1), candle];
                return [...prev, candle].slice(-MAX_CANDLES);
            });

        (async () => {
            try {
                if (!chart_api.api) await chart_api.init();
                const api = chart_api.api;
                if (!api || cancelled) return;

                message_subscription = api.onMessage().subscribe(({ data }: { data: any }) => {
                    if (data?.msg_type !== 'ohlc' || !data.ohlc) return;
                    const { ohlc } = data;
                    if (ohlc.symbol !== symbol || Number(ohlc.granularity) !== granularity) return;
                    server_offset.current = Number(ohlc.epoch) - Date.now() / 1000;
                    upsert(toCandle(ohlc));
                });

                const request: Record<string, unknown> = {
                    ticks_history: symbol,
                    style: 'candles',
                    granularity,
                    count: MAX_CANDLES,
                    end: 'latest',
                    adjust_start_time: 1,
                    subscribe: 1,
                };

                let response: any = await api.send(request).catch((e: any) => e);
                // The chart may already be streaming this symbol on the shared connection;
                // the ohlc messages still arrive, so just fetch the history.
                if (response?.error?.code === 'AlreadySubscribed') {
                    delete request.subscribe;
                    response = await api.send(request).catch((e: any) => e);
                }
                if (cancelled) {
                    if (response?.subscription?.id) api.send({ forget: response.subscription.id }).catch(() => {});
                    return;
                }
                if (response?.error) {
                    setError(response.error.message || 'Could not load candles');
                    return;
                }
                subscription_id = response?.subscription?.id;
                const history: TCandle[] = (response?.candles ?? []).map(toCandle);
                setCandles(prev => {
                    // Keep any stream update that arrived before the history response
                    const latest = prev[prev.length - 1];
                    if (latest && history.length && latest.epoch >= history[history.length - 1].epoch) {
                        return [...history.filter(c => c.epoch < latest.epoch), latest].slice(-MAX_CANDLES);
                    }
                    return history;
                });
            } catch (e: any) {
                if (!cancelled) setError(e?.message || 'Could not load candles');
            }
        })();

        return () => {
            cancelled = true;
            message_subscription?.unsubscribe();
            if (subscription_id) chart_api.api?.send({ forget: subscription_id }).catch(() => {});
        };
    }, [symbol, granularity]);

    const getServerNow = useCallback(() => Date.now() / 1000 + server_offset.current, []);

    return { candles, error, getServerNow };
};
