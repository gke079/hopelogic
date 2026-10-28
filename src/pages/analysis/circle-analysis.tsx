import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { Localize, localize } from '@deriv-com/translations';
import {
    DIGITS,
    formatPercent,
    getLastDigit,
    MAX_TICKS,
    MIN_TICKS,
    percent,
    rankDigits,
    SYMBOLS,
} from './analysis-utils';
import { TAnalysisViewProps } from './graphical-analysis';

const RECENT_COLLAPSED = 12;
const RECENT_EXPANDED = 60;

type TTone = 'green' | 'red' | 'grey';

type TOutcome = {
    label: string;
    count: number;
    tone: TTone;
};

const OutcomeBox = ({ label, count, tone, total }: TOutcome & { total: number }) => (
    <div className='circle-analysis__outcome'>
        <span className='circle-analysis__outcome-label'>{label}</span>
        <span className='circle-analysis__outcome-value'>
            <strong>{count}</strong> ({formatPercent(percent(count, total))})
        </span>
        <div className='circle-analysis__bar'>
            <div
                className={`circle-analysis__bar-fill circle-analysis__bar-fill--${tone}`}
                style={{ width: `${percent(count, total)}%` }}
            />
        </div>
    </div>
);

type TRecentRowProps = {
    title: string;
    items: { letter: string; tone: TTone }[];
};

const RecentRow = ({ title, items }: TRecentRowProps) => {
    const [is_expanded, setIsExpanded] = useState(false);
    const shown = items.slice(-(is_expanded ? RECENT_EXPANDED : RECENT_COLLAPSED));
    return (
        <div className='circle-analysis__recent'>
            <div className='circle-analysis__recent-header'>
                <span className='circle-analysis__recent-title'>{title}</span>
                <button
                    type='button'
                    className='circle-analysis__more'
                    onClick={() => setIsExpanded(!is_expanded)}
                    aria-expanded={is_expanded}
                >
                    {is_expanded ? <Localize i18n_default_text='Less' /> : <Localize i18n_default_text='More' />}
                </button>
            </div>
            <div className='circle-analysis__chips'>
                {shown.map((item, index) => (
                    // Position-based key keeps the strip stable as new ticks shift it.
                    <span key={index} className={`circle-analysis__chip circle-analysis__chip--${item.tone}`}>
                        {item.letter}
                    </span>
                ))}
            </div>
        </div>
    );
};

const CircleAnalysis = ({ symbol, onSymbolChange, tick_count, onTickCountChange, stream }: TAnalysisViewProps) => {
    const { prices, pip_size, is_loading } = stream;
    const [barrier, setBarrier] = useState(5);
    const [tick_input, setTickInput] = useState(String(tick_count));

    useEffect(() => setTickInput(String(tick_count)), [tick_count]);

    // Apply the ticks window on blur/Enter so typing doesn't resubscribe on every keystroke.
    const commitTickInput = () => {
        const value = Math.round(Number(tick_input));
        const next = Number.isFinite(value) ? Math.min(MAX_TICKS, Math.max(MIN_TICKS, value)) : tick_count;
        setTickInput(String(next));
        if (next !== tick_count) onTickCountChange(next);
    };

    const stats = useMemo(() => {
        const digits = prices.map(price => getLastDigit(price, pip_size));
        const counts = DIGITS.map(digit => digits.filter(d => d === digit).length);
        return {
            digits,
            counts,
            ranks: digits.length ? rankDigits(counts) : DIGITS.map(() => null),
            even: digits.filter(d => d % 2 === 0).length,
            under: digits.filter(d => d < barrier).length,
            over: digits.filter(d => d > barrier).length,
            equal: counts[barrier],
        };
    }, [prices, pip_size, barrier]);

    const total = stats.digits.length;
    const has_data = total > 0;
    const last_digit = has_data ? stats.digits[total - 1] : null;
    const last_price = has_data ? prices[prices.length - 1].toFixed(pip_size) : '—';

    const recent_even_odd = stats.digits.map(d =>
        d % 2 === 0 ? { letter: 'E', tone: 'green' as TTone } : { letter: 'O', tone: 'red' as TTone }
    );
    const recent_over_under = stats.digits.map(d => {
        if (d < barrier) return { letter: 'U', tone: 'green' as TTone };
        if (d > barrier) return { letter: 'O', tone: 'red' as TTone };
        return { letter: '=', tone: 'grey' as TTone };
    });
    const recent_match_differ = stats.digits.map(d =>
        d === barrier ? { letter: 'M', tone: 'green' as TTone } : { letter: 'D', tone: 'red' as TTone }
    );

    return (
        <div className='analysis__view'>
            <div className='circle-analysis'>
                <label className='circle-analysis__field'>
                    <span className='circle-analysis__label'>
                        <Localize i18n_default_text='Select Market:' />
                    </span>
                    <select
                        className='circle-analysis__input'
                        value={symbol}
                        onChange={e => onSymbolChange(e.target.value)}
                    >
                        {SYMBOLS.map(item => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </label>

                <div className='circle-analysis__price'>
                    <span className='circle-analysis__price-value'>{last_price}</span>
                    <span className='circle-analysis__price-digit'>{last_digit ?? '—'}</span>
                </div>

                <div className='circle-analysis__ticks'>
                    <label htmlFor='circle-analysis-ticks' className='circle-analysis__label'>
                        <Localize i18n_default_text='Ticks window:' />
                    </label>
                    <input
                        id='circle-analysis-ticks'
                        className='circle-analysis__input circle-analysis__input--small'
                        type='number'
                        min={MIN_TICKS}
                        max={MAX_TICKS}
                        value={tick_input}
                        onChange={e => setTickInput(e.target.value)}
                        onBlur={commitTickInput}
                        onKeyDown={e => e.key === 'Enter' && commitTickInput()}
                    />
                    <span className='circle-analysis__hint'>
                        ({MIN_TICKS}–{MAX_TICKS})
                    </span>
                </div>

                <div className='circle-analysis__distribution-header'>
                    <span className='circle-analysis__label'>
                        <Localize
                            i18n_default_text='Last {{count}} ticks digit distribution'
                            values={{ count: tick_count }}
                        />
                    </span>
                    <span className='circle-analysis__badge'>
                        {total}/{tick_count}
                    </span>
                </div>

                <div className='circle-analysis__circles'>
                    {DIGITS.map(digit => {
                        const rank = stats.ranks[digit];
                        const is_current = digit === last_digit;
                        return (
                            <div key={digit} className='circle-analysis__circle-wrapper'>
                                <span
                                    className={classNames('circle-analysis__pointer', {
                                        'circle-analysis__pointer--visible': is_current,
                                    })}
                                    aria-hidden
                                />
                                <div
                                    className={classNames('circle-analysis__circle', {
                                        [`circle-analysis__circle--${rank}`]: rank,
                                        'circle-analysis__circle--current': is_current,
                                    })}
                                    title={localize('{{digit}}: {{count}} ticks', {
                                        digit,
                                        count: stats.counts[digit],
                                    })}
                                >
                                    <span className='circle-analysis__circle-digit'>{digit}</span>
                                    <span className='circle-analysis__circle-percent'>
                                        {is_loading && !has_data
                                            ? '—'
                                            : formatPercent(percent(stats.counts[digit], total))}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className='circle-analysis__legend'>
                    <span className='circle-analysis__legend-item circle-analysis__legend-item--most'>
                        <Localize i18n_default_text='Most appearing' />
                    </span>
                    <span className='circle-analysis__legend-item circle-analysis__legend-item--second-most'>
                        <Localize i18n_default_text='2nd most' />
                    </span>
                    <span className='circle-analysis__legend-item circle-analysis__legend-item--second-least'>
                        <Localize i18n_default_text='2nd least' />
                    </span>
                    <span className='circle-analysis__legend-item circle-analysis__legend-item--least'>
                        <Localize i18n_default_text='Least appearing' />
                    </span>
                    <span className='circle-analysis__legend-item circle-analysis__legend-item--current'>
                        <Localize i18n_default_text='Current digit' />
                    </span>
                </div>

                <section className='circle-analysis__section'>
                    <h3 className='circle-analysis__section-title'>
                        <Localize i18n_default_text='Even/Odd' />
                    </h3>
                    <div className='circle-analysis__outcomes circle-analysis__outcomes--two'>
                        <OutcomeBox label={localize('Even')} count={stats.even} tone='green' total={total} />
                        <OutcomeBox label={localize('Odd')} count={total - stats.even} tone='red' total={total} />
                    </div>
                    <RecentRow title={localize('Recent E/O')} items={recent_even_odd} />
                </section>

                <section className='circle-analysis__section'>
                    <label className='circle-analysis__field circle-analysis__field--inline'>
                        <span className='circle-analysis__section-title'>
                            <Localize i18n_default_text='Over/Under:' />
                        </span>
                        <select
                            className='circle-analysis__input'
                            value={barrier}
                            onChange={e => setBarrier(Number(e.target.value))}
                        >
                            {DIGITS.map(digit => (
                                <option key={digit} value={digit}>
                                    {digit}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className='circle-analysis__outcomes circle-analysis__outcomes--three'>
                        <OutcomeBox label={localize('Under')} count={stats.under} tone='green' total={total} />
                        <OutcomeBox label={localize('Equal')} count={stats.equal} tone='grey' total={total} />
                        <OutcomeBox label={localize('Over')} count={stats.over} tone='red' total={total} />
                    </div>
                    <RecentRow title={localize('Recent U/=/O')} items={recent_over_under} />
                </section>

                <section className='circle-analysis__section'>
                    <h3 className='circle-analysis__section-title'>
                        <Localize i18n_default_text='Matches/Differs ({{digit}})' values={{ digit: barrier }} />
                    </h3>
                    <div className='circle-analysis__outcomes circle-analysis__outcomes--two'>
                        <OutcomeBox label={localize('Matches')} count={stats.equal} tone='green' total={total} />
                        <OutcomeBox label={localize('Differs')} count={total - stats.equal} tone='red' total={total} />
                    </div>
                    <RecentRow title={localize('Recent M/D')} items={recent_match_differ} />
                </section>
            </div>
        </div>
    );
};

export default CircleAnalysis;
