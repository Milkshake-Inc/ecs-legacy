import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { QueriesSystem } from '@ecs/ecs/helpers/StatefulSystems';
import Color from '@ecs/math/Color';
import { ClientPingState } from '@ecs/plugins/net/components/ClientPingState';
import { ClientPingStateQuery } from '@ecs/plugins/net/systems/ClientPingSystem';
import { ClientWorldSnapshotState, ClientWorldSnapshotStateQuery } from '@ecs/plugins/net/systems/ClientWorldSnapshotSystem';
import Position from '@ecs/plugins/Position';
import { Graphics } from 'pixi.js';

export class HockeyClientSnapshotDebugSystem extends QueriesSystem<typeof ClientWorldSnapshotStateQuery & typeof ClientPingStateQuery> {
	private graphics: Graphics;

	constructor() {
		super({
			...ClientWorldSnapshotStateQuery,
			...ClientPingStateQuery
		});
	}

	public onAddedToEngine(engine: Engine) {
		super.onAddedToEngine(engine);

		const entity = new Entity();
		entity.add(Position, { z: 10 });
		entity.add((this.graphics = new Graphics()));

		engine.addEntity(entity);
	}

	public update(deltaTime: number) {
		this.graphics.clear();
		this.graphics.beginFill(0x00ff00, 1);
		this.graphics.drawRect(0, 0, 400, 50);

		if (this.queries.snapshotState.first) {
			const { snapshotsRewrote } = this.queries.snapshotState.first.get(ClientWorldSnapshotState);
			const { serverTick } = this.queries.pingState.first.get(ClientPingState);

			for (let index = 0; index < 400; index++) {
				const targetTick = serverTick - index;
				const position = 400 - index;

				let color = Color.White;

				if (snapshotsRewrote.includes(targetTick)) {
					const amount = snapshotsRewrote.filter(a => a == targetTick).length;

					if (amount == 1) color = Color.YellowGreen;
					if (amount > 1) color = Color.Tomato;
				}

				this.graphics.beginFill(color, 1);
				this.graphics.drawRect(position, 0, 1, 50);
			}
		}
	}
}
