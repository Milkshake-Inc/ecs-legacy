import Position from '@ecs/plugins/Position';
import { all } from '@ecs/utils/QueryHelper';
import { useThreeCouple } from './ThreeCouple';
import { PerspectiveCamera, Object3D } from 'three';
import RenderSystem from '../systems/RenderSystem';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useCouple } from '@ecs/ecs/helpers';

export const usePerspectiveCameraCouple = (system: RenderSystem) =>
	useThreeCouple<PerspectiveCamera>(system, all(Position, PerspectiveCamera), {
		onCreate: entity => {
			return entity.get(PerspectiveCamera);
		}
	});
