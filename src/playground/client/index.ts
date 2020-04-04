import RenderSystem from '@ecs/plugins/render/systems/RenderSystem';
import TickerEngine from '@ecs/TickerEngine';
import Space from '@ecs/plugins/space/Space';
import Hockey from './hockey/Hockey';
import Splash from './splash/Splash';

class PixiEngine extends TickerEngine {
	protected spaces: Map<string, Space>;

	constructor(tickRate = 60) {
		super(tickRate);

		this.addSystem(new RenderSystem());

		this.spaces = new Map();
	}

	public getSpace(spaceName: string) {
		return this.spaces.get(spaceName);
	}

	public registerSpaces(...spaces: Space[]) {
		spaces.forEach(v => this.spaces.set(v.name, v));
	}

	protected getTime(): number {
		return performance.now();
	}
}

const engine = new PixiEngine();
engine.registerSpaces(new Splash(engine, 'splash'), new Hockey(engine, 'hockey'));

engine.getSpace('splash').open();

setTimeout(() => {
	engine.getSpace('splash').close();
	engine.getSpace('hockey').open();
}, 2000);
console.log('🎉 Client');
