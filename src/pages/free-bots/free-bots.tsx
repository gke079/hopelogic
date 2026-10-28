import React, { useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { DBOT_TABS } from '@/constants/bot-contents';
import { load, save_types } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import { Localize, localize } from '@deriv-com/translations';
import { FREE_BOTS, TBotCategory, TFreeBot } from './bots-config';
import './free-bots.scss';

const CATEGORIES: ('All' | TBotCategory)[] = ['All', 'Digits', 'Rise/Fall', 'Risk management'];

const FreeBots = observer(() => {
    const { dashboard } = useStore();
    const [category, setCategory] = useState<'All' | TBotCategory>('All');
    const [loading_id, setLoadingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const visible_bots = category === 'All' ? FREE_BOTS : FREE_BOTS.filter(bot => bot.category === category);

    const handleLoad = async (bot: TFreeBot) => {
        setError(null);
        setLoadingId(bot.id);
        try {
            const { default: xml } = await bot.loadXml();
            await load({
                block_string: xml,
                file_name: bot.name,
                strategy_id: null,
                workspace: window.Blockly?.derivWorkspace,
                from: save_types.UNSAVED,
                drop_event: null,
                showIncompatibleStrategyDialog: null,
            });
            dashboard.setActiveTab(DBOT_TABS.BOT_BUILDER);
        } catch (e) {
            console.error('Failed to load bot', e);
            setError(localize('Could not load this bot. Please try again.'));
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className='free-bots'>
            <div className='free-bots__header'>
                <h2 className='free-bots__title'>
                    <Localize i18n_default_text='Ready-made bots' />
                </h2>
                <p className='free-bots__subtitle'>
                    <Localize i18n_default_text='Pick a strategy to open it in Bot Builder, then adjust the stake and settings before you run it.' />
                </p>
            </div>
            <div className='free-bots__filters' role='tablist'>
                {CATEGORIES.map(item => (
                    <button
                        key={item}
                        type='button'
                        role='tab'
                        aria-selected={category === item}
                        className={classNames('free-bots__filter', { 'free-bots__filter--active': category === item })}
                        onClick={() => setCategory(item)}
                    >
                        {item}
                    </button>
                ))}
            </div>
            {error && <div className='free-bots__error'>{error}</div>}
            <div className='free-bots__grid'>
                {visible_bots.map(bot => (
                    <div key={bot.id} className='free-bots__card'>
                        <div className='free-bots__card-top'>
                            <span className='free-bots__tag'>{bot.category}</span>
                            <span className='free-bots__market'>{bot.market}</span>
                        </div>
                        <h3 className='free-bots__card-title'>{bot.name}</h3>
                        <p className='free-bots__card-description'>{bot.description}</p>
                        <button
                            type='button'
                            className='free-bots__load'
                            disabled={loading_id !== null}
                            onClick={() => handleLoad(bot)}
                        >
                            {loading_id === bot.id ? (
                                <Localize i18n_default_text='Loading...' />
                            ) : (
                                <Localize i18n_default_text='Load bot' />
                            )}
                        </button>
                    </div>
                ))}
            </div>
            <p className='free-bots__disclaimer'>
                <Localize i18n_default_text='Trading involves risk. No strategy guarantees profit — test bots on a demo account first.' />
            </p>
        </div>
    );
});

export default FreeBots;
