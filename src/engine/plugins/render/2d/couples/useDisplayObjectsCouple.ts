import { Entity } from '@ecs/core/Entity';
import { all, any } from '@ecs/core/Query';
import { System } from '@ecs/core/System';
import Transform from '@ecs/plugins/math/Transform';
import { AnimatedSprite, BitmapText, Container, Graphics, Sprite, Text, TilingSprite } from 'pixi.js';
import { usePixiCouple } from './PixiCouple';

type PixiDisplayObjects = Container | Sprite | Graphics;

const getPixiDisplayObjects = (entity: Entity) => {
	const displayObjects = [];

	if (entity.has(Container)) {
		displayObjects.push(entity.get(Container));
	}

	if (entity.has(Sprite)) {
		displayObjects.push(entity.get(Sprite));
	}

	if (entity.has(TilingSprite)) {
		displayObjects.push(entity.get(TilingSprite));
	}

	if (entity.has(Graphics)) {
		displayObjects.push(entity.get(Graphics));
	}

	if (entity.has(Text)) {
		displayObjects.push(entity.get(Text));
	}

	if (entity.has(BitmapText)) {
		displayObjects.push(entity.get(BitmapText));
	}

	if (entity.has(AnimatedSprite)) {
		displayObjects.push(entity.get(AnimatedSprite));
	}

	return displayObjects;
};

// Caveats: Since one entity can have multiple types of pixi display objets ie. Sprite & Graphic
// we bundle them up into a container. Now allowing depth sorting etc. Also adding a container to an
// entity would wrap it within another container...
//
// Might get more complicated when adding displaay objs after added
//
// Maybe only allow one display time on a entity

export const useDisplayObjectsCouple = (system: System) =>
	usePixiCouple<PixiDisplayObjects>(system, [all(Transform), any(Container, Sprite, TilingSprite, Graphics)], {
		onCreate: entity => {
			const entityDisplayObject = new Container();

			entityDisplayObject.addChild(...getPixiDisplayObjects(entity));

			return entityDisplayObject;
		}
	});
