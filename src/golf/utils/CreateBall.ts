import { Entity } from '@ecs/ecs/Entity';
import Transform from '@ecs/plugins/math/Transform';
import AmmoBody from '@ecs/plugins/physics/ammo/components/AmmoBody';
import AmmoShape from '@ecs/plugins/physics/ammo/components/AmmoShape';
import { Mesh, MeshPhongMaterial, SphereGeometry } from 'three';
import GolfPlayer from '../components/GolfPlayer';
import { SDFText } from '../systems/client/render/useSDFTextCouple';

export const BALL_SIZE = 0.03;

export const createBall = (): Entity => {
	const entity = new Entity();
	entity.add(Transform, {});

	return entity;
};

export const createBallServer = (): Entity => {
	const entity = createBall();

	entity.add(AmmoBody, {
		mass: 1
	});
	entity.add(AmmoShape.SPHERE(BALL_SIZE));

	return entity;
};

export const createBallClient = (golfplayer: GolfPlayer): Entity => {
	const entity = createBall();

	entity.add(
		new Mesh(
			new SphereGeometry(BALL_SIZE, 10, 10),
			new MeshPhongMaterial({
				color: golfplayer.color,
				reflectivity: 0,
				specular: 1
			})
		),
		{ castShadow: true, receiveShadow: true }
	);

	entity.add(SDFText, {
		value: golfplayer.name,
		color: golfplayer.color
	});

	return entity;
};
