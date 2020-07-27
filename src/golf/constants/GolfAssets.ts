import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

type AssetsMap<T, K> = {
	[P in keyof T]: K;
};

export type KenneyAssetsGLTF = Partial<AssetsMap<typeof KenneyAssets, GLTF>>;
export type MapAssetsGLTF = Partial<AssetsMap<typeof MapAssets, GLTF>>;

export default class GolfAssets {
	gltfs: KenneyAssetsGLTF = {};
	maps: MapAssetsGLTF = {};
}

export const MapAssets = {
	TRAIN: 'course-train.glb',
	LUCAS: 'lucas.glb',
};

export const KenneyAssets = {
	BALL_BLUE: 'ball_blue.glb',
	BALL_GREEN: 'ball_green.glb',
	BALL_RED: 'ball_red.glb',
	BLOCK: 'block.glb',
	BUMP: 'bump.glb',
	BUMPDOWN: 'bumpDown.glb',
	BUMPDOWNWALLS: 'bumpDownWalls.glb',
	BUMPWALLS: 'bumpWalls.glb',
	CASTLE: 'castle.glb',
	CLUB_BLUE: 'club_blue.glb',
	CLUB_GREEN: 'club_green.glb',
	CLUB_RED: 'club_red.glb',
	CORNER: 'corner.glb',
	CREST: 'crest.glb',
	END: 'end.glb',
	FLAG_BLUE: 'flag_blue.glb',
	FLAG_GREEN: 'flag_green.glb',
	FLAG_RED: 'flag_red.glb',
	GAP: 'gap.glb',
	HILLCORNER: 'hillCorner.glb',
	HILLROUND: 'hillRound.glb',
	HILLSQUARE: 'hillSquare.glb',
	HOLEOPEN: 'holeOpen.glb',
	HOLEROUND: 'holeRound.glb',
	HOLESQUARE: 'holeSquare.glb',
	INNERCORNER: 'innerCorner.glb',
	NARROWBLOCK: 'narrowBlock.glb',
	NARROWROUND: 'narrowRound.glb',
	NARROWSQUARE: 'narrowSquare.glb',
	OBSTACLEBLOCK: 'obstacleBlock.glb',
	OBSTACLEDIAMOND: 'obstacleDiamond.glb',
	OBSTACLETRIANGLE: 'obstacleTriangle.glb',
	OPEN: 'open.glb',
	RAMPA: 'rampA.glb',
	RAMPB: 'rampB.glb',
	RAMPC: 'rampC.glb',
	RAMPD: 'rampD.glb',
	RAMPSHARP: 'rampSharp.glb',
	RAMPSQUARE: 'rampSquare.glb',
	ROUNDCORNERA: 'roundCornerA.glb',
	ROUNDCORNERB: 'roundCornerB.glb',
	ROUNDCORNERC: 'roundCornerC.glb',
	SIDE: 'side.glb',
	SPLIT: 'split.glb',
	SPLITSTART: 'splitStart.glb',
	SPLITT: 'splitT.glb',
	SPLITWALLSTOOPEN: 'splitWallsToOpen.glb',
	SQUARECORNERA: 'squareCornerA.glb',
	START: 'start.glb',
	STRAIGHT: 'straight.glb',
	TUNNELDOUBLE: 'tunnelDouble.glb',
	TUNNELNARROW: 'tunnelNarrow.glb',
	TUNNELWIDE: 'tunnelWide.glb',
	WALLLEFT: 'wallLeft.glb',
	WALLRIGHT: 'wallRight.glb',
	WALLSTOOPEN: 'wallsToOpen.glb',
	WINDMILL: 'windmill.glb',

	TREE_PINEDEFAULTA: 'trees/tree_pineDefaultA.glb',
	TREE_PINEDEFAULTB: 'trees/tree_pineDefaultB.glb',
	TREE_PINEGROUNDA: 'trees/tree_pineGroundA.glb',
	TREE_PINEGROUNDB: 'trees/tree_pineGroundB.glb',
	TREE_PINEROUNDA: 'trees/tree_pineRoundA.glb',
	TREE_PINEROUNDB: 'trees/tree_pineRoundB.glb',
	TREE_PINEROUNDC: 'trees/tree_pineRoundC.glb',
	TREE_PINEROUNDD: 'trees/tree_pineRoundD.glb',
	TREE_PINEROUNDE: 'trees/tree_pineRoundE.glb',
	TREE_PINEROUNDF: 'trees/tree_pineRoundF.glb',
	TREE_PINESMALLA: 'trees/tree_pineSmallA.glb',
	TREE_PINESMALLB: 'trees/tree_pineSmallB.glb',
	TREE_PINESMALLC: 'trees/tree_pineSmallC.glb',
	TREE_PINESMALLD: 'trees/tree_pineSmallD.glb'
};
