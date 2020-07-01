import { h } from 'preact';
import Transform from '@ecs/plugins/Transform';
import { useQuery } from '@ecs/plugins/reactui';
import { QueryPattern } from '@ecs/utils/QueryHelper';

export const Pos = (props: { query: QueryPattern }) => {
	const query = useQuery(props.query);
	const pos = query.first?.get(Transform);

	if (!pos) return <p>no player found :(</p>;

	return (
		<div>
			<p>x: {pos.x?.toFixed(2)}</p>
			<p>y: {pos.y?.toFixed(2)}</p>
			<p>z: {pos.z?.toFixed(2)}</p>
		</div>
	);
};
