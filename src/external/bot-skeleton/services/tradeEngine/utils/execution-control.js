// Lets the UI pause a running bot and choose how quickly it trades.
// The interpreter calls `beforePurchaseGate` each time the bot is about to
// evaluate its purchase conditions, so a pause takes effect before the next
// trade while any open contract runs to completion.

export const EXECUTION_MODES = Object.freeze({
    FAST: 'fast',
    NORMAL: 'normal',
});

// Pause between one contract closing and the next trade cycle in Normal mode.
const NORMAL_MODE_DELAY_MS = 2000;

let is_paused = false;
let execution_mode = EXECUTION_MODES.NORMAL;
let waiters = [];

const releaseWaiters = () => {
    waiters.forEach(resolve => resolve());
    waiters = [];
};

export const pauseBot = () => {
    is_paused = true;
};

export const resumeBot = () => {
    is_paused = false;
    releaseWaiters();
};

export const isBotPaused = () => is_paused;

export const setExecutionMode = mode => {
    execution_mode = Object.values(EXECUTION_MODES).includes(mode) ? mode : EXECUTION_MODES.NORMAL;
};

export const getExecutionMode = () => execution_mode;

// Clears the pause when a new run starts.
export const resetExecutionControl = () => {
    is_paused = false;
    releaseWaiters();
};

// Wakes a paused bot so it can exit when stopped. The pause itself is kept so a
// bot that restarts after a recoverable error stays paused.
export const releasePausedBot = releaseWaiters;

const waitWhilePaused = isStopped =>
    is_paused && !isStopped()
        ? new Promise(resolve => waiters.push(resolve)).then(() => waitWhilePaused(isStopped))
        : Promise.resolve();

// `is_new_cycle` is true on the first purchase check after a previous contract finished.
export const beforePurchaseGate = async ({ is_new_cycle, isStopped }) => {
    if (is_new_cycle && execution_mode === EXECUTION_MODES.NORMAL) {
        await new Promise(resolve => setTimeout(resolve, NORMAL_MODE_DELAY_MS));
    }
    await waitWhilePaused(isStopped);
};
