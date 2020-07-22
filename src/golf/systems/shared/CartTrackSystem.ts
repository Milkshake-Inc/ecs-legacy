import { all, makeQuery } from '@ecs/ecs/Query';
import Track from '../../components/terrain/Track';
import { useQueries, useState } from '@ecs/ecs/helpers';
import { Entity } from '@ecs/ecs/Entity';
import Transform from '@ecs/plugins/math/Transform';
import { Query } from '@ecs/ecs/Query';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import Cart from '../../components/terrain/Cart';
import MathHelper from '@ecs/plugins/math/MathHelper';

export class TrackPath {
	public path: Entity[] = [];
}

export default class CartTrackSystem extends IterativeSystem {
	protected queries = useQueries(this, {
		track: all(Transform, Track)
	});

	protected state = useState(this, new TrackPath());

	constructor() {
		super(makeQuery(all(Transform, Cart)));
	}

	updateEntity(entity: Entity, dt: number) {
		const transform = entity.get(Transform);

		if (entity.has(Cart)) {
			const cart = entity.get(Cart);

			if (cart.trackIndex == undefined) {
				const { x, z } = transform;

				const trackIndex = this.state.path.findIndex(
					t => Math.round(t.get(Transform).x) == Math.round(x) && Math.round(t.get(Transform).z) == Math.round(z)
				);

				cart.previousTrackIndex = trackIndex != -1 ? trackIndex - 1 : this.state.path.length - 1;
				cart.trackIndex = trackIndex != -1 ? trackIndex : 0;
				cart.startRotation = cart.targetRotation = transform.ry;
			}

			// increment to next index if reached target
			if (cart.elapsed > 1000) {
				cart.elapsed -= 1000;

				cart.previousTrackIndex = cart.trackIndex;
				cart.trackIndex = cart.trackIndex == this.state.path.length - 1 ? 0 : cart.trackIndex + 1;

				cart.startRotation = transform.ry;
				cart.targetRotation = transform.ry + MathHelper.toRadians(this.state.path[cart.trackIndex].get(Track).rotate);
			}

			transform.position = MathHelper.lerpVector3(
				this.state.path[cart.previousTrackIndex].get(Transform).position,
				this.state.path[cart.trackIndex].get(Transform).position,
				MathHelper.map(0, 1000, 0, 1, cart.elapsed)
			);

			transform.ry = MathHelper.lerpAngle(cart.startRotation, cart.targetRotation, MathHelper.map(0, 1000, 0, 1, cart.elapsed));

			cart.elapsed += dt;
		}
	}

	update(dt: number) {
		if (this.state.path.length == 0) {
			const tracks = this.queries.track;

			this.state.path = this.findNeighbors(tracks.first, tracks, [tracks.first]);
			this.state.path.reverse();
		}

		super.update(dt);
	}

	findNeighbors(entity: Entity, tracks: Query, sortedPath: Entity[]) {
		const { x: startX, z: startZ } = entity.get(Transform);

		const findNeighbour = (x: number, z: number) => {
			return tracks.find(t => Math.round(t.get(Transform).x) == Math.round(x) && Math.round(t.get(Transform).z) == Math.round(z));
		};

		const neighbors = [
			findNeighbour(startX - 1, startZ),
			findNeighbour(startX + 1, startZ),
			findNeighbour(startX, startZ - 1),
			findNeighbour(startX, startZ + 1)
		];

		for (const neighbor of neighbors) {
			if (neighbor && !sortedPath.includes(neighbor)) {
				sortedPath.push(neighbor);
				return this.findNeighbors(neighbor, tracks, sortedPath);
			}
		}

		return sortedPath;
	}
}
