import { System } from "../System"

export const useTimer = (system: System, callback: () => void, timeMs: number) => {

    let elapsedClock = 0;

    const update = (deltaTime: number) => {
        elapsedClock += deltaTime;

        if(elapsedClock >= timeMs) {
            elapsedClock -= timeMs;
            callback();
        }
    }

    system.signalBeforeUpdate.connect(update)

    return () => {
        system.signalBeforeUpdate.disconnect(update)
    }
}