export default class Keyboard {
    private KEY_UP = "keyup";
    private KEY_DOWN = "keydown";

    private keyMap: Map<number, String>;

    constructor() {
        this.keyMap = new Map();
        window.addEventListener(this.KEY_UP, this.handleKeyboardUp.bind(this));
        window.addEventListener(this.KEY_DOWN, this.handleKeyboardDown.bind(this));
    }

    public isDown(key: number): boolean {
        return this.keyMap.has(key);
    }

    public isDownOnce(key: number): boolean {
        return this.keyMap.get(key) == this.KEY_DOWN;
    }

    public isUpOnce(key: number): boolean {
        return this.keyMap.get(key) == this.KEY_UP;
    }

    public isEitherDown(keys: Array<number>): boolean {
        for (let key of keys) {
            if (this.keyMap.has(key)) return true;
        }

        return false;
    }

    public isAllDown(keys: Array<number>): boolean {
        for (let key of keys) {
            if (!this.keyMap.has(key)) return false;
        }

        return true;
    }

    public update(deltaTime: number) {
        for (let key of Array.from(this.keyMap.keys())) {
            if (this.isDownOnce(key)) this.keyMap.set(key, null);
            if (this.isUpOnce(key)) this.keyMap.delete(key);
        }
    }

    handleKeyboardDown(e: KeyboardEvent) {

            this.keyMap.set(e.keyCode, this.keyMap.has(e.keyCode) ? null : this.KEY_DOWN);

    }

    handleKeyboardUp(e: KeyboardEvent) {
        this.keyMap.set(e.keyCode, this.KEY_UP);
    }
}