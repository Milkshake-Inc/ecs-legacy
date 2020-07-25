import Color from '@ecs/plugins/math/Color';
import { useECS } from '@ecs/plugins/ui/react';
import { all } from '@ecs/ecs/Query';
import { h } from 'preact';
import { BallControllerState } from '../systems/client/ClientBallControllerSystem';
import { Colors as GolfColors, Flex, FlexCenter } from './Shared';
import { useQueries } from '@ecs/ecs/helpers';

export const PowerBar = () => {
	const { queries } = useECS(engine => ({
		queries: useQueries(engine, {
			ball: all(BallControllerState)
		})
	}));

	const power = queries.ball.first?.get(BallControllerState).power || 0;

	return (
		<FlexCenter width='100%' height='100%' justifyContent='flex-end' background={Color.White}>
			<Flex
				width='40%'
				height='6%'
				marginBottom='5%'
				background={GolfColors.DARK}
				borderColor={GolfColors.WHITE}
				borderWidth={3}
				borderStyle='solid'
			>
				<Flex width={`${power}%`} height='100%' background={GolfColors.RED} />
			</Flex>
		</FlexCenter>
	);
};
