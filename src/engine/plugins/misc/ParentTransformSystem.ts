import { System } from '@ecs/ecs/System';
import { QueryPattern } from '@ecs/utils/QueryHelper';
import { useQueries, ToQueries } from '@ecs/ecs/helpers';
import Transform from '@ecs/plugins/Transform';

export type ParentTransformConfig = {
	x: boolean | number;
	y: boolean | number;
	z: boolean | number;
};

export default class ParentTransformSystem extends System {
	protected query: ToQueries<{
		parent: QueryPattern | QueryPattern[];
		follower: QueryPattern | QueryPattern[];
	}>;

	protected config: ParentTransformConfig;

	constructor(parent: QueryPattern | QueryPattern[], follower: QueryPattern | QueryPattern[], config?: Partial<ParentTransformConfig>) {
		super();

		this.config = {
			x: true,
			y: true,
			z: true,
			...config,
		}

		this.query = useQueries(this, {
			parent,
			follower
		});
	}

	update() {
		const parent = this.query.parent.first.get(Transform).position;

		const { x, y, z} = this.config;

		this.query.follower.forEach(follower => {
			const followerTransfrom = follower.get(Transform);
			followerTransfrom.position.set(
				typeof x == "number" ? parent.x + x : (x) ? parent.x : followerTransfrom.position.x,
				typeof y == "number" ? parent.y + y : (y) ? parent.y : followerTransfrom.position.y,
				typeof z == "number" ? parent.z + z : (z) ? parent.z : followerTransfrom.position.z,
			);
		});
	}
}
