export default class TileMap {
	public constructor(public data: number[][]) {}

	get width() {
		return this.data && this.data[0] ? this.data[0].length : 0;
	}

	get height() {
		return this.data ? this.data.length : 0;
	}
}
