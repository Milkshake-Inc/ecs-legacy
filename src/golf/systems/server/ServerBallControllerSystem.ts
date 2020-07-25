import { Entity } from '@ecs/ecs/Entity';
import { useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Vector3 from '@ecs/plugins/math/Vector';
import CannonBody from '@ecs/plugins/physics/3d/components/CannonBody';
import { ToCannonVector3 } from '@ecs/plugins/tools/Conversions';
import { all } from '@ecs/ecs/Query';
import { GolfPacketOpcode, ShootBall, useGolfNetworking } from '../../constants/GolfNetworking';
import PlayerBall from '../../components/PlayerBall';
import Session from '@ecs/plugins/net/components/Session';
import Transform from '@ecs/plugins/math/Transform';
import Hole from '../../components/Hole';
import Collisions from '@ecs/plugins/physics/3d/components/Collisions';
import Spawn from '../../components/Spawn';
import { BALL_HIT_POWER } from '../../constants/Physics';
import { Plane } from 'cannon-es';

const BALL_PUTT_TIMER = 1000;
const OUT_OF_BOUNDS_TIMER = 1000;

export class ServerBallControllerSystem extends System {
	protected queries = useQueries(this, {
		balls: all(PlayerBall),
		hole: all(Hole),
		spawn: all(Spawn),
		ground: all(Plane)
	});

	protected networking = useGolfNetworking(this);

	constructor() {
		super();

		this.networking.on(GolfPacketOpcode.SHOOT_BALL, (packet, entity) => this.handleShootBall(packet, entity));
		this.networking.on(GolfPacketOpcode.PREP_SHOOT, (packet, entity) => this.handlePrepShot(packet, entity));
	}

	get spawns() {
		return this.queries.spawn.map(s => s.get(Spawn)).sort((a, b) => a.index - b.index);
	}

	updateFixed(deltaTime: number) {
		this.queries.balls.forEach(ball => {
			const transform = ball.get(Transform);
			const collisions = ball.get(Collisions);
			const playerBall = ball.get(PlayerBall);

			// Hack?
			if (transform.position == Vector3.ZERO) {
				this.resetBall(ball);
			}

			if (collisions.hasCollidedWith(...this.queries.ground.entities) && !playerBall.isBallResetting) {
				playerBall.isBallResetting = true;
				setTimeout(() => {
					this.resetBall(ball);
					playerBall.isBallResetting = false;
				}, OUT_OF_BOUNDS_TIMER);
			}

			if (collisions.hasCollidedWith(...this.queries.hole.entities)) {
				const timeSinceLastPutt = Date.now() - playerBall.timeWhenPutt;

				if(timeSinceLastPutt > BALL_PUTT_TIMER) {
					playerBall.timeWhenPutt = Date.now();
					this.handleBallPot(ball);
				}
			}
		});
	}

	resetBall(entity: Entity) {
		const cannonBody = entity.get(CannonBody);

		cannonBody.position = ToCannonVector3(this.spawns[entity.get(PlayerBall).spawn].position);
		cannonBody.velocity.set(0, 0, 0);
		cannonBody.angularVelocity.set(0, 0, 0);
	}

	handlePrepShot(packet: any, entity: Entity) {
		const cannonBody = entity.get(CannonBody);

		cannonBody.velocity.set(0, 0, 0);
		cannonBody.angularVelocity.set(0, 0, 0);
	}

	handleShootBall(packet: ShootBall, entity: Entity) {
		console.log(`Received shot from ${entity.get(Session).id}`);
		const cannonBody = entity.get(CannonBody);

		cannonBody.applyImpulse(
			ToCannonVector3(new Vector3(packet.velocity.x, 0, packet.velocity.z).multiF(BALL_HIT_POWER)),
			ToCannonVector3(Vector3.ZERO)
		);
	}

	nextHole(entity: Entity) {
		// TODO this should be shared across room
		const spawns = this.spawns;
		const playerBall = entity.get(PlayerBall);

		playerBall.spawn = playerBall.spawn == spawns.length - 1 ? 0 : playerBall.spawn + 1;
	}

	handleBallPot(entity: Entity) {
		this.networking.sendTo(entity, { opcode: GolfPacketOpcode.POT_BALL });
		this.nextHole(entity);
		setTimeout(() => this.resetBall(entity), 1500);
	}
}
