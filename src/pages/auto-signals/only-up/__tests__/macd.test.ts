import {
    calculateEMA,
    calculateMACDHistogram,
    classifyHistogram,
    evaluateSignal,
    getDarkGreenRunLength,
} from '../macd';

describe('MACD calculations', () => {
    it('returns an empty series when there is not enough data', () => {
        expect(calculateEMA([1, 2, 3], 5)).toEqual([]);
        expect(calculateMACDHistogram([1, 2, 3])).toEqual([]);
    });

    it('produces an EMA series with the expected length', () => {
        const emas = calculateEMA([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5);
        expect(emas).toHaveLength(6);
    });

    it('produces a histogram aligned to the slow EMA series', () => {
        const closes = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 5) * 10);
        const histogram = calculateMACDHistogram(closes);
        expect(histogram.length).toBeGreaterThan(0);
        histogram.forEach(value => expect(Number.isFinite(value)).toBe(true));
    });
});

describe('MACD histogram colours', () => {
    it('marks rising positive bars dark green', () => {
        // The first bar has no previous bar to compare against, so it is not
        // treated as rising; the bars after it are.
        expect(classifyHistogram([1, 2, 3])).toEqual(['faded_green', 'dark_green', 'dark_green']);
    });

    it('marks falling positive bars faded green', () => {
        expect(classifyHistogram([3, 2, 1])).toEqual(['faded_green', 'faded_green', 'faded_green']);
    });

    it('marks rising negative bars faded red', () => {
        expect(classifyHistogram([-3, -2, -1])).toEqual(['dark_red', 'faded_red', 'faded_red']);
    });

    it('marks falling negative bars dark red', () => {
        expect(classifyHistogram([-1, -2, -3])).toEqual(['dark_red', 'dark_red', 'dark_red']);
    });

    it('handles transitions across zero', () => {
        const colours = classifyHistogram([-2, -1, 1, 0.5, -0.5, -1]);
        expect(colours).toEqual(['dark_red', 'faded_red', 'dark_green', 'faded_green', 'dark_red', 'dark_red']);
    });
});

describe('dark green run length', () => {
    it('counts consecutive dark green bars ending at the index', () => {
        const colours = ['faded_red', 'dark_green', 'dark_green', 'faded_green'] as const;
        expect(getDarkGreenRunLength([...colours], 2)).toBe(2);
        expect(getDarkGreenRunLength([...colours], 1)).toBe(1);
        expect(getDarkGreenRunLength([...colours], 3)).toBe(0);
    });
});

describe('signal evaluation', () => {
    it('treats a faded red latest bar as a good market', () => {
        const signal = evaluateSignal([-3, -2]);
        expect(signal?.is_good).toBe(true);
        expect(signal?.colour).toBe('faded_red');
    });

    it('treats a short dark green run as a good market', () => {
        const signal = evaluateSignal([0, 1, 2], 2);
        expect(signal?.is_good).toBe(true);
        expect(signal?.colour).toBe('dark_green');
        expect(signal?.dark_green_run).toBe(2);
    });

    it('rejects a dark green run longer than the limit', () => {
        const signal = evaluateSignal([0, 1, 2, 3], 2);
        expect(signal?.is_good).toBe(false);
        expect(signal?.dark_green_run).toBe(3);
    });

    it('never trades a faded green bar', () => {
        const signal = evaluateSignal([3, 2]);
        expect(signal?.is_good).toBe(false);
        expect(signal?.colour).toBe('faded_green');
    });

    it('never trades a dark red bar', () => {
        const signal = evaluateSignal([-1, -2]);
        expect(signal?.is_good).toBe(false);
        expect(signal?.colour).toBe('dark_red');
    });

    it('returns null without data', () => {
        expect(evaluateSignal([])).toBeNull();
    });
});
