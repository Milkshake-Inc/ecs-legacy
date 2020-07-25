import { h } from 'preact';
import { Box, Col, JsxstyleProps, Block } from 'jsxstyle/preact';

export const Colors = {
	WHITE: '#ffffff',
	PURPLE: '#7e32ec',
	RED: '#ec324c',
	PINK: '#ff2656',
	GREEN: '#32ec9f',
	YELLOW: '#ecc732',
	DARK: '#1e1e1e',
	LIGHT: '#cdcdcd',
	BLACK: '#000000'
};

export const Flex = props => <Col display='flex' {...props} />;
export const FlexCenter = props => <Flex justifyContent='center' alignItems='center' {...props} />;

export const H1 = props => <Box fontSize='3vw' {...props} />;
export const H2 = props => <Box fontSize='2.5vw' {...props} />;
export const H3 = props => <Box fontSize='2vw' {...props} />;

export const Button = props => (
	<FlexCenter
		fontSize='3vw'
		background={props.disabled ? Colors.DARK : Colors.PINK}
		borderRadius={5}
		padding='5px 20px'
		letterSpacing={2}
		hoverBackgroundColor={props.disabled ? undefined : HexAdjust(Colors.PINK, 15)}
		cursor={props.disabled ? 'disabled' : 'pointer'}
		{...props}
	/>
);

export const Input = props => (
	<Block
		component='input'
		fontFamily='Quicksand'
		borderTopLeftRadius={5}
		borderBottomLeftRadius={5}
		border='none'
		outline='none'
		letterSpacing={2}
		{...props}
		props={{ ...props }}
	/>
);

export const NoiseBackground = props => (
	<Box {...props} position='absolute' width='100%' height='100%' background='url(assets/golf/noise.png)' />
);

export const Modal = props => <Box width='100%' height='100%' background={HexAlpha(Colors.DARK, 0.85)} borderRadius={5} {...props} />;

export const FullscreenNoise = props => {
	return (
		<NoiseBackground>
			<FlexCenter width='100%' height='100%'>
				{props.children}
			</FlexCenter>
		</NoiseBackground>
	);
};

export const HexAdjust = (color: string, amount: number) => {
	return (
		'#' +
		color
			.replace(/^#/, '')
			.replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2))
	);
};

export const HexAlpha = (hex: string, alpha = 1) => {
	const alphaHex = Math.round(alpha * 255).toString(16);

	return `${hex}${alphaHex}`;
};
