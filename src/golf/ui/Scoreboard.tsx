import { Box, Row, Col } from 'jsxstyle/preact';
import { h } from 'preact';
import { Button, Colors, FullscreenNoise, H1, H2 } from './Shared';
import { FullscreenModal } from './FullscreenModal';

export const Scoreboard = () => {
	const players = [
		{ name: 'Buster', color: '#7e32ec', score: [ 2, 3, 1, 5, 2, 6 ] },
		{ name: 'Lucy', color: '#ec324c', score: [ 2, 3, 1, 5, 2, 6 ] },
		{ name: 'Ruby', color: '#32ec9f', score: [ 2, 3, 1, 5, 2, 6 ] },
		{ name: 'Rover', color: '#ecc732', score: [ 2, 3, 1, 5, 2, 6 ] }
	];

	const createHeader = () => {
		return (
			<Row margin={0} padding={8} opacity={0.3} >
				<H2 width="20%" />
				{players[0].score.map((value, index) => <H2 paddingLeft={40} >{index}</H2>)}
				<H2 textAlign="right" width="15%"paddingLeft={40}>Total</H2>
			</Row>
		);
	};

	const total = arr => arr.reduce((a, b) => a + b, 0);

	const createPlayer = (player, index) => {
		return (
			<Row background={index % 2 == 0 && '#00000036'} margin={0} padding={8} >
				<H2 width="20%" color={player.color} >
					{player.name}
				</H2>
				{player.score.map(value => <H2 paddingLeft={40} >{value}</H2>)}
				<H2 textAlign="right" width="15%"paddingLeft={40}>{total(player.score)}</H2>
			</Row>
		);
	};

	return (
		<FullscreenModal width="47%" >
			<H1 margin='15px 0px 15px 15px'>Scoreboard</H1>
			{ createHeader() }
			{ players.map(createPlayer) }
		</FullscreenModal>
	);
};
