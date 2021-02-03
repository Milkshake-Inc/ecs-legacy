/* eslint-disable no-mixed-spaces-and-tabs */

import InputDevice, { PressedState } from './InputDevice';
import { Manager, DIRECTION_ALL } from 'hammerjs';
import InputManager from './InputManager';
import { Control, Gesture } from './Control';

const DeviceSensitivity = window.screen.width * 0.0002;

export default class Touch extends InputDevice {
	protected manager: HammerManager;

	protected lastEvent: Map<Gesture, HammerInput> = new Map();

	protected get listeners() {
		// https://hammerjs.github.io/recognizer-pan/
		return {
			tap: (event: HammerInput) => this.handleGesture(Gesture.Tap, event),
			pan: (event: HammerInput) => this.handleGesture(Gesture.Pan, event),
			panend: (event: HammerInput) => this.handleGestureEnd(Gesture.Pan, event),
			swipeleft: (event: HammerInput) => this.handleGesture(Gesture.SwipeLeft, event),
			swiperight: (event: HammerInput) => this.handleGesture(Gesture.SwipeRight, event),
			swipeup: (event: HammerInput) => this.handleGesture(Gesture.SwipeLeft, event),
			swipedown: (event: HammerInput) => this.handleGesture(Gesture.SwipeDown, event),
			pinch: (event: HammerInput) => this.handleGesture(Gesture.Pinch, event),
			pinchend: (event: HammerInput) => this.handleGestureEnd(Gesture.Pinch, event),
			press: (event: HammerInput) => this.handleGesture(Gesture.Press, event),
			pressup: (event: HammerInput) => this.handleGestureEnd(Gesture.Press, event)
		};
	}

	constructor() {
		super();
		this.manager = new Manager(document.body);

		this.manager.add(new Hammer.Tap());
		this.manager.add(new Hammer.Pan());
		this.manager.add(new Hammer.Swipe({ direction: DIRECTION_ALL, enable: true })); // Not tested
		this.manager.add(new Hammer.Pinch({ enable: true })); // Not tested
		this.manager.add(new Hammer.Press());
	}

	static gesture(gesture: Gesture, sensitivityX = 1, sensitivityY = 1): Control {
		return (input: InputManager) => {
			const event = input.touch.lastEvent.get(gesture);
			const x = event?.velocityX || 0;
			const y = event?.velocityY || 0;

			return {
				down: input.touch.isDown(gesture),
				once: input.touch.isDownOnce(gesture),
				up: input.touch.isUpOnce(gesture),
				x: x * DeviceSensitivity * sensitivityX,
				y: -y * DeviceSensitivity * sensitivityY
			};
		};
	}

	protected handleGesture(gesture: Gesture, event: HammerInput) {
		if (gesture == Gesture.Pinch) {
			const subGesture = event['additionalEvent'] == 'pinchin' ? Gesture.PinchIn : Gesture.PinchOut;
			if (!this.pressed.has(subGesture)) this.pressed.set(subGesture, PressedState.Down);
		}

		if (!this.pressed.has(gesture)) this.pressed.set(gesture, PressedState.Down);
		this.lastEvent.set(gesture, event);
	}

	protected handleGestureEnd(gesture: Gesture, event: HammerInput) {
		// Mark all gestures as up as user has stopped touching screen
		for (const [key] of this.pressed) {
			this.pressed.set(key, PressedState.Up);
		}
	}

	public updateFixed(deltaTime: number) {
		super.updateFixed(deltaTime);

		// These gestures have no up event, so got to clear it manually...
		[Gesture.Tap, Gesture.SwipeDown, Gesture.SwipeLeft, Gesture.SwipeRight, Gesture.SwipeUp, Gesture.PinchIn, Gesture.PinchOut].forEach(
			g => {
				if (this.isDown(g)) this.pressed.set(g, PressedState.Up); // Show as down for one tick, then trigger up
			}
		);
	}

	protected addListeners() {
		for (const event of Object.keys(this.listeners)) {
			this.manager.on(event, this.listeners[event]);
		}
	}

	protected removeListeners() {
		for (const event of Object.keys(this.listeners)) {
			this.manager.off(event, this.listeners[event]);
		}
	}
}
