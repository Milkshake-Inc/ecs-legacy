import { Query } from '@ecs/ecs/Query';
import { Entity } from '@ecs/ecs/Entity';
import Transform from '@ecs/plugins/Transform';
import CoursePiece from '../components/CoursePiece';
import { buildCourcePieceEntity } from './CourcePiece';
import { KenneyAssetsGLTF } from '../constants/GolfAssets';

export const serializeCourseEntity = (entity: Entity) => {
	const transform = entity.get(Transform);
	const courcePiece = entity.get(CoursePiece);

	return {
		modelName: courcePiece.modelName,
		transform: Transform.To(transform)
	};
};

export const serializeMap = (coursePiecesEntites: Query) => {
	return coursePiecesEntites.entities.map(entity => serializeCourseEntity(entity));
};

export const deserializeMap = (golfAssets: KenneyAssetsGLTF, value: { modelName: string; transform: any }[]): Entity[] => {
	return value.flatMap(piece => buildCourcePieceEntity(golfAssets, piece.modelName, Transform.From(piece.transform)));
};

export const deepMerge = (target: any, source: any) => {
	Object.entries(source).forEach(([key, value]) => {
		if (value && typeof value === 'object') {
			deepMerge(target[key] = target[key] || {}, value);
			return;
		}
		target[key] = value;
	});
	return target;
}
