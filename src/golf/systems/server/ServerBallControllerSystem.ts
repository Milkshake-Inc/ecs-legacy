import { Entity } from '@ecs/ecs/Entity';
import { useQueries, useSingletonQuery } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Vector3 from '@ecs/plugins/math/Vector';
import CannonBody from '@ecs/plugins/physics/3d/components/CannonBody';
import { ToCannonVector3, ToVector3 } from '@ecs/plugins/tools/Conversions';
import { all } from '@ecs/ecs/Query';
import { GolfPacketOpcode, ShootBall, useGolfNetworking, GolfGameState } from '../../constants/GolfNetworking';
import PlayerBall from '../../components/PlayerBall';
import Session from '@ecs/plugins/net/components/Session';
import Hole from '../../components/Hole';
import Collisions from '@ecs/plugins/physics/3d/components/Collisions';
import Spawn from '../../components/Spawn';
import { BALL_HIT_POWER } from '../../constants/Physics';
import { Plane } from 'cannon-es';
import GolfPlayer from '../../components/GolfPlayer';

const BALL_PUTT_TIMER = 1000;
const OUT_OF_BOUNDS_TIMER = 1000;

export class ServerBallControllerSystem extends System {
	protected gameState = useSingletonQuery(this, GolfGameState);

	protected queries = useQueries(this, {
		balls: all(PlayerBall),
		hole: all(Hole),
		ground: all(Plane)
	});

	protected networking = useGolfNetworking(this);

	constructor() {
		super();

		this.networking.on(GolfPacketOpcode.SHOOT_BALL, (packet, entity) => this.handleShootBall(packet, entity));
		this.networking.on(GolfPacketOpcode.PREP_SHOOT, (packet, entity) => this.handlePrepShot(packet, entity));
	}

	updateFixed(deltaTime: number) {
		this.queries.balls.forEach(ball => {
			const collisions = ball.get(Collisions);
			const playerBall = ball.get(PlayerBall);

			if (collisions.hasCollidedWith(...this.queries.ground.entities) && !playerBall.isBallResetting) {
				playerBall.isBallResetting = true;
				setTimeout(() => {
					ball.get(CannonBody).setPosition(playerBall.lastPosition);
					playerBall.isBallResetting = false;
				}, OUT_OF_BOUNDS_TIMER);
			}

			if (collisions.hasCollidedWith(...this.queries.hole.entities)) {
				const timeSinceLastPutt = Date.now() - playerBall.timeWhenPutt;

				if (timeSinceLastPutt > BALL_PUTT_TIMER) {
					playerBall.timeWhenPutt = Date.now();
					this.handleBallPot(ball);
				}
			}
		});
	}

	handlePrepShot(packet: any, entity: Entity) {
		const cannonBody = entity.get(CannonBody);
		if (cannonBody.moving) return;

		cannonBody.velocity.set(0, 0, 0);
		cannonBody.angularVelocity.set(0, 0, 0);
	}

	handleShootBall(packet: ShootBall, entity: Entity) {
		const cannonBody = entity.get(CannonBody);
		if (cannonBody.moving) return;

		console.log(`Received shot from ${entity.get(Session).id}`);
		const golfPlayer = entity.get(GolfPlayer);
		const playerBall = entity.get(PlayerBall);

		golfPlayer.score[this.gameState().currentHole]++;

		// Store last pos so we can reset ball if it goes out of bounds
		playerBall.lastPosition = ToVector3(cannonBody.position);

		cannonBody.applyImpulse(
			ToCannonVector3(new Vector3(packet.velocity.x, 0, packet.velocity.z).multiF(BALL_HIT_POWER)),
			ToCannonVector3(Vector3.ZERO)
		);
	}

	handleBallPot(entity: Entity) {
		this.networking.sendTo(entity, { opcode: GolfPacketOpcode.POT_BALL });

		setTimeout(() => {
			entity.remove(PlayerBall);
		}, 1500);
	}
}
