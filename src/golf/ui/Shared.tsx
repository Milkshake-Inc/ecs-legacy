import { h } from 'preact';
import { Box, Col, JsxstyleProps } from "jsxstyle/preact";

export const Colors = {
    PURPLE: '#7e32ec',
    RED: '#ec324c',
    PINK: '#ff2656',
    GREEN: '#32ec9f',
    YELLOW: '#ecc732',
    DARK: '#1e1e1e',
    LIGHT: '#cdcdcd'
}

export const Flex = (props) => <Col {...props} display="flex" />;
export const FlexCenter = (props) => <Flex {...props} justifyContent="center" alignItems="center" />;

export const H1 = (props) => <Box {...props} fontSize="35px" />;
export const H2 = (props) => <Box {...props} fontSize="30px" />;

export const Button = (props) => <FlexCenter
    {...props}
    fontSize="30px"
    background={Colors.PINK}
    borderRadius={5}
    padding="5px 20px"
    letterSpacing={2}
/>;

export const NoiseBackground = (props) => <Box
    {...props}
    position="absolute"
    width="100%"
    height="100%"
    background='url(assets/golf/noise.png)'
/>

export const Modal = (props) => <Box
    width="100%"
    height="100%"
    background={HexAlpha(Colors.DARK, 0.85)}
    borderRadius={5}
    {...props}
/>

export const FullscreenNoise = (props) => {
	return <NoiseBackground>
		<FlexCenter width="100%" height="100%" >
			{props.children}
		</FlexCenter>
    </NoiseBackground>;
};


export const HexAlpha = (hex: string, alpha: number = 1) => {
    const alphaHex = Math.round(alpha * 255).toString(16);

    return `${hex}${alphaHex}`;
}