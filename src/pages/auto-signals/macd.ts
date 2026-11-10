export type TCandle = {
    epoch: number; // candle open time (seconds)
    open: number;
    high: number;
    low: number;
    close: number;
};

export type THistogramColor = 'dark_green' | 'faded_green' | 'faded_red' | 'dark_red';

export type TMacdPoint = {
    macd: number;
    signal: number;
    histogram: number;
};

export type TSignalVerdict = {
    is_good: boolean;
    color: THistogramColor | null;
    dark_green_streak: number;
    reason: string;
};

export const MACD_FAST = 12;
export const MACD_SLOW = 26;
export const MACD_SIGNAL = 9;

export const ema = (values: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    const result: number[] = [];
    values.forEach((value, i) => {
        result.push(i === 0 ? value : value * k + result[i - 1] * (1 - k));
    });
    return result;
};

export const calculateMacd = (
    closes: number[],
    fast = MACD_FAST,
    slow = MACD_SLOW,
    signal_period = MACD_SIGNAL
): TMacdPoint[] => {
    if (!closes.length) return [];
    const fast_ema = ema(closes, fast);
    const slow_ema = ema(closes, slow);
    const macd_line = closes.map((_, i) => fast_ema[i] - slow_ema[i]);
    const signal_line = ema(macd_line, signal_period);
    return macd_line.map((macd, i) => ({ macd, signal: signal_line[i], histogram: macd - signal_line[i] }));
};

/**
 * Standard MACD histogram colouring:
 * - dark green:  above zero and rising
 * - faded green: above zero and falling
 * - faded red:   below zero and rising (sellers losing strength)
 * - dark red:    below zero and falling
 */
export const getHistogramColor = (current: number, previous: number): THistogramColor => {
    if (current >= 0) return current > previous ? 'dark_green' : 'faded_green';
    return current > previous ? 'faded_red' : 'dark_red';
};

export const getHistogramColors = (histogram: number[]): (THistogramColor | null)[] =>
    histogram.map((value, i) => (i === 0 ? null : getHistogramColor(value, histogram[i - 1])));

/**
 * ONLY UP rule: trade only when the latest histogram bar is faded red, or dark green
 * that is still "short" (at most `max_dark_green_bars` dark green bars in a row).
 * Faded green, dark red, and long dark green runs are not traded.
 */
export const evaluateOnlyUp = (histogram: number[], max_dark_green_bars: number): TSignalVerdict => {
    const colors = getHistogramColors(histogram);
    const color = colors[colors.length - 1] ?? null;

    let dark_green_streak = 0;
    for (let i = colors.length - 1; i >= 0 && colors[i] === 'dark_green'; i--) dark_green_streak++;

    if (!color) {
        return { is_good: false, color, dark_green_streak, reason: 'Not enough candles yet' };
    }
    if (color === 'faded_red') {
        return { is_good: true, color, dark_green_streak, reason: 'Faded red histogram: selling pressure fading' };
    }
    if (color === 'dark_green') {
        if (dark_green_streak <= max_dark_green_bars) {
            return { is_good: true, color, dark_green_streak, reason: 'Short dark green histogram: fresh upward push' };
        }
        return {
            is_good: false,
            color,
            dark_green_streak,
            reason: 'Dark green run is too long: move may be over-extended',
        };
    }
    if (color === 'faded_green') {
        return { is_good: false, color, dark_green_streak, reason: 'Faded green histogram: no trade' };
    }
    return { is_good: false, color, dark_green_streak, reason: 'Dark red histogram: market still falling' };
};
