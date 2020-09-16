import { h } from 'preact';

const ASPECT = 56;

export const Hud = props => {
	const style = {
		position: 'absolute',
		color: 'white',
		fontFamily: 'Quicksand',
		fontWeight: 700,
		width: '100%',
		height: '100%',
		margin: '0px'
	};

	return <div style={style}>{props.children}</div>;
};
