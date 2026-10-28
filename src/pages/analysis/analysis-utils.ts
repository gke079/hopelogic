import { useEffect, useState } from 'react';
import { api_base } from '@/external/bot-skeleton';
import { localize } from '@deriv-com/translations';

export const SYMBOLS = [
    { value: 'R_10', label: 'Volatility 10 Index' },
    { value: 'R_25', label: 'Volatility 25 Index' },
    { value: 'R_50', label: 'Volatility 50 Index' },
    { value: 'R_75', label: 'Volatility 75 Index' },
    { value: 'R_100', label: 'Volatility 100 Index' },
    { value: '1HZ10V', label: 'Volatility 10 (1s) Index' },
    { value: '1HZ25V', label: 'Volatility 25 (1s) Index' },
    { value: '1HZ50V', label: 'Volatility 50 (1s) Index' },
    { value: '1HZ75V', label: 'Volatility 75 (1s) Index' },
    { value: '1HZ100V', label: 'Volatility 100 (1s) Index' },
];

export const TICK_COUNTS = [50, 100, 500, 1000];
export const MIN_TICKS = 50;
export const MAX_TICKS = 5000;
export const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
export const RECENT_DIGITS_SHOWN = 40;

export type TTickStream = {
    prices: number[];
    pip_size: number;
    error: string | null;
    is_loading: boolean;
};

export const getLastDigit = (price: number, pip_size: number) => Number(price.toFixed(pip_size).slice(-1));

export const percent = (part: number, total: number) => (total ? (part / total) * 100 : 0);

export const formatPercent = (value: number) => `${value.toFixed(1)}%`;

// Streams the latest `count` ticks for `symbol` over the shared bot WebSocket connection.
export const useTickStream = (symbol: string, count: number, is_connected: boolean): TTickStream => {
    const [state, setState] = useState<TTickStream>({ prices: [], pip_size: 2, error: null, is_loading: true });

    useEffect(() => {
        // The DerivAPI instance is loosely typed upstream; `send` resolves with the raw response.
        const api = api_base.api as any;
        if (!is_connected || !api) return undefined;

        let is_active = true;
        let subscription_id: string | null = null;
        setState(prev => ({ ...prev, prices: [], error: null, is_loading: true }));

        const message_subscription = api.onMessage().subscribe(({ data }: { data: any }) => {
            if (!is_active || data?.msg_type !== 'tick' || data.tick?.symbol !== symbol) return;
            const { quote, pip_size } = data.tick;
            setState(prev => ({
                ...prev,
                pip_size: pip_size ?? prev.pip_size,
                prices: [...prev.prices, Number(quote)].slice(-count),
            }));
        });

        const request = { ticks_history: symbol, count, end: 'latest', style: 'ticks' };
        const applyHistory = (response: any) => {
            if (!is_active) return;
            setState(prev => ({
                ...prev,
                pip_size: response.pip_size ?? prev.pip_size,
                prices: (response.history?.prices ?? []).map(Number).slice(-count),
                is_loading: false,
            }));
        };

        api.send({ ...request, subscribe: 1 })
            .then((response: any) => {
                if (response?.error) throw response;
                subscription_id = response.subscription?.id ?? null;
                if (!is_active && subscription_id) api.send({ forget: subscription_id }).catch(() => null);
                applyHistory(response);
            })
            .catch((response: any) => {
                // The chart may already hold a subscription for this symbol; its ticks still reach
                // our message listener, so only the history needs fetching.
                if (response?.error?.code === 'AlreadySubscribed') {
                    return api.send(request).then(applyHistory);
                }
                throw response;
            })
            .catch((response: any) => {
                if (!is_active) return;
                setState(prev => ({
                    ...prev,
                    is_loading: false,
                    error: response?.error?.message ?? localize('Unable to load market data.'),
                }));
            });

        return () => {
            is_active = false;
            message_subscription.unsubscribe();
            if (subscription_id) api.send({ forget: subscription_id }).catch(() => null);
        };
    }, [symbol, count, is_connected]);

    return state;
};

export type TDigitRank = 'most' | 'second-most' | 'second-least' | 'least' | null;

// Ranks each digit by how often it appears. Tied digits share a rank; when ranks
// overlap (few distinct counts) most > least > second most > second least.
export const rankDigits = (counts: number[]): TDigitRank[] => {
    const levels = [...new Set(counts)].sort((a, b) => b - a);
    if (levels.length < 2) return counts.map(() => null);
    const most = levels[0];
    const least = levels[levels.length - 1];
    const second_most = levels[1];
    const second_least = levels[levels.length - 2];
    return counts.map(count => {
        if (count === most) return 'most';
        if (count === least) return 'least';
        if (count === second_most) return 'second-most';
        if (count === second_least) return 'second-least';
        return null;
    });
};
