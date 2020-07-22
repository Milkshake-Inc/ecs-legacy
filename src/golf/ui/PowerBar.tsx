import Color from '@ecs/plugins/math/Color';
import { useQuery } from '@ecs/plugins/ui/react';
import { all } from '@ecs/ecs/Query';
import { h } from 'preact';
import { BallControllerState } from '../systems/client/ClientBallControllerSystem';
import { Colors as GolfColors, Flex, FlexCenter } from './Shared';

export const PowerBar = () => {
	const query = useQuery(all(BallControllerState));

	const power = query.first?.get(BallControllerState).power || 0;

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
