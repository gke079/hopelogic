import React, { useMemo, useState } from 'react';
import classNames from 'classnames';
import { Localize, localize } from '@deriv-com/translations';
import {
    DIGITS,
    formatPercent,
    getLastDigit,
    percent,
    RECENT_DIGITS_SHOWN,
    SYMBOLS,
    TICK_COUNTS,
    TTickStream,
} from './analysis-utils';

type TSplitBarProps = {
    left_label: string;
    right_label: string;
    left_value: number;
    right_value: number;
};

const SplitBar = ({ left_label, right_label, left_value, right_value }: TSplitBarProps) => {
    const total = left_value + right_value;
    const left_percent = percent(left_value, total);
    const right_percent = total ? 100 - left_percent : 0;
    return (
        <div className='analysis__split'>
            <div className='analysis__split-labels'>
                <span>
                    {left_label} <strong>{formatPercent(left_percent)}</strong>
                </span>
                <span>
                    <strong>{formatPercent(right_percent)}</strong> {right_label}
                </span>
            </div>
            <div className='analysis__split-track'>
                <div className='analysis__split-left' style={{ width: `${left_percent}%` }} />
                <div className='analysis__split-right' style={{ width: `${right_percent}%` }} />
            </div>
        </div>
    );
};

export type TAnalysisViewProps = {
    symbol: string;
    onSymbolChange: (symbol: string) => void;
    tick_count: number;
    onTickCountChange: (count: number) => void;
    stream: TTickStream;
};

const GraphicalAnalysis = ({ symbol, onSymbolChange, tick_count, onTickCountChange, stream }: TAnalysisViewProps) => {
    const [barrier, setBarrier] = useState(4);
    const { prices, pip_size, is_loading } = stream;
    // The Circle view accepts any window size, so keep its value selectable here too.
    const tick_options = TICK_COUNTS.includes(tick_count)
        ? TICK_COUNTS
        : [...TICK_COUNTS, tick_count].sort((a, b) => a - b);

    const stats = useMemo(() => {
        const digits = prices.map(price => getLastDigit(price, pip_size));
        const counts = DIGITS.map(digit => digits.filter(d => d === digit).length);
        const even = digits.filter(d => d % 2 === 0).length;
        const over = digits.filter(d => d > barrier).length;
        const under = digits.filter(d => d < barrier).length;
        let rise = 0;
        let fall = 0;
        for (let i = 1; i < prices.length; i++) {
            if (prices[i] > prices[i - 1]) rise++;
            else if (prices[i] < prices[i - 1]) fall++;
        }
        const max_count = Math.max(...counts);
        const min_count = Math.min(...counts);
        return {
            digits,
            counts,
            even,
            odd: digits.length - even,
            over,
            under,
            rise,
            fall,
            max_count,
            min_count,
            most_frequent: counts.indexOf(max_count),
            least_frequent: counts.indexOf(min_count),
        };
    }, [prices, pip_size, barrier]);

    const total = stats.digits.length;
    const last_price = prices[prices.length - 1];
    const last_digit = stats.digits[stats.digits.length - 1];
    const has_data = total > 0;

    return (
        <div className='analysis__view'>
            <div className='analysis__header'>
                <div>
                    <h2 className='analysis__title'>
                        <Localize i18n_default_text='Graphical analysis' />
                    </h2>
                    <p className='analysis__subtitle'>
                        <Localize i18n_default_text='Live last-digit and direction statistics to help you pick a strategy.' />
                    </p>
                </div>
                <div className='analysis__controls'>
                    <label className='analysis__control'>
                        <span>
                            <Localize i18n_default_text='Market' />
                        </span>
                        <select value={symbol} onChange={e => onSymbolChange(e.target.value)}>
                            {SYMBOLS.map(item => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className='analysis__control'>
                        <span>
                            <Localize i18n_default_text='Ticks' />
                        </span>
                        <select value={tick_count} onChange={e => onTickCountChange(Number(e.target.value))}>
                            {tick_options.map(item => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            <div className='analysis__summary'>
                <div className='analysis__stat'>
                    <span className='analysis__stat-label'>
                        <Localize i18n_default_text='Current price' />
                    </span>
                    <span className='analysis__stat-value'>{has_data ? last_price.toFixed(pip_size) : '—'}</span>
                </div>
                <div className='analysis__stat'>
                    <span className='analysis__stat-label'>
                        <Localize i18n_default_text='Last digit' />
                    </span>
                    <span className='analysis__stat-value'>{has_data ? last_digit : '—'}</span>
                </div>
                <div className='analysis__stat'>
                    <span className='analysis__stat-label'>
                        <Localize i18n_default_text='Most frequent' />
                    </span>
                    <span className='analysis__stat-value analysis__stat-value--high'>
                        {has_data ? stats.most_frequent : '—'}
                    </span>
                </div>
                <div className='analysis__stat'>
                    <span className='analysis__stat-label'>
                        <Localize i18n_default_text='Least frequent' />
                    </span>
                    <span className='analysis__stat-value analysis__stat-value--low'>
                        {has_data ? stats.least_frequent : '—'}
                    </span>
                </div>
                <div className='analysis__stat'>
                    <span className='analysis__stat-label'>
                        <Localize i18n_default_text='Ticks analysed' />
                    </span>
                    <span className='analysis__stat-value'>{total}</span>
                </div>
            </div>

            <div className='analysis__grid'>
                <section className='analysis__card analysis__card--wide'>
                    <h3 className='analysis__card-title'>
                        <Localize i18n_default_text='Last digit distribution' />
                    </h3>
                    <div className='analysis__digits'>
                        {DIGITS.map(digit => {
                            const count = stats.counts[digit];
                            const value = percent(count, total);
                            const height = stats.max_count ? (count / stats.max_count) * 100 : 0;
                            return (
                                <div
                                    key={digit}
                                    className={classNames('analysis__digit', {
                                        'analysis__digit--high': has_data && count === stats.max_count,
                                        'analysis__digit--low': has_data && count === stats.min_count,
                                        'analysis__digit--current': has_data && digit === last_digit,
                                    })}
                                    title={`${digit}: ${count} ticks`}
                                >
                                    <span className='analysis__digit-percent'>{formatPercent(value)}</span>
                                    <div className='analysis__digit-track'>
                                        <div className='analysis__digit-bar' style={{ height: `${height}%` }} />
                                    </div>
                                    <span className='analysis__digit-label'>{digit}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className='analysis__legend'>
                        <span className='analysis__legend-item analysis__legend-item--high'>
                            <Localize i18n_default_text='Most frequent' />
                        </span>
                        <span className='analysis__legend-item analysis__legend-item--low'>
                            <Localize i18n_default_text='Least frequent' />
                        </span>
                        <span className='analysis__legend-item analysis__legend-item--current'>
                            <Localize i18n_default_text='Current digit' />
                        </span>
                    </div>
                </section>

                <section className='analysis__card'>
                    <h3 className='analysis__card-title'>
                        <Localize i18n_default_text='Even / Odd' />
                    </h3>
                    <SplitBar
                        left_label={localize('Even')}
                        right_label={localize('Odd')}
                        left_value={stats.even}
                        right_value={stats.odd}
                    />
                </section>

                <section className='analysis__card'>
                    <h3 className='analysis__card-title'>
                        <Localize i18n_default_text='Rise / Fall' />
                    </h3>
                    <SplitBar
                        left_label={localize('Rise')}
                        right_label={localize('Fall')}
                        left_value={stats.rise}
                        right_value={stats.fall}
                    />
                </section>

                <section className='analysis__card'>
                    <div className='analysis__card-header'>
                        <h3 className='analysis__card-title'>
                            <Localize i18n_default_text='Over / Under' />
                        </h3>
                        <label className='analysis__control analysis__control--inline'>
                            <span>
                                <Localize i18n_default_text='Barrier' />
                            </span>
                            <select value={barrier} onChange={e => setBarrier(Number(e.target.value))}>
                                {DIGITS.map(digit => (
                                    <option key={digit} value={digit}>
                                        {digit}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <SplitBar
                        left_label={localize('Over {{barrier}}', { barrier })}
                        right_label={localize('Under {{barrier}}', { barrier })}
                        left_value={stats.over}
                        right_value={stats.under}
                    />
                    <p className='analysis__hint'>
                        <Localize
                            i18n_default_text='Digit {{barrier}} itself: {{value}}'
                            values={{ barrier, value: formatPercent(percent(stats.counts[barrier], total)) }}
                        />
                    </p>
                </section>

                <section className='analysis__card analysis__card--wide'>
                    <h3 className='analysis__card-title'>
                        <Localize i18n_default_text='Recent digits' />
                    </h3>
                    <div className='analysis__recent'>
                        {stats.digits.slice(-RECENT_DIGITS_SHOWN).map((digit, index, list) => (
                            <span
                                // Position-based key keeps the strip stable as new ticks shift it.
                                key={index}
                                className={classNames('analysis__recent-digit', {
                                    'analysis__recent-digit--even': digit % 2 === 0,
                                    'analysis__recent-digit--odd': digit % 2 !== 0,
                                    'analysis__recent-digit--latest': index === list.length - 1,
                                })}
                            >
                                {digit}
                            </span>
                        ))}
                        {!has_data && (
                            <span className='analysis__hint'>
                                {is_loading ? localize('Loading ticks...') : localize('No ticks yet.')}
                            </span>
                        )}
                    </div>
                    <div className='analysis__legend'>
                        <span className='analysis__legend-item analysis__legend-item--even'>
                            <Localize i18n_default_text='Even' />
                        </span>
                        <span className='analysis__legend-item analysis__legend-item--odd'>
                            <Localize i18n_default_text='Odd' />
                        </span>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default GraphicalAnalysis;
