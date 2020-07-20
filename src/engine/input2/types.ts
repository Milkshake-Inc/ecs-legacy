export type ActionKey = string | number;

export type TouchInstance = {
	active: boolean;
	x: number;
	y: number;
};

export type Actions<D extends ActionKey, A extends ActionKey, T extends ActionKey> = {
	digital: Record<D, 1 | 0>;
	analog: Record<A, number>;
	touch: Record<T, Record<number, TouchInstance>>;
};

export enum GamepadButtons {
	A = 'A',
	B = 'B',
	X = 'X',
	Y = 'Y',
	L1 = 'L1',
	R1 = 'R1',
	Start = 'Start',
	Back = 'Back',
	LS = 'LS',
	RS = 'RS',
	DPadLeft = 'DPadLeft',
	DPadRight = 'DPadRight',
	DPadUp = 'DPadUp',
	DPadDown = 'DPadDown'
}

export enum GamepadAxis {
	LX = 'lx',
	LY = 'ly',
	RX = 'rx',
	RY = 'ry',
	L2 = 'l2',
	R2 = 'r2'
}

export enum MouseButtons {
	Left = 'Left',
	Right = 'Right',
	Middle = 'Middle'
}

export enum MouseAxis {
	X = 'X',
	Y = 'Y',
	Wheel = 'Wheel'
}

export type GamepadBindings<D extends ActionKey, A extends ActionKey, T extends ActionKey> = {
	buttons?: Partial<Record<GamepadButtons, D>>;
	axis?: Partial<Record<GamepadAxis, A>>;
	enabled?: D;
};

export type MouseBindings<D extends ActionKey, A extends ActionKey, T extends ActionKey> = {
	buttons?: Partial<Record<MouseButtons, D>>;
	axis?: Partial<Record<MouseAxis, A>>;
	enabled?: D;
};

export type KeyboardBindings<D extends ActionKey, A extends ActionKey, T extends ActionKey> = {
	axis: null;
	enabled?: D;
	buttons?: Partial<Record<Keys, D>>;
};

export type DeviceBindings<D extends ActionKey, A extends ActionKey, T extends ActionKey> =
	| GamepadBindings<D, A, T>
	| MouseBindings<D, A, T>
	| KeyboardBindings<D, A, T>;

export type InputBindings<D extends ActionKey, A extends ActionKey, T extends ActionKey> = {
	gamepad?: GamepadBindings<D, A, T>;
	mouse?: MouseBindings<D, A, T>;
	keys?: KeyboardBindings<D, A, T>;
	touch?: {
		enabled?: D;
		touches?: T;
	};
};

export enum InputDevice {
	None,
	Keyboard,
	Gamepad,
	Mouse
}

export enum Keys {
	Zero = '0',
	One = '1',
	Two = '2',
	Three = '3',
	Four = '4',
	Five = '5',
	Six = '6',
	Seven = '7',
	Eight = '8',
	Nine = '9',
	Backspace = 'backspace',
	Tab = 'tab',
	Enter = 'enter',
	Shift = 'shift',
	Ctrl = 'ctrl',
	Alt = 'alt',
	PauseBreak = 'pause/break',
	CapsLock = 'caps lock',
	Escape = 'escape',
	Space = 'space',
	PageUp = 'page up',
	PageDown = 'page down',
	End = 'end',
	Home = 'home',
	Left = 'left',
	Up = 'up',
	Right = 'right',
	Down = 'down',
	Insert = 'insert',
	Delete = 'delete',
	Command = 'command',
	RightCommand = 'right command',
	NumpadAsterisk = 'numpad *',
	NumpadPlus = 'numpad +',
	NumpadMinus = 'numpad -',
	NumpadPeriod = 'numpad .',
	NumpadForwardslash = 'numpad /',
	NumLock = 'num lock',
	ScrollLock = 'scroll lock',
	MyComputer = 'my computer',
	MyCalculator = 'my calculator',
	Semicolon = ';',
	Equals = '=',
	Comma = ',',
	Dash = '-',
	Period = '.',
	Forwardslash = '/',
	Quote = '`',
	OpenBrace = '[',
	Backslash = '\\',
	CloseBrace = ']',
	Apostrophe = "'",
	A = 'a',
	B = 'b',
	C = 'c',
	D = 'd',
	E = 'e',
	F = 'f',
	G = 'g',
	H = 'h',
	I = 'i',
	J = 'j',
	K = 'k',
	L = 'l',
	M = 'm',
	N = 'n',
	O = 'o',
	P = 'p',
	Q = 'q',
	R = 'r',
	S = 's',
	T = 't',
	U = 'u',
	V = 'v',
	W = 'w',
	X = 'x',
	Y = 'y',
	Z = 'z',
	F1 = 'f1',
	F2 = 'f2',
	F3 = 'f3',
	F4 = 'f4',
	F5 = 'f5',
	F6 = 'f6',
	F7 = 'f7',
	F8 = 'f8',
	F9 = 'f9',
	F10 = 'f10',
	F11 = 'f11',
	F12 = 'f12',
	Numpad0 = 'numpad 0',
	Numpad1 = 'numpad 1',
	Numpad2 = 'numpad 2',
	Numpad3 = 'numpad 3',
	Numpad4 = 'numpad 4',
	Numpad5 = 'numpad 5',
	Numpad6 = 'numpad 6',
	Numpad7 = 'numpad 7',
	Numpad8 = 'numpad 8',
	Numpad9 = 'numpad 9'
}
