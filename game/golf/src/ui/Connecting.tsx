import { h } from 'preact';
import { H1, FlexCenter, FullscreenNoise, Colors, HexAlpha } from './Shared';

export const Connecting = () => {
	return (
		<FullscreenNoise>
			<FlexCenter width='100%' height='100%' background={HexAlpha(Colors.DARK, 0.6)}>
				<H1>Connecting</H1>
				<img style={{ margin: '-50px' }} src='assets/golf/ellipsis.svg' alt='React Logo' />
			</FlexCenter>
		</FullscreenNoise>
	);
};
