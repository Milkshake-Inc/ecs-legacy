import Color from '@ecs/plugins/math/Color';
import { h } from 'preact';
import { FlexCenter, Colors, Flex, H1, H2, H3 } from './Shared';

export const Spectator = () => {
	return (
		<FlexCenter width='100%' height='100%'>
			<FlexCenter width='100%' height='10%' background={Colors.DARK}>
				<H2>SPECTATOR VIEW</H2>
			</FlexCenter>
			<Flex width='100%' height='80%'>
				<H1 color={Colors.RED} fontSize='4vw' padding='1vw'>
					● LIVE
				</H1>
			</Flex>
			<FlexCenter width='100%' height='10%' background={Colors.DARK}>
				<H3>You will join in the next hole</H3>
			</FlexCenter>
		</FlexCenter>
	);
};
