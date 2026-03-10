/**
 * Simple pub/sub bus for decoupling engine events from UI and systems.
 */
export class EventBus {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this.listeners = new Map();
    }

    /**
     * @param {string} eventName
     * @param {(payload?: any) => void} listener
     * @returns {() => void}
     */
    on(eventName, listener) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }

        this.listeners.get(eventName).add(listener);
        return () => this.off(eventName, listener);
    }

    /**
     * @param {string} eventName
     * @param {(payload?: any) => void} listener
     */
    off(eventName, listener) {
        const eventListeners = this.listeners.get(eventName);
        if (!eventListeners) {
            return;
        }

        eventListeners.delete(listener);
        if (eventListeners.size === 0) {
            this.listeners.delete(eventName);
        }
    }

    /**
     * @param {string} eventName
     * @param {any} [payload]
     */
    emit(eventName, payload) {
        const eventListeners = this.listeners.get(eventName);
        if (!eventListeners) {
            return;
        }

        for (const listener of eventListeners) {
            listener(payload);
        }
    }
}
