import { Entity } from '@ecs/ecs/Entity';
import { useQueries, useSingletonQuery } from '@ecs/ecs/helpers';
import { all } from '@ecs/ecs/Query';
import { System } from '@ecs/ecs/System';
import Transform from '@ecs/plugins/math/Transform';
import Session from '@ecs/plugins/net/components/Session';
import Collisions from '@ecs/plugins/physics/3d/components/Collisions';
import AmmoBody from '@ecs/plugins/physics/ammo/components/AmmoBody';
import GolfPlayer from '../../components/GolfPlayer';
import Ground from '../../components/Ground';
import Hole from '../../components/Hole';
import PlayerBall from '../../components/PlayerBall';
import { GolfGameState, GolfPacketOpcode, ShootBall, useGolfNetworking } from '../../constants/GolfNetworking';

const BALL_PUTT_TIMER = 10000;
const OUT_OF_BOUNDS_TIMER = 1000;
const VELOCITY_MULTIPLIER = 0.4;

export class ServerBallControllerSystem extends System {
	protected gameState = useSingletonQuery(this, GolfGameState);

	protected queries = useQueries(this, {
		balls: all(PlayerBall),
		hole: all(Hole),
		ground: all(Ground)
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

			if (collisions.hasCollidedWith(this.queries.ground.first) && !playerBall.isBallResetting) {
				playerBall.isBallResetting = true;
				setTimeout(() => {
					playerBall.isBallResetting = false;

					const body = ball.get(AmmoBody);

					body.clearForces();
					body.setPosition(playerBall.lastPosition);
				}, OUT_OF_BOUNDS_TIMER);
			}

			if (collisions.hasCollidedWith(...this.queries.hole.entities)) {
				const timeSinceLastPutt = Date.now() - playerBall.timeWhenPutt;

				// TODO
				// Maybe golfPlayer.hasScored = true
				// & Remove collision object?
				if (timeSinceLastPutt > BALL_PUTT_TIMER) {
					playerBall.timeWhenPutt = Date.now();
					this.handleBallPot(ball);
				}
			}
		});
	}

	handlePrepShot(packet: any, entity: Entity) {
		const body = entity.get(AmmoBody);

		// TODO
		// Stops player from shooting
		// if( body.body.getLinearVelocity().length() > 0) {
		// 	console.log("Ball not stopped...")
		// 	return;
		// }

		body.clearForces();
	}

	handleShootBall(packet: ShootBall, entity: Entity) {
		const body = entity.get(AmmoBody);
		const { position } = entity.get(Transform);
		const { score } = entity.get(GolfPlayer);
		const { lastPosition } = entity.get(PlayerBall);
		const { currentHole } = this.gameState();

		console.log(`Received shot from ${entity.get(Session).id} - Hole: ${currentHole} CurrentScore: ${score[currentHole]}`);

		score[currentHole]++;

		lastPosition.set(position.x, position.y, position.z);

		body.applyCentralImpulse({
			x: packet.velocity.x * VELOCITY_MULTIPLIER,
			y: 0,
			z: packet.velocity.z * VELOCITY_MULTIPLIER
		});
	}

	handleBallPot(entity: Entity) {
		this.networking.sendTo(entity, { opcode: GolfPacketOpcode.POT_BALL });

		setTimeout(() => {
			entity.remove(PlayerBall);
		}, 1500);
	}
}
