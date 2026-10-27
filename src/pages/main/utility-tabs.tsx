import React, { useState } from 'react';

export type UtilityTabKind = 'signal' | 'free-bots' | 'automation' | 'analysis';

type UtilityTabsProps = { kind: UtilityTabKind };

type RuleType = 'over' | 'odd' | 'rising' | 'rising-fall';

const ruleLabels: Record<RuleType, string> = {
    over: 'Last N digits are Over',
    odd: 'Last N digits are Odd',
    rising: 'Last N ticks are Rising',
    'rising-fall': 'Last N ticks Rising, then N ticks Fall',
};

const content = {
    signal: { eyebrow: 'Market intelligence', title: 'Signal centre', description: 'Track market signals and keep your next bot idea grounded in live context.', items: ['Volatility watchlist', 'Trend direction', 'Recent signal activity'] },
    'free-bots': { eyebrow: 'Ready-made strategies', title: 'Free bots', description: 'Explore starter bots you can load, inspect, and customise in Bot Builder.', items: ['Starter strategies', 'Community favourites', 'Recently added bots'] },
    analysis: { eyebrow: 'Performance insights', title: 'Analysis', description: 'Review performance patterns and turn your results into better strategies.', items: ['Performance overview', 'Trade statistics', 'Risk checkpoints'] },
} as const;

const AutomationBot = () => {
    const [rules, setRules] = useState<RuleType[]>(['over']);
    const [running, setRunning] = useState(false);
    const [mode, setMode] = useState<'fast' | 'normal'>('normal');

    const updateRule = (index: number, value: RuleType) => setRules(current => current.map((rule, ruleIndex) => ruleIndex === index ? value : rule));

    return (
        <div className='automation-bot'>
            <div className='automation-bot__header'>
                <div>
                    <span className='utility-tab-panel__eyebrow'>Strategy runner</span>
                    <h3>Custom digit bot</h3>
                    <p>Build a rule sequence, then run it against incoming ticks.</p>
                </div>
                <span className={`automation-bot__status ${running ? 'is-running' : ''}`}><span />{running ? 'Running' : 'Ready'}</span>
            </div>

            <div className='automation-bot__rules'>
                <div className='automation-bot__section-heading'><span>Strategy conditions</span><small>All conditions must match</small></div>
                {rules.map((rule, index) => (
                    <div className='automation-bot__rule' key={`${index}-${rule}`}>
                        <span className='automation-bot__rule-number'>{index + 1}</span>
                        <select aria-label={`Condition ${index + 1}`} value={rule} onChange={event => updateRule(index, event.target.value as RuleType)}>
                            {Object.entries(ruleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                        </select>
                        <label> N = <input aria-label={`N value for condition ${index + 1}`} type='number' min='1' max='99' defaultValue='3' /></label>
                        {rules.length > 1 && <button type='button' className='automation-bot__remove' aria-label={`Remove condition ${index + 1}`} onClick={() => setRules(current => current.filter((_, ruleIndex) => ruleIndex !== index))}>×</button>}
                    </div>
                ))}
                <button type='button' className='automation-bot__add-rule' onClick={() => setRules(current => [...current, 'rising-fall'])}>+ Add condition</button>
            </div>

            <div className='automation-bot__settings'>
                <label>Stake<input type='number' min='0' step='0.01' defaultValue='0.35' /></label>
                <label>Take profit<input type='number' min='0' step='0.01' defaultValue='0.1' /></label>
                <label>Stop loss<input type='number' min='0' step='1' defaultValue='10' /></label>
                <label>Martingale<input type='number' min='1' step='0.1' defaultValue='1.4' /></label>
            </div>

            <div className='automation-bot__footer'>
                <div className='automation-bot__mode' role='group' aria-label='Execution mode'>
                    <span>Execution mode</span>
                    <button type='button' className={mode === 'fast' ? 'is-selected' : ''} onClick={() => setMode('fast')}>Fast</button>
                    <button type='button' className={mode === 'normal' ? 'is-selected' : ''} onClick={() => setMode('normal')}>Normal</button>
                </div>
                <button type='button' className={`automation-bot__run ${running ? 'is-paused' : ''}`} onClick={() => setRunning(value => !value)}>{running ? 'Pause' : 'Run bot'}</button>
            </div>
        </div>
    );
};

const UtilityTabs = ({ kind }: UtilityTabsProps) => {
    if (kind === 'automation') {
        return <section className='utility-tab-panel' aria-labelledby='automation-tab-title'><div className='utility-tab-panel__intro'><span className='utility-tab-panel__eyebrow'>Workflow control</span><h2 id='automation-tab-title'>Automation</h2><p>Turn a customised strategy into a repeatable trading routine.</p></div><AutomationBot /></section>;
    }
    const panel = content[kind as keyof typeof content];
    return <section className='utility-tab-panel' aria-labelledby={`${kind}-tab-title`}><div className='utility-tab-panel__intro'><span className='utility-tab-panel__eyebrow'>{panel.eyebrow}</span><h2 id={`${kind}-tab-title`}>{panel.title}</h2><p>{panel.description}</p></div><div className='utility-tab-panel__grid'>{panel.items.map(item => <article className='utility-tab-panel__card' key={item}><span className='utility-tab-panel__card-dot' aria-hidden='true' /><h3>{item}</h3><p>Coming soon</p></article>)}</div></section>;
};

export default UtilityTabs;
