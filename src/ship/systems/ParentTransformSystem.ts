import { System } from '@ecs/ecs/System';
import { QueryPattern } from '@ecs/utils/QueryHelper';
import { useQueries, ToQueries } from '@ecs/ecs/helpers';
import Transform from '@ecs/plugins/Transform';

export type ParentTransformConfig = {
	followX: boolean;
	followY: boolean;
	followZ: boolean;
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
			parent: parent,
			follower: follower
		});
	}

	update() {
		const parent = this.query.parent.first.get(Transform).position;

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
