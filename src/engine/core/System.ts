import { Engine } from './Engine';
import { Signal } from 'typed-signals';

/**
 * Engine system
 * Represents logic container for updating engine state
 */
export abstract class System {
	public signalOnAddedToEngine: Signal<(engine: Engine) => void> = new Signal();
	public signalOnRemovedFromEngine: Signal<(engine: Engine) => void> = new Signal();

	public signalBeforeUpdate: Signal<(deltaTime: number) => void> = new Signal();

	/**
	 * Gets a priority of the system
	 * It should be initialized before adding to the system
	 */
	public priority = 0;

	/**
	 * Called multiple times per frame. Useful for determinisitic systems such as physics that need to run the same regardless of framerate.
	 *
	 * @param dt      Fixed Delta time in seconds
	 */
	public updateFixed(dt: number) {}

	/**
	 * Called once per frame. Most game logic should live here.
	 *
	 * @param dt Delta time in seconds
	 */
	public update(dt: number, frameDelta?: number) {}

	/**
	 * Called once per frame, after update. Useful for updating cameras before updateRender is called.
	 *
	 * @param dt Delta time in seconds
	 */
	public updateLate(dt: number) {}

	/**
	 * Called once per frame, after updateLate and update. This is the last thing called in the frame, making it useful for any rendering.
	 *
	 * @param dt Delta time in seconds
	 */
	public updateRender(dt: number) {}

	/**
	 * Callback that will be invoked when system being added to engine
	 * @param engine
	 */
	public onAddedToEngine(engine: Engine) {}

	/**
	 * Callback that will be invoked after removing system from engine
	 * @param engine
	 */
	public onRemovedFromEngine(engine: Engine) {}

	public destroy() {
		this.signalBeforeUpdate.disconnectAll();
		this.signalOnAddedToEngine.disconnectAll();
		this.signalOnRemovedFromEngine.disconnectAll();
		this.signalBeforeUpdate = null;
		this.signalOnAddedToEngine = null;
		this.signalOnRemovedFromEngine = null;
	}
}
