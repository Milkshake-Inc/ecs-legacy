import RenderSystem from '@ecs/plugins/render/systems/RenderSystem';
import Space from '@ecs/plugins/space/Space';
import TickerEngine from '@ecs/TickerEngine';
import Hockey from './hockey/Hockey';
import Splash from './splash/Splash';
import ClientConnectionSystem from '@ecs/plugins/net/systems/ClientConnectionSystem';
import ClientPingSystem from '@ecs/plugins/net/systems/ClientPingSystem';

class PixiEngine extends TickerEngine {
	protected spaces: Map<string, Space>;

	constructor(tickRate = 60) {
		super(tickRate);

		this.addSystem(new RenderSystem());
		this.addSystem(new ClientConnectionSystem(this), 1000); // has to be low priority so systems get packets before the queue is cleared
		this.addSystem(new ClientPingSystem());

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

	protected buildCallback(callback: () => void) {
		const handleAnimationFrame = () => {
			callback();
			requestAnimationFrame(handleAnimationFrame);
		};

		requestAnimationFrame(handleAnimationFrame);
	}
}

const engine = new PixiEngine();
engine.registerSpaces(new Splash(engine, 'splash'), new Hockey(engine, 'hockey'));

engine.getSpace('splash').open();

setTimeout(() => {
	engine.getSpace('splash').close();
	engine.getSpace('hockey').open();
}, 500);

console.log('🎉 Client');
