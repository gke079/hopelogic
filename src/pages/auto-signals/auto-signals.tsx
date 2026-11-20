import React from 'react';
import Text from '@/components/shared_ui/text';
import OnlyUp from './only-up/only-up';
import './auto-signals.scss';

const AutoSignals = () => {
    return (
        <div className='auto-signals'>
            <div className='auto-signals__header'>
                <Text as='h2' size='xs' weight='bold' color='prominent'>
                    ONLY UP
                </Text>
            </div>
            <OnlyUp />
        </div>
    );
};

export default AutoSignals;
