import InputManager from './InputManager';

export enum Key {
	Backspace = 8,
	Tab = 9,
	Enter = 13,
	Shift = 16,
	Ctrl = 17,
	Alt = 18,
	PauseBreak = 19,
	CapsLock = 20,
	Escape = 27,
	Space = 32,
	PageUp = 33,
	PageDown = 34,
	End = 35,
	Home = 36,

	LeftArrow = 37,
	UpArrow = 38,
	RightArrow = 39,
	DownArrow = 40,

	Insert = 45,
	Delete = 46,

	Zero = 48,
	ClosedParen = Zero,
	One = 49,
	ExclamationMark = One,
	Two = 50,
	AtSign = Two,
	Three = 51,
	PoundSign = Three,
	Hash = PoundSign,
	Four = 52,
	DollarSign = Four,
	Five = 53,
	PercentSign = Five,
	Six = 54,
	Caret = Six,
	Hat = Caret,
	Seven = 55,
	Ampersand = Seven,
	Eight = 56,
	Star = Eight,
	Asterik = Star,
	Nine = 57,
	OpenParen = Nine,

	A = 65,
	B = 66,
	C = 67,
	D = 68,
	E = 69,
	F = 70,
	G = 71,
	H = 72,
	I = 73,
	J = 74,
	K = 75,
	L = 76,
	M = 77,
	N = 78,
	O = 79,
	P = 80,
	Q = 81,
	R = 82,
	S = 83,
	T = 84,
	U = 85,
	V = 86,
	W = 87,
	X = 88,
	Y = 89,
	Z = 90,

	LeftWindowKey = 91,
	RightWindowKey = 92,
	SelectKey = 93,

	Numpad0 = 96,
	Numpad1 = 97,
	Numpad2 = 98,
	Numpad3 = 99,
	Numpad4 = 100,
	Numpad5 = 101,
	Numpad6 = 102,
	Numpad7 = 103,
	Numpad8 = 104,
	Numpad9 = 105,

	Multiply = 106,
	Add = 107,
	Subtract = 109,
	DecimalPoint = 110,
	Divide = 111,

	F1 = 112,
	F2 = 113,
	F3 = 114,
	F4 = 115,
	F5 = 116,
	F6 = 117,
	F7 = 118,
	F8 = 119,
	F9 = 120,
	F10 = 121,
	F11 = 122,
	F12 = 123,

	NumLock = 144,
	ScrollLock = 145,

	SemiColon = 186,
	Equals = 187,
	Comma = 188,
	Dash = 189,
	Period = 190,
	UnderScore = Dash,
	PlusSign = Equals,
	ForwardSlash = 191,
	Tilde = 192,
	GraveAccent = Tilde,

	OpenBracket = 219,
	ClosedBracket = 221,
	Quote = 222,
	BackwardTick = 223
}

export enum MouseButton {
	Left = 0,
	Middle = 1,
	Right = 2,
	Back = 3,
	Forward = 4
}

export enum MouseScroll {
	Up = 'MouseScrollUp',
	Down = 'MouseScrollDown'
}

export enum Gesture {
	Tap = 'tap',
	Press = 'press',
	SwipeLeft = 'swipeleft',
	SwipeRight = 'swipeleft',
	SwipeUp = 'swipeup',
	SwipeDown = 'swipedown',
	Pinch = 'pinch',
	PinchIn = 'pinchin',
	PinchOut = 'pinchout',
	Pan = 'pan'
}

export interface KeySetTemplate {
	Up: Key;
	Left: Key;
	Down: Key;
	Right: Key;
}

export class KeySet {
	public static WASD: KeySetTemplate = { Up: Key.W, Left: Key.A, Down: Key.S, Right: Key.D };
	public static Arrows: KeySetTemplate = { Up: Key.UpArrow, Left: Key.LeftArrow, Down: Key.DownArrow, Right: Key.RightArrow };
}

export enum GamepadButton {
	A,
	B,
	X,
	Y,
	LeftBumper,
	LB = LeftBumper,
	RightBumper,
	RB = RightBumper,
	LeftTrigger,
	LT = LeftTrigger,
	RightTrigger,
	RT = RightTrigger,
	Back,
	View = Back,
	Start,
	LeftStick,
	LS = LeftStick,
	RightStick,
	RS = RightStick,
	Up,
	DpadUp = Up,
	Down,
	DpadDown = Down,
	Left,
	DpadLeft = Left,
	Right,
	DpadRight = Right,
	Home,
	Guide = Home,
	Xbox = Home
}

export interface GamepadStick {
	xAxis: number;
	yAxis: number;
}

export class Stick {
	public static Left: GamepadStick = { xAxis: 0, yAxis: 1 };
	public static Right: GamepadStick = { xAxis: 2, yAxis: 3 };
}

export type InputBindings = { [index: string]: Control };

export type InputActions<T extends InputBindings> = {
	[P in keyof T]?: InputState;
};

export type InputState = {
	down: boolean;
	once: boolean;
	up: boolean;
	x?: number;
	y?: number;
};

export const InputStateEmpty = {
	down: false,
	once: false,
	up: false,
	x: 0,
	y: 0
};

export type Control = (input: InputManager) => InputState;

export class Controls {
	static and(...controls: Array<Control>): Control {
		if (controls.length < 2) throw new Error('Less than two controls specified!');

		return (inputManager: InputManager) => {
			return {
				down: controls.every(c => c(inputManager).down),
				once: controls.every(c => c(inputManager).once),
				up: controls.every(c => c(inputManager).up)
			};
		};
	}

	static or(...controls: Array<Control>): Control {
		if (controls.length < 2) throw new Error('Less than two controls specified!');

		return (inputManager: InputManager) => {
			const first = controls.find(c => c(inputManager).down);
			if (!first) {
				return InputStateEmpty;
			}
			const firstData = first(inputManager);

			return {
				down: controls.some(c => c(inputManager).down),
				once: controls.some(c => c(inputManager).once),
				up: controls.some(c => c(inputManager).up),
				x: firstData?.x,
				y: firstData?.y
			};
		};
	}
}
