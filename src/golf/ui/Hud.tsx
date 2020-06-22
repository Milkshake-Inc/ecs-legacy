import { h } from 'preact';
import Transform from '@ecs/plugins/Transform';
import PlayerBall from '../components/PlayerBall';
import CannonBody from '@ecs/plugins/physics/components/CannonBody';
import ThirdPersonTarget from '@ecs/plugins/3d/systems/ThirdPersonTarget';
import { useQuery } from '@ecs/plugins/reactui';
import { all } from '@ecs/utils/QueryHelper';

export const Hud = () => {
	const query = useQuery(all(Transform, PlayerBall, CannonBody, ThirdPersonTarget));
	const pos = query.first?.get(Transform);

	if (!pos) return <h1>no player found :(</h1>;

	return (
		<div>
			<p>x: {pos.x}</p>
			<p>y: {pos.y}</p>
			<p>z: {pos.z}</p>
		</div>
	);
};
