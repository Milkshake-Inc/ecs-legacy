import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { Query } from '@ecs/ecs/Query';
import Color from '@ecs/math/Color';
import Vector2 from '@ecs/math/Vector2';
import Input from '@ecs/plugins/input/components/Input';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import { WorldSnapshot } from '@ecs/plugins/net/components/Packet';
import RemoteSession from '@ecs/plugins/net/components/RemoteSession';
import Session from '@ecs/plugins/net/components/Session';
import ClientConnectionSystem from '@ecs/plugins/net/systems/ClientConnectionSystem';
import ClientInputSenderSystem from '@ecs/plugins/net/systems/ClientInputSenderSystem';
import ClientPingSystem from '@ecs/plugins/net/systems/ClientPingSystem';
import { WorldSnapshotHandlerSystem } from '@ecs/plugins/net/systems/PacketHandlerSystem';
import PhysicsBody from '@ecs/plugins/physics/components/PhysicsBody';
import Position from '@ecs/plugins/Position';
import BitmapText from '@ecs/plugins/render/components/BitmapText';
import Sprite from '@ecs/plugins/render/components/Sprite';
import RenderSystem from '@ecs/plugins/render/systems/RenderSystem';
import Space from '@ecs/plugins/space/Space';
import TickerEngine from '@ecs/TickerEngine';
import { LoadPixiAssets } from '@ecs/utils/PixiHelper';
import { all, makeQuery } from '@ecs/utils/QueryHelper';
import Hockey, { PlayerColor, Snapshot, SnapshotEntity } from './spaces/Hockey';
import Splash from './spaces/Splash';
import HudSystem, { Hud } from './systems/HudSystem';
import { PuckSoundSystem } from './systems/PuckSoundSystem';
import Score from './components/Score';
import { SparksTrail } from './components/Emitters';

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

const Assets = {
	Background: 'assets/hockey/background.png',
	RedPaddle: 'assets/hockey/red.png',
	BluePaddle: 'assets/hockey/blue.png',
	Puck: 'assets/hockey/puck.png',
	Scoreboard: 'assets/hockey/scoreboard.png'
};

class ClientHockey extends Hockey {
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

		const background = new Entity();
		background.add(Position);
		background.add(Sprite, { imageUrl: Assets.Background, anchor: Vector2.ZERO });
		this.addEntities(background);

		this.addSystem(new ClientInputSenderSystem());

		super.setup();

		this.addSystem(new PuckSoundSystem());

		this.addEntity(new Entity().add(Score));

		this.addSystem(
			new WorldSnapshotHandlerSystem<Snapshot>((e, p) => this.processSnapshot(p))
		);

		const scoreboard = new Entity();
		scoreboard.add(Position, { x: 1280 / 2, z: 10 });
		scoreboard.add(Sprite, { imageUrl: Assets.Scoreboard, anchor: new Vector2(0.5, 0) });
		this.addEntities(scoreboard);

		const hud = this.hud();
		this.addEntities(hud.redScore, hud.blueScore);

		this.addSystem(new HudSystem(hud));
	}

	processSnapshot({ snapshot }: WorldSnapshot<Snapshot>) {
		const processEntity = (entity: Entity, snapshot: SnapshotEntity) => {
			const physics = entity.get(PhysicsBody);

			physics.position = {
				x: snapshot.position.x,
				y: snapshot.position.y
			};

			physics.velocity = {
				x: snapshot.velocity.x,
				y: snapshot.velocity.y
			};
		};

		const getSessionId = (entity: Entity): string => {
			if (entity.has(Session)) {
				const session = entity.get(Session);
				return session.id;
			}

			if (entity.has(RemoteSession)) {
				const session = entity.get(RemoteSession);
				return session.id;
			}

			return '';
		};

		this.paddleQuery.entities.filter(localPaddle => {
			const sessionId = getSessionId(localPaddle);

			const hasLocalPaddleInSnapshot = snapshot.paddles.find(snapshot => snapshot.sessionId == sessionId);

			if (!hasLocalPaddleInSnapshot) {
				console.log('Player no longer in snapshot - Removing');
				this.worldEngine.removeEntity(localPaddle);
			}
		});

		snapshot.paddles.forEach(snapshotPaddle => {
			const localPaddle = this.paddleQuery.entities.find(entity => {
				const sessionId = getSessionId(entity);
				return sessionId == snapshotPaddle.sessionId;
			});

			if (!localPaddle) {
				const localEntity = this.sessionQuery.entities.find(entity => {
					return entity.get(Session).id == snapshotPaddle.sessionId;
				});

				if (localEntity) {
					console.log('Creating local player');
					this.createPaddle(localEntity, snapshotPaddle.color, snapshotPaddle.position);
					localEntity.add(Input.BOTH());
				} else {
					const newEntity = new Entity();
					console.log('Creating remote player!');
					newEntity.add(RemoteSession, { id: snapshotPaddle.sessionId });
					this.createPaddle(newEntity, snapshotPaddle.color, snapshotPaddle.position);
					this.worldEngine.addEntity(newEntity);
				}
			} else {
				processEntity(localPaddle, snapshotPaddle);
			}
		});

		processEntity(this.puck, snapshot.puck);

		const score = this.scoreQuery.first.get(Score);
		Object.assign(score, snapshot.scores);
	}

	createPaddle(entity: Entity, player: PlayerColor, spawnPosition: { x: number; y: number }) {
		super.createPaddle(entity, player, spawnPosition);
		entity.add(Sprite, { imageUrl: player == PlayerColor.Red ? Assets.RedPaddle : Assets.BluePaddle });
		entity.add(SparksTrail());
	}

	createPuck(): Entity {
		const puck = super.createPuck();

		puck.add(Sprite, { imageUrl: Assets.Puck });

		return puck;
	}

	hud(): Hud {
		const redScore = new Entity();
		redScore.add(Position, { x: 1280 / 2 - 80, y: 5, z: 10 });
		redScore.add(BitmapText, { text: '0', tint: Color.Red, size: 50 });

		const blueScore = new Entity();
		blueScore.add(Position, { x: 1280 / 2 + 50, y: 5, z: 10 });
		blueScore.add(BitmapText, { text: '0', tint: Color.Blue, size: 50 });

		return { redScore, blueScore };
	}
}

const engine = new PixiEngine();
engine.registerSpaces(new Splash(engine, 'splash'), new ClientHockey(engine));

engine.getSpace('splash').open();

setTimeout(() => {
	engine.getSpace('splash').close();
	engine.getSpace('hockey').open();
}, 1000);

console.log('🎉 Client');
