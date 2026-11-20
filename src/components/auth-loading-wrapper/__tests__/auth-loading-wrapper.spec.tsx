import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthLoadingWrapper from '..';

const mockClient = { is_logged_in: false, is_logging_out: false };
jest.mock('@/hooks/useStore', () => ({ useStore: () => ({ client: mockClient }) }));
jest.mock('@/components/shared', () => ({ generateOAuthURL: jest.fn() }));
jest.mock('@/components/shared_ui/button', () => ({ __esModule: true, default: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button> }));

describe('tab access', () => {
    it('keeps tab content unmounted until login is confirmed', () => {
        render(<AuthLoadingWrapper><div>Private tabs</div></AuthLoadingWrapper>);
        expect(screen.queryByText('Private tabs')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Log in with Deriv' })).toBeInTheDocument();
    });
    it('removes tab content when logout starts', () => {
        mockClient.is_logged_in = true;
        const { rerender } = render(<AuthLoadingWrapper><div>Private tabs</div></AuthLoadingWrapper>);
        expect(screen.getByText('Private tabs')).toBeInTheDocument();
        mockClient.is_logging_out = true;
        rerender(<AuthLoadingWrapper><div>Private tabs</div></AuthLoadingWrapper>);
        expect(screen.queryByText('Private tabs')).not.toBeInTheDocument();
        mockClient.is_logged_in = false;
        mockClient.is_logging_out = false;
    });
});
