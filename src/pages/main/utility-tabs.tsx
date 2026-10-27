import React from 'react';

export type UtilityTabKind = 'signal' | 'free-bots' | 'automation' | 'analysis';

type UtilityTabsProps = { kind: UtilityTabKind };

const content = {
    signal: {
        eyebrow: 'Market intelligence',
        title: 'Signal centre',
        description: 'Track market signals and keep your next bot idea grounded in live context.',
        items: ['Volatility watchlist', 'Trend direction', 'Recent signal activity'],
    },
    'free-bots': {
        eyebrow: 'Ready-made strategies',
        title: 'Free bots',
        description: 'Explore starter bots you can load, inspect, and customise in Bot Builder.',
        items: ['Starter strategies', 'Community favourites', 'Recently added bots'],
    },
    automation: {
        eyebrow: 'Workflow control',
        title: 'Automation',
        description: 'Organise repeatable workflows and keep your trading routines in one place.',
        items: ['Scheduled runs', 'Bot routines', 'Execution history'],
    },
    analysis: {
        eyebrow: 'Performance insights',
        title: 'Analysis',
        description: 'Review performance patterns and turn your results into better strategies.',
        items: ['Performance overview', 'Trade statistics', 'Risk checkpoints'],
    },
} as const;

const UtilityTabs = ({ kind }: UtilityTabsProps) => {
    const panel = content[kind];

    return (
        <section className='utility-tab-panel' aria-labelledby={`${kind}-tab-title`}>
            <div className='utility-tab-panel__intro'>
                <span className='utility-tab-panel__eyebrow'>{panel.eyebrow}</span>
                <h2 id={`${kind}-tab-title`}>{panel.title}</h2>
                <p>{panel.description}</p>
            </div>
            <div className='utility-tab-panel__grid'>
                {panel.items.map(item => (
                    <article className='utility-tab-panel__card' key={item}>
                        <span className='utility-tab-panel__card-dot' aria-hidden='true' />
                        <h3>{item}</h3>
                        <p>Coming soon</p>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default UtilityTabs;
