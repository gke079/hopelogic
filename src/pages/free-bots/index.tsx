import React from 'react';
import { Localize } from '@deriv-com/translations';
import './free-bots.scss';

const FreeBots = () => {
    return (
        <div className='free-bots'>
            <div className='free-bots__content'>
                <Localize i18n_default_text='Free bots' />
            </div>
        </div>
    );
};

export default FreeBots;
