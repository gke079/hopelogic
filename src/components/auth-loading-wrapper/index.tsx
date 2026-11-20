import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { generateOAuthURL } from '@/components/shared';
import Button from '@/components/shared_ui/button';
import { useStore } from '@/hooks/useStore';
import { Localize, localize } from '@deriv-com/translations';
import './auth-loading-wrapper.scss';

type AuthLoadingWrapperProps = {
    children: React.ReactNode;
};

const AuthLoadingWrapper = observer(({ children }: AuthLoadingWrapperProps) => {
    const { client } = useStore();
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [error, setError] = useState('');

    if (client.is_logged_in && !client.is_logging_out) return <>{children}</>;

    const login = async () => {
        setIsRedirecting(true);
        setError('');
        try {
            const url = await generateOAuthURL();
            if (!url) throw new Error('Login unavailable');
            window.location.replace(url);
        } catch {
            setError(localize('Unable to start login. Please try again.'));
            setIsRedirecting(false);
        }
    };

    return (
        <section className='auth-access' aria-labelledby='auth-access-title'>
            <h1 id='auth-access-title'><Localize i18n_default_text='Log in to continue' /></h1>
            <p><Localize i18n_default_text='Log in with your Deriv account to access the trading tabs and charts.' /></p>
            <Button primary large onClick={login} is_loading={isRedirecting} is_disabled={isRedirecting}>
                <Localize i18n_default_text='Log in with Deriv' />
            </Button>
            {error && <p role='alert'>{error}</p>}
        </section>
    );
});

export default AuthLoadingWrapper;
