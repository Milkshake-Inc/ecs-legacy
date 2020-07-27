import { useQueries } from '@ecs/ecs/helpers';
import { all } from '@ecs/ecs/Query';
import { useECS } from '@ecs/plugins/ui/react';
import { Row } from 'jsxstyle/preact';
import { h } from 'preact';
import GolfPlayer from '../components/GolfPlayer';
import { FullscreenModal } from './FullscreenModal';
import { H1, H2 } from './Shared';

export const Scoreboard = () => {
	const { queries } = useECS(engine => ({
		queries: useQueries(engine, {
			players: all(GolfPlayer)
		})
	}));

	const players = queries.players.map(entity => {
		const player = entity.get(GolfPlayer);

		return {
			name: player.name,
			color: '#' + player.color.toString(16),
			score: player.score
		};
	});

	const createHeader = () => {
		return (
			<Row margin={0} padding={8} opacity={0.3}>
				<H2 width='20%' />
				{players[0].score.map((value, index) => (
					<H2 paddingLeft={40}>{index + 1}</H2>
				))}
				<H2 textAlign='right' width='15%' paddingLeft={40}>
					Total
				</H2>
			</Row>
		);
	};

	const total = arr => arr.reduce((a, b) => a + b, 0);

	const createPlayer = (player, index) => {
		return (
			<Row background={index % 2 == 0 && '#00000036'} margin={0} padding={8}>
				<H2 width='20%' color={player.color}>
					{player.name}
				</H2>
				{player.score.map(value => (
					<H2 paddingLeft={40}>{value}</H2>
				))}
				<H2 textAlign='right' width='15%' paddingLeft={40}>
					{total(player.score)}
				</H2>
			</Row>
		);
	};

	if (players.length == 0) return;

	return (
		<FullscreenModal width='47%'>
			<H1 margin='15px 0px 15px 15px'>Scoreboard</H1>
			{createHeader()}
			{players.map(createPlayer)}
		</FullscreenModal>
	);
};
