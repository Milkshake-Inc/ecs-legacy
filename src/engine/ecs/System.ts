import { Engine } from './Engine';
import { Signal } from 'typed-signals';

/**
 * Engine system
 * Represents logic container for updating engine state
 */
export abstract class System {
	public signalOnAddedToEngine: Signal<(engine: Engine) => void> = new Signal();
	public signalOnRemovedFromEngine: Signal<(engine: Engine) => void> = new Signal();

	public signalBeforeUpdate: Signal<() => void> = new Signal();

	/**
	 * Gets a priority of the system
	 * It should be initialized before adding to the system
	 */
	public priority = 0;

	/**
	 * Updates system
	 *
	 * @param dt Delta time in seconds
	 */
	public updateFixed(dt: number) {}

	/**
	 * Fixed updates system
	 *
	 * @param dt Delta time in seconds
	 */
	public update(dt: number) {}

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
}
