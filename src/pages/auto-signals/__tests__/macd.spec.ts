import { calculateMacd, evaluateOnlyUp, getHistogramColor } from '../macd';

describe('MACD histogram colours', () => {
    it('classifies the four histogram states', () => {
        expect(getHistogramColor(2, 1)).toBe('dark_green');
        expect(getHistogramColor(1, 2)).toBe('faded_green');
        expect(getHistogramColor(-1, -2)).toBe('faded_red');
        expect(getHistogramColor(-2, -1)).toBe('dark_red');
    });
});

describe('evaluateOnlyUp', () => {
    it('trades faded red', () => {
        expect(evaluateOnlyUp([-3, -2], 2).is_good).toBe(true);
    });

    it('trades short dark green but not long dark green runs', () => {
        expect(evaluateOnlyUp([-1, 0.5, 1], 2).is_good).toBe(true);
        expect(evaluateOnlyUp([-1, 0.5, 1, 2], 2).is_good).toBe(false);
    });

    it('does not trade faded green or dark red', () => {
        expect(evaluateOnlyUp([2, 1], 2).is_good).toBe(false);
        expect(evaluateOnlyUp([-1, -2], 2).is_good).toBe(false);
    });

    it('needs at least two bars', () => {
        expect(evaluateOnlyUp([1], 2).is_good).toBe(false);
    });
});

describe('calculateMacd', () => {
    it('returns a point per close and a flat histogram for flat prices', () => {
        const result = calculateMacd(Array(40).fill(100));
        expect(result).toHaveLength(40);
        expect(result.every(p => p.histogram === 0)).toBe(true);
    });
});
