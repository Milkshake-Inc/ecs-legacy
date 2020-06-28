import { QueryPattern } from '@ecs/utils/QueryHelper';
import { h } from 'preact';
import { FullscreenModal } from './FullscreenModal';
import { Block, Row, Box } from 'jsxstyle/preact';
import { Flex, H1, H2, FlexCenter, Colors } from './Shared';

export const Lobby = () => {

	const players = [
		{ name: 'Buster', color: '#7e32ec' },
		{ name: 'Lucy', color: '#ec324c' },
		{ name: 'Ruby', color: '#32ec9f' },
		{ name: 'Rover', color: '#ecc732' }
	];

	const createPlayer = (player, index) => {
		return <H2
			color={player.color}
			background={ index % 2 && '#00000036' }
			margin={0}
			padding={8}
		>
			{player.name}
		</H2>;;
	}

	return (
		<FullscreenModal>
			<Row width='100%' height='100%'>
				<Flex width='65%' height='100%' >
					<H1 margin="15px 0px 15px 15px" >Lobby</H1>
					{ players.map(createPlayer) }
				</Flex>
				<Flex width='45%' >
					<Box height='77%' background={"url(assets/golf/map_preview.png)"} />
					<FlexCenter height='23%' background={Colors.PINK} >
						<H2 margin={0} >Start Game</H2>
					</FlexCenter>
				</Flex>
			</Row>
		</FullscreenModal>
	);
};
