import { System } from '@ecs/ecs/System';
import { QueryPattern } from '@ecs/utils/QueryHelper';
import { useQueries, ToQueries } from '@ecs/ecs/helpers';
import Transform from '@ecs/plugins/Transform';
import Vector3 from '@ecs/math/Vector';

export type ParentTransformConfig = {
	followX: boolean;
	followY: boolean;
	followZ: boolean;
	offset?: Vector3;
};

export default class ParentTransformSystem extends System {
	protected query: ToQueries<{
		parent: QueryPattern | QueryPattern[];
		follower: QueryPattern | QueryPattern[];
	}>;

	protected config: ParentTransformConfig;

	constructor(parent: QueryPattern | QueryPattern[], follower: QueryPattern | QueryPattern[], config: ParentTransformConfig) {
		super();

		this.config = config;

		this.query = useQueries(this, {
			parent,
			follower
		});
	}

	update() {
		let parent = this.query.parent.first.get(Transform).position;

		if (this.config.offset) {
			parent = parent.add(this.config.offset);
		}

		this.query.follower.forEach(follower => {
			const followerTransfrom = follower.get(Transform);
			followerTransfrom.position.set(
				this.config.followX ? parent.x : followerTransfrom.position.x,
				this.config.followY ? parent.y : followerTransfrom.position.y,
				this.config.followZ ? parent.z : followerTransfrom.position.z
			);
		});
	}
}
