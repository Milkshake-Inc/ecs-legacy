import decomp from 'poly-decomp';

// API: https://brm.io/matter-js/docs/classes/Bodies.html
// Code: https://brm.io/matter-js/docs/files/src_factory_Bodies.js.html#l179
//
// In MatterJs when using `Bodies.fromVertices` it attempts to pull the 'poly-decomp'
// library in from a global window var. This is a work around for this.
//
// Alternativly we could pull the code form 'Bodies.fromVertices' and tweak it to
// use the library as a normal import or not at all.
export const injectPolyDecomp = () => {
	// For NodeJS env
	if (typeof window === 'undefined') {
		(global as any).window = {};
	}

	((<any>window) as any).decomp = decomp;
};
