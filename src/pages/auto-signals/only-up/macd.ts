export type TMacdColour = 'dark_green' | 'faded_green' | 'faded_red' | 'dark_red';

export const MACD_FAST_PERIOD = 12;
export const MACD_SLOW_PERIOD = 26;
export const MACD_SIGNAL_PERIOD = 9;

export const DEFAULT_MAX_DARK_GREEN_RUN = 2;
export const MIN_MAX_DARK_GREEN_RUN = 1;
export const MAX_MAX_DARK_GREEN_RUN = 5;

export const SECONDS_BEFORE_CLOSE = 7;

export const calculateEMA = (values: number[], period: number): number[] => {
    if (period <= 0 || values.length < period) return [];

    const k = 2 / (period + 1);
    const emas: number[] = [];
    let previous = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
    emas.push(previous);

    for (let i = period; i < values.length; i++) {
        previous = values[i] * k + previous * (1 - k);
        emas.push(previous);
    }

    return emas;
};

export const calculateMACDHistogram = (closes: number[]): number[] => {
    const fast = calculateEMA(closes, MACD_FAST_PERIOD);
    const slow = calculateEMA(closes, MACD_SLOW_PERIOD);

    if (!fast.length || !slow.length) return [];

    // fast[i] corresponds to closes[i + MACD_FAST_PERIOD - 1] and
    // slow[i] to closes[i + MACD_SLOW_PERIOD - 1], so align on the slow series.
    const offset = MACD_SLOW_PERIOD - MACD_FAST_PERIOD;
    const macd_line = slow.map((slow_value, i) => fast[i + offset] - slow_value);
    const signal_line = calculateEMA(macd_line, MACD_SIGNAL_PERIOD);

    if (!signal_line.length) return [];

    const signal_offset = macd_line.length - signal_line.length;

    return signal_line.map((signal_value, i) => macd_line[i + signal_offset] - signal_value);
};

export const classifyHistogram = (histogram: number[]): TMacdColour[] => {
    const colours: TMacdColour[] = [];

    histogram.forEach((value, i) => {
        const previous = i > 0 ? histogram[i - 1] : value;
        const is_rising = value > previous;

        if (value > 0) {
            colours.push(is_rising ? 'dark_green' : 'faded_green');
        } else if (value < 0) {
            colours.push(is_rising ? 'faded_red' : 'dark_red');
        } else {
            colours.push(previous > 0 ? 'faded_green' : 'dark_red');
        }
    });

    return colours;
};

export const getDarkGreenRunLength = (colours: TMacdColour[], index: number): number => {
    let run = 0;
    for (let i = index; i >= 0 && colours[i] === 'dark_green'; i--) {
        run++;
    }
    return run;
};

export type TEvaluatedSignal = {
    colour: TMacdColour;
    dark_green_run: number;
    is_good: boolean;
    reason: string;
};

export const evaluateSignal = (histogram: number[], max_dark_green_run = DEFAULT_MAX_DARK_GREEN_RUN): TEvaluatedSignal | null => {
    if (!histogram.length) return null;

    const colours = classifyHistogram(histogram);
    const last_index = colours.length - 1;
    const colour = colours[last_index];
    const dark_green_run = getDarkGreenRunLength(colours, last_index);

    if (colour === 'faded_red') {
        return { colour, dark_green_run, is_good: true, reason: 'Faded red histogram — good market for an up trade' };
    }

    if (colour === 'dark_green' && dark_green_run <= max_dark_green_run) {
        return {
            colour,
            dark_green_run,
            is_good: true,
            reason: `Short dark green run (${dark_green_run} of max ${max_dark_green_run}) — good market for an up trade`,
        };
    }

    if (colour === 'faded_green') {
        return { colour, dark_green_run, is_good: false, reason: 'Faded green histogram — no trade' };
    }

    if (colour === 'dark_green') {
        return {
            colour,
            dark_green_run,
            is_good: false,
            reason: `Dark green run too long (${dark_green_run} > max ${max_dark_green_run}) — no trade`,
        };
    }

    return { colour, dark_green_run, is_good: false, reason: 'Dark red histogram — no trade' };
};
