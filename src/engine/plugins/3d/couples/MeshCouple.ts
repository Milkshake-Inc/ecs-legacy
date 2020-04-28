import { System } from '@ecs/ecs/System';
import Position from '@ecs/plugins/Position';
import { all } from '@ecs/utils/QueryHelper';
import { useThreeCouple } from './ThreeCouple';
import { Mesh, BoxGeometry, Material, Geometry, MeshBasicMaterial, MeshStandardMaterial } from 'three';

export const useMeshCouple = (system: System) =>
	useThreeCouple<Mesh>(system, all(Position, Mesh), {
		onCreate: entity => {
			const mesh = entity.get(Mesh);
			let geometry: Geometry;
			if (entity.has(Geometry)) {
				geometry = entity.get(Geometry);
			}
			if (entity.has(BoxGeometry)) {
				geometry = entity.get(BoxGeometry);
			}

			let material: Material;
			if (entity.has(Material)) {
				material = entity.get(Material);
			}
			if (entity.has(MeshBasicMaterial)) {
				material = entity.get(MeshBasicMaterial);
			}
			if (entity.has(MeshStandardMaterial)) {
				material = entity.get(MeshStandardMaterial);
			}

			mesh.geometry = geometry;
			mesh.material = material;
			return mesh;
		}
	});
