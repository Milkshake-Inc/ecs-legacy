import { Entity } from '@ecs/ecs/Entity';
import { useQueries } from '@ecs/ecs/helpers';
import { System } from '@ecs/ecs/System';
import Vector3 from '@ecs/math/Vector';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { ToCannonVector3 } from '@ecs/plugins/physics/utils/Conversions';
import { all } from '@ecs/utils/QueryHelper';
import { GolfPacketOpcode, ShootBall, useGolfNetworking } from '../../constants/GolfNetworking';
import PlayerBall from '../../components/PlayerBall';
import Session from '@ecs/plugins/net/components/Session';
import Transform from '@ecs/plugins/Transform';
import Hole from '../../components/Hole';
import Collisions from '@ecs/plugins/physics/components/Collisions';
import Spawn from '../../components/Spawn';
import { BALL_HIT_POWER } from '../../constants/Physics';

export class ServerBallControllerSystem extends System {
	protected queries = useQueries(this, {
		balls: all(PlayerBall),
		hole: all(Hole),
		spawn: all(Spawn)
	});

	protected networking = useGolfNetworking(this);

	constructor() {
		super();

		this.networking.on(GolfPacketOpcode.SHOOT_BALL, (packet, entity) => this.handleShootBall(packet, entity));
		this.networking.on(GolfPacketOpcode.PREP_SHOOT, (packet, entity) => this.handlePrepShot(packet, entity));
	}

	get spawns() {
		return this.queries.spawn.map(s => s.get(Spawn)).sort(s => s.index);
	}

	updateFixed(deltaTime: number) {
		this.queries.balls.forEach(ball => {
			const transform = ball.get(Transform);
			if (transform.position == Vector3.ZERO) {
				this.resetBall(ball);
			}

			// Below the level
			if (transform.y < 0.05) {
				this.resetBall(ball);
			}

			if (ball.get(Collisions).hasCollidedWith(...this.queries.hole.map(h => h))) {
				// Debounce incase called twice?
				this.handleBallPot(ball);
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
