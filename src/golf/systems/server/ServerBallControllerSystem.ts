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

export class ServerBallControllerSystem extends System {
	protected queries = useQueries(this, {
		balls: all(PlayerBall),
		hole: all(Hole)
	});

	protected network = useGolfNetworking(this);

	constructor() {
		super();

		this.network.on(GolfPacketOpcode.SHOOT_BALL, (packet, entity) => this.handleShootBall(packet, entity));
		this.network.on(GolfPacketOpcode.PREP_SHOOT, (packet, entity) => this.handlePrepShot(packet, entity));
	}

	updateFixed(deltaTime: number) {
		this.queries.balls.forEach(ball => {
			const transform = ball.get(Transform);
			// Below the level
			if (transform.y < 0.3) {
				this.resetBall(ball);
			}

			if (ball.get(Collisions).hasCollidedWith(this.queries.hole.first)) {
				// Debounce incase called twice?
				console.log('SUNSHINE DAYS!');
				setTimeout(() => this.resetBall(ball), 1000);
			}
		});
	}

	resetBall(entity: Entity) {
		const cannonBody = entity.get(CannonBody);

		cannonBody.position.set(0, 2, 0); // Course Spawn Position
		cannonBody.velocity.set(0, 0, 0);
		cannonBody.angularVelocity.set(0, 0, 0);
	}

	handlePrepShot(packet: any, entity: Entity) {
		const cannonBody = entity.get(CannonBody);

		cannonBody.velocity.set(0, 0, 0);
		cannonBody.angularVelocity.set(0, 0, 0);
	}

	handleShootBall(packet: ShootBall, entity: Entity) {
		console.log(`Recived shot from ${entity.get(Session).id}`);
		const cannonBody = entity.get(CannonBody);

		cannonBody.applyImpulse(ToCannonVector3(new Vector3(packet.velocity.x, 0, packet.velocity.z)), ToCannonVector3(Vector3.ZERO));
	}
}
