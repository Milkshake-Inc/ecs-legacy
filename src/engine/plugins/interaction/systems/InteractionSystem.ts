import { Entity, EntitySnapshot } from '@ecs/ecs/Entity';
import { useQueries } from '@ecs/ecs/helpers/StatefulSystems';
import { IterativeSystem } from '@ecs/ecs/IterativeSystem';
import DisplayObject from '@ecs/plugins/render/components/DisplayObject';
import RenderState from '@ecs/plugins/render/components/RenderState';
import Sprite from '@ecs/plugins/render/components/Sprite';
import { all, makeQuery } from '@ecs/utils/QueryHelper';

export class Interactable {
	public buttonMode = true;
}
export class ClickEvent {}

export default class InteractionSystem extends IterativeSystem {
	protected queries = useQueries(this, {
		renderState: all(RenderState)
	});

	constructor() {
		super(makeQuery(all(Sprite, Interactable)));
	}

	entityAdded = (snapshot: EntitySnapshot) => {
		const entity = snapshot.entity;
		const interactable = snapshot.get(Interactable);
		const pixiSprite = this.renderState.displayObjects.get(entity.get(Sprite));

		pixiSprite.buttonMode = interactable.buttonMode;
		pixiSprite.interactive = true;

		pixiSprite.on('click', () => {
			entity.add(ClickEvent);
		});
	};

	public updateEntity(entity: Entity, deltaTime: number) {
		if (entity.has(ClickEvent)) {
			entity.remove(ClickEvent);
			console.log('Removing click event');
		}
		super.updateEntity(entity, deltaTime);
	}

	get renderState() {
		return this.queries.renderState.first.get(RenderState);
	}
}
