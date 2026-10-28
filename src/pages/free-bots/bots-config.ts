// Ready-made strategies shown on the Bots tab. To add your own bot, drop its
// exported .xml file into src/external/bot-skeleton/examples/xml-examples (or
// anywhere under src/) and add an entry below pointing at it.
export type TBotCategory = 'Digits' | 'Rise/Fall' | 'Risk management';

export type TFreeBot = {
    id: string;
    name: string;
    description: string;
    category: TBotCategory;
    market: string;
    loadXml: () => Promise<{ default: string }>;
};

export const FREE_BOTS: TFreeBot[] = [
    {
        id: 'alternate-even-odd',
        name: 'Even/Odd Alternator',
        description: 'Switches between Even and Odd digit contracts after every trade on Volatility 100.',
        category: 'Digits',
        market: 'Volatility 100 Index',
        loadXml: () => import('@/external/bot-skeleton/examples/xml-examples/misc/Alternate Even-Odd.xml'),
    },
    {
        id: 'martingale-even-odd',
        name: 'Even/Odd Martingale',
        description: 'Alternates Even/Odd and doubles the stake after a loss to recover with the next win.',
        category: 'Digits',
        market: 'Volatility 100 Index',
        loadXml: () => import('@/external/bot-skeleton/examples/xml-examples/misc/martingale_alternate_even_odd.xml'),
    },
    {
        id: 'last-digit-prediction',
        name: 'Last Digit Predictor',
        description: 'Uses the last digit of the previous tick as the prediction for the next Matches/Differs trade.',
        category: 'Digits',
        market: 'Volatility 100 Index',
        loadXml: () =>
            import('@/external/bot-skeleton/examples/xml-examples/random/Use last digit in trade definition.xml'),
    },
    {
        id: 'rsi-call-put',
        name: 'RSI Rise/Fall',
        description: 'Buys Rise when RSI signals oversold and Fall when it signals overbought.',
        category: 'Rise/Fall',
        market: 'Volatility 100 Index',
        loadXml: () => import('@/external/bot-skeleton/examples/xml-examples/misc/rsi call put.xml'),
    },
    {
        id: 'moving-average',
        name: 'Moving Average Trend',
        description: 'Follows the trend by comparing the current price with a simple moving average.',
        category: 'Rise/Fall',
        market: 'Volatility 100 Index',
        loadXml: () => import('@/external/bot-skeleton/examples/xml-examples/misc/moving-average-example.xml'),
    },
    {
        id: 'three-line-strike',
        name: 'Three Line Strike',
        description: 'Trades a reversal after three consecutive candles move in the same direction.',
        category: 'Rise/Fall',
        market: 'Volatility 100 Index',
        loadXml: () => import('@/external/bot-skeleton/examples/xml-examples/misc/simple_three_line_strike.xml'),
    },
    {
        id: 'great-martingale',
        name: 'Great Martingale',
        description: 'Rise/Fall bot that multiplies the stake after each loss and resets after a win.',
        category: 'Risk management',
        market: 'Volatility 100 Index',
        loadXml: () => import('@/external/bot-skeleton/examples/xml-examples/misc/Great Martingale.xml'),
    },
    {
        id: 'martingale-reset-5-losses',
        name: 'Martingale with Safety Reset',
        description: 'Martingale that returns to the initial stake after five losses in a row to cap risk.',
        category: 'Risk management',
        market: 'Volatility 100 Index',
        loadXml: () => import('@/external/bot-skeleton/examples/xml-examples/random/reset_martingale_after_5_loss.xml'),
    },
    {
        id: 'dalembert',
        name: "D'Alembert",
        description: 'Raises the stake by one unit after a loss and lowers it by one unit after a win.',
        category: 'Risk management',
        market: 'Volatility 100 Index',
        loadXml: () => import('@/external/bot-skeleton/examples/xml-examples/random/dalembert_predefined_params.xml'),
    },
];
