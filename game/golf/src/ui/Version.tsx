import { h } from 'preact';
import { Flex, H5, HexAdjust, Colors, HexAlpha } from './Shared';

declare const VERSION: string;

export const Version = () => {
	return (
		<Flex position='absolute' pointerEvents='none' width='100%' height='100%' justifyContent='flex-end'>
			<H5 padding='1vw' color={HexAlpha(Colors.WHITE, 0.7)}>
				{VERSION}
			</H5>
		</Flex>
	);
};
