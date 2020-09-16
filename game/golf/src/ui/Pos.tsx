import { h } from 'preact';
import Transform from '@ecs/plugins/math/Transform';
import { useECS } from '@ecs/plugins/ui/react';
import { QueryPattern } from '@ecs/core/Query';
import { useQueries } from '@ecs/core/helpers';

export const Pos = (props: { query: QueryPattern }) => {
	const { queries } = useECS(engine => ({
		queries: useQueries(engine, {
			pos: props.query
		})
	}));

	const pos = queries.pos.first?.get(Transform);

	if (!pos) return <p>no player found :(</p>;

	return (
		<div>
			<p>x: {pos.x?.toFixed(2)}</p>
			<p>y: {pos.y?.toFixed(2)}</p>
			<p>z: {pos.z?.toFixed(2)}</p>
		</div>
	);
};
