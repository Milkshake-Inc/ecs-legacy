import { useECS } from '@ecs/plugins/ui/react';
import { all } from '@ecs/ecs/Query';
import { Box, Row } from 'jsxstyle/preact';
import { h } from 'preact';
import GolfPlayer from '../components/GolfPlayer';
import { GolfPacketOpcode, useGolfNetworking } from '../constants/GolfNetworking';
import { FullscreenModal } from './FullscreenModal';
import { Button, Flex, H1, H2 } from './Shared';
import Session from '@ecs/plugins/net/components/Session';
import { useQueries } from '@ecs/ecs/helpers';
import { ConnectionStatistics } from '@ecs/plugins/net/systems/ClientConnectionSystem';

export const Lobby = () => {
	const { queries, networking } = useECS(engine => ({
		queries: useQueries(engine, {
			sessions: all(GolfPlayer),
			connectionStats: all(ConnectionStatistics)
		}),
		networking: useGolfNetworking(engine)
	}));

	const players = queries.sessions.map(entity => {
		return entity.get(GolfPlayer);
	});

	const self = queries.sessions.find(entity => entity.has(Session));
	const isHost = self ? Boolean(self.get(GolfPlayer).host) : false;

	const createPlayer = (player, index) => {
		const name = player.host ? `${player.name} (host)` : player.name;

		return (
			<H2 color={`#${player.color.toString(16)}`} background={!(index % 2) && '#00000036'} margin={0} padding='0.6vw'>
				{name}
			</H2>
		);
	};

	const handleStartGame = () => {
		if (!isHost) return;
		console.info('Start game');
		networking.send(
			{
				opcode: GolfPacketOpcode.START_GAME
			},
			true
		);
	};

	return (
		<FullscreenModal>
			<Row width='100%' height='100%'>
				<Flex width='65%' height='100%'>
					<H1 margin='15px 0px 15px 15px'>Lobby</H1>
					{players.map(createPlayer)}
				</Flex>
				<Flex width='56%'>
					<Box height='77%' background={'url(assets/golf/map_preview.png)'} backgroundSize='cover' />
					<Button props={{ onClick: handleStartGame }} borderRadius={0} height='23%' disabled={!isHost}>
						<H2 margin={0}>{isHost ? 'Start Game' : 'Waiting For Host'}</H2>
					</Button>
				</Flex>
			</Row>
		</FullscreenModal>
	);
};
