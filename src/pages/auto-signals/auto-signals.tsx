import React from 'react';
import { Localize } from '@deriv-com/translations';
import './auto-signals.scss';

const AutoSignals = () => (
    <div className='auto-signals' data-testid='dt_auto_signals'>
        <div className='auto-signals__content'>
            <h2 className='auto-signals__title'>
                <Localize i18n_default_text='Auto Signals' />
            </h2>
            <p className='auto-signals__description'>
                <Localize i18n_default_text='Automated trading signals will appear here.' />
            </p>
        </div>
    </div>
);

export default AutoSignals;
