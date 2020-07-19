import { Entity } from '@ecs/ecs/Entity';
import Vector3 from '@ecs/math/Vector';
import Transform from '@ecs/plugins/Transform';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import { BALL_BODY } from '../constants/Physics';
import { Sphere } from 'cannon-es';
import { Mesh, SphereGeometry, MeshPhongMaterial } from 'three';
import { SDFText } from '../systems/client/render/useSDFTextCouple';
import GolfPlayer from '../components/GolfPlayer';

export const BALL_SIZE = 0.03;

export const createBall = (): Entity => {
	const entity = new Entity();
	entity.add(Transform, {});
	entity.add(new CannonBody(BALL_BODY));
	entity.add(new Sphere(BALL_SIZE));

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
