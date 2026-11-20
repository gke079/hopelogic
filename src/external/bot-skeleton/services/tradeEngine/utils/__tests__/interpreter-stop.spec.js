import Interpreter from '../interpreter';
import { api_base } from '../../../api/api-base';
import { createScope } from '../cliTools';

jest.mock('@/components/shared', () => ({ isMultiplierContract: () => false }));
jest.mock('@/utils/clone', () => ({ __esModule: true, default: value => value }));
jest.mock('@deriv/js-interpreter', () => ({ __esModule: true, default: function Interpreter() {} }));
jest.mock('../../../../constants/messages', () => ({ unrecoverable_errors: [] }));
jest.mock('../../../../utils/observer', () => ({ observer: { getState: () => [], emit: jest.fn() } }));
jest.mock('../../../api/api-base', () => ({ api_base: { is_stopping: false, clearSubscriptions: jest.fn() } }));
jest.mock('../../Interface', () => ({ __esModule: true, default: () => ({ tradeEngine: {} }) }));
jest.mock('../cliTools', () => ({ createScope: jest.fn() }));

describe('interpreter stop cleanup', () => {
    it('finishes cleanup and resets the stopping flag', async () => {
        const unsubscribe = jest.fn().mockResolvedValue(undefined);
        createScope.mockReturnValue({ observer: { register: jest.fn() }, ticksService: { unsubscribeFromTicksService: unsubscribe } });
        await expect(Interpreter().stop()).resolves.toBeUndefined();
        expect(unsubscribe).toHaveBeenCalledTimes(1);
        expect(api_base.is_stopping).toBe(false);
    });
    it('propagates async cleanup errors without leaving the bot stuck stopping', async () => {
        const failure = new Error('Connection closed');
        createScope.mockReturnValue({ observer: { register: jest.fn() }, ticksService: { unsubscribeFromTicksService: () => Promise.reject(failure) } });
        await expect(Interpreter().stop()).rejects.toBe(failure);
        expect(api_base.is_stopping).toBe(false);
    });
});
