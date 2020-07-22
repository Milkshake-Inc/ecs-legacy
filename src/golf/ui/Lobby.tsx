import { EngineContext, useQuery } from '@ecs/plugins/ui/react';
import { all } from '@ecs/ecs/Query';
import { Box, Row } from 'jsxstyle/preact';
import { h } from 'preact';
import { useContext } from 'preact/hooks';
import GolfPlayer from '../components/GolfPlayer';
import { GolfPacketOpcode, useGolfNetworking } from '../constants/GolfNetworking';
import { FullscreenModal } from './FullscreenModal';
import { Button, Colors, Flex, H1, H2 } from './Shared';

export const Lobby = () => {
	const sessions = useQuery(all(GolfPlayer));
	const engine = useContext(EngineContext);

	const networking = useGolfNetworking(engine);

	const players = sessions.map(entity => {
		return entity.get(GolfPlayer);
	});

	const createPlayer = (player, index) => {
		return (
			<H2 color={`#${player.color.toString(16)}`} background={!(index % 2) && '#00000036'} margin={0} padding='0.6vw'>
				{player.name}
			</H2>
		);
	};

	const handleStartGame = () => {
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
					<Button props={{ onClick: handleStartGame }} borderRadius={0} height='23%' background={Colors.PINK}>
						<H2 margin={0}>Start Game</H2>
					</Button>
				</Flex>
			</Row>
		</FullscreenModal>
	);
};
