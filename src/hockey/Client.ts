import { Engine } from '@ecs/ecs/Engine';
import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { Events, useQueries } from '@ecs/ecs/helpers';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import { Query } from '@ecs/ecs/Query';
import Color from '@ecs/math/Color';
import Vector2 from '@ecs/math/Vector2';
import { DebugSystem } from '@ecs/plugins/debug/systems/DebugSystem';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import Session from '@ecs/plugins/net/components/Session';
import ClientConnectionSystem from '@ecs/plugins/net/systems/ClientConnectionSystem';
import ClientInputSenderSystem from '@ecs/plugins/net/systems/ClientInputSenderSystem';
import ClientPingSystem from '@ecs/plugins/net/systems/ClientPingSystem';
import Position from '@ecs/plugins/Position';
import { Interactable } from '@ecs/plugins/render/components/Interactable';
import Sprite from '@ecs/plugins/render/components/Sprite';
import Text from '@ecs/plugins/render/components/Text';
import { PixiEngine } from '@ecs/plugins/render/PixiEngine';
import { Sound } from '@ecs/plugins/sound/components/Sound';
import SoundSystem, { SoundState } from '@ecs/plugins/sound/systems/SoundSystem';
import { LoadPixiAssets } from '@ecs/utils/PixiHelper';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import { SparksTrail } from './components/Emitters';
import Score from './components/Score';
import Hockey, { PlayerColor } from './spaces/Hockey';
import Splash from './spaces/Splash';
import { HockeyClientWorldSnapshotSystem } from './systems/HockeyClientWorldSnapshotSystem';
import HudSystem, { Hud } from './systems/HudSystem';
import { PuckSoundSystem } from './systems/PuckSoundSystem';

const Assets = {
	Background: 'assets/hockey/background.png',
	RedPaddle: 'assets/hockey/red.png',
	BluePaddle: 'assets/hockey/blue.png',
	Puck: 'assets/hockey/puck.png',
	Scoreboard: 'assets/hockey/scoreboard.png',
	MusicOn: 'assets/hockey/musicOn.png',
	MusicOff: 'assets/hockey/musicOff.png'
};

class MuteButton {}

export default class MuteButtonSystem extends IterativeSystem {
	protected queries = useQueries(this, {
		soundState: all(SoundState),
		clickEvents: [all(MuteButton, Sprite, Events)]
	});

	constructor() {
		super(makeQuery(all(MuteButton, Sprite)));
	}

	entityAdded = (entitySnapshot: EntitySnapshot) => {
		this.updateSprite(entitySnapshot.entity, this.soundState.muted);
	};

	update(deltaTime: number) {
		super.update(deltaTime);

		this.queries.clickEvents.forEach(entity => {
			console.log('Event');
			this.soundState.toggle();
			this.updateSprite(entity, this.soundState.muted);

			SoundState.toStorage(this.soundState);
		});
	}

	updateSprite(entity: Entity, muted: boolean) {
		entity.get(Sprite).imageUrl = muted ? Assets.MusicOff : Assets.MusicOn;
	}

	get soundState() {
		return this.queries.soundState.first.get(SoundState);
	}
}

export class ClientHockey extends Hockey {
	protected sessionQuery: Query;

	constructor(engine: Engine) {
		super(engine);

		this.sessionQuery = makeQuery(all(Session));
		this.worldEngine.addQuery(this.sessionQuery);
	}

	protected async preload() {
		return LoadPixiAssets(Assets);
	}

	setup() {
		this.addSystem(new InputSystem());
		this.addSystem(new SoundSystem());
		this.addSystem(new MuteButtonSystem());
		// this.addSystem(new InteractionSystem());

		const background = new Entity();
		background.add(Position);
		background.add(Sprite, { imageUrl: Assets.Background, anchor: Vector2.ZERO });
		background.add(Sound, { src: 'assets/hockey/music.mp3', loop: true, seek: 0, volume: 0.1 });
		this.addEntities(background);

		this.addSystem(new ClientInputSenderSystem());

		super.setup();

		this.addSystem(new PuckSoundSystem());

		this.addEntity(new Entity().add(Score));

		this.addSystem(new HockeyClientWorldSnapshotSystem(this.worldEngine, this.createPaddle.bind(this)));

		const scoreboard = new Entity();
		scoreboard.add(Position, { x: 1280 / 2, z: 10 });
		scoreboard.add(Sprite, { imageUrl: Assets.Scoreboard, anchor: new Vector2(0.5, 0) });
		this.addEntities(scoreboard);

		const hud = this.hud();
		this.addEntities(hud.redScore, hud.blueScore);

		const backgroundMusic = new Entity();
		backgroundMusic.add(Sound, { src: 'assets/hockey/music.mp3', loop: true, seek: 0, volume: 0.05 });
		this.addEntity(backgroundMusic);

		const muteButton = new Entity();
		muteButton.add(Position, { x: 0, y: 720, z: 1000 });
		muteButton.add(Sprite, { imageUrl: Assets.MusicOn, anchor: new Vector2(0, 1) });
		muteButton.add(MuteButton);
		muteButton.add(Interactable);
		this.addEntity(muteButton);

		this.addSystem(new HudSystem(hud));

		// this.addSystem(new HockeyClientSnapshotDebugSystem());
	}

	createPaddle(entity: Entity, name: string, player: PlayerColor, spawnPosition: { x: number; y: number }) {
		super.createPaddle(entity, name, player, spawnPosition);
		entity.add(Sprite, { imageUrl: player == PlayerColor.Red ? Assets.RedPaddle : Assets.BluePaddle });
		entity.add(SparksTrail(), { offset: Vector2.EQUAL(-50) });
		entity.add(Text, { value: name });
	}

	createPuck(): Entity {
		const puck = super.createPuck();
		puck.add(Sprite, { imageUrl: Assets.Puck });
		return puck;
	}

	hud(): Hud {
		const redScore = new Entity();
		redScore.add(Position, { x: 1280 / 2 - 50, y: 30, z: 10 });
		redScore.add(Text, { value: '0', tint: Color.Red, size: 50 });

		const blueScore = new Entity();
		blueScore.add(Position, { x: 1280 / 2 + 50, y: 30, z: 10 });
		blueScore.add(Text, { value: '0', tint: Color.Blue, size: 50 });

		return { redScore, blueScore };
	}
}

const engine = new PixiEngine();
engine.addSystem(new ClientConnectionSystem(engine), 1000); // has to be low priority so systems get packets before the queue is cleared
engine.addSystem(new ClientPingSystem());
engine.addSystem(new DebugSystem());

engine.registerSpaces(new Splash(engine, 'splash'), new ClientHockey(engine));

engine.getSpace('splash').open();

setTimeout(() => {
	engine.getSpace('splash').close();
	engine.getSpace('hockey').open();
}, 1000);

console.log('🎉 Client');
