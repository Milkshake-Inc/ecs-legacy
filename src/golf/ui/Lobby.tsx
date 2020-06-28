import { QueryPattern, all } from '@ecs/utils/QueryHelper';
import { h } from 'preact';
import { FullscreenModal } from './FullscreenModal';
import { Block, Row, Box } from 'jsxstyle/preact';
import { Flex, H1, H2, FlexCenter, Colors, Button } from './Shared';
import { useQuery, EngineContext } from '@ecs/plugins/reactui';
import Session from '@ecs/plugins/net/components/Session';
import RemoteSession from '@ecs/plugins/net/components/RemoteSession';
import GolfPlayer from '../components/GolfPlayer';
import { useNetworking } from '@ecs/plugins/net/helpers/useNetworking';
import { useGolfNetworking, GolfPacketOpcode } from '../constants/GolfNetworking';
import { useContext } from 'preact/hooks';

export const Lobby = () => {

	const sessions = useQuery(all(GolfPlayer));
	const engine = useContext(EngineContext);

	const networking = useGolfNetworking(engine);

	const players = sessions.map((entity) => {
		return entity.get(GolfPlayer)
	})

	const createPlayer = (player, index) => {
		return <H2
			color={`#${player.color.toString(16)}`}
			background={ !(index % 2) && '#00000036' }
			margin={0}
			padding={8}

		>
			{player.name}
		</H2>;
	}

	const handleStartGame = () => {
		console.info("Start game");
		networking.send({
			opcode: GolfPacketOpcode.START_GAME
		}, true);
	}

	return (
		<FullscreenModal>
			<Row width='100%' height='100%'>
				<Flex width='65%' height='100%' >
					<H1 margin="15px 0px 15px 15px" >Lobby</H1>
					{ players.map(createPlayer) }
				</Flex>
				<Flex width='56%' >
					<Box height='77%' background={"url(assets/golf/map_preview.png)"} />
					<Button props={ { onClick: handleStartGame } } borderRadius={0} height='23%' background={Colors.PINK} >
						<H2 margin={0} >Start Game</H2>
					</Button>
				</Flex>
			</Row>
		</FullscreenModal>
	);
};
