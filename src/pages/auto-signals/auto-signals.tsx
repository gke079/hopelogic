import React, { useState } from 'react';
import classNames from 'classnames';
import { localize } from '@deriv-com/translations';
import OnlyUp from './only-up';
import './auto-signals.scss';

const SIGNAL_TABS = [{ id: 'only_up', label: () => localize('ONLY UP'), Component: OnlyUp }];

const AutoSignals = () => {
    const [active, setActive] = useState(SIGNAL_TABS[0].id);
    const ActiveComponent = SIGNAL_TABS.find(t => t.id === active)?.Component ?? OnlyUp;

    return (
        <div className='auto-signals' data-testid='dt_auto_signals'>
            <div className='auto-signals__content'>
                <div className='auto-signals__tabs' role='tablist'>
                    {SIGNAL_TABS.map(tab => (
                        <button
                            key={tab.id}
                            type='button'
                            role='tab'
                            aria-selected={active === tab.id}
                            className={classNames('auto-signals__tab', {
                                'auto-signals__tab--active': active === tab.id,
                            })}
                            onClick={() => setActive(tab.id)}
                        >
                            {tab.label()}
                        </button>
                    ))}
                </div>
                <ActiveComponent />
            </div>
        </div>
    );
};

export default AutoSignals;
