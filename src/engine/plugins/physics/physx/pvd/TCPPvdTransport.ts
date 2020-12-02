export default PhysX.PxPvdTransport.implement({
	connect: () => {
		console.log('Connnect!');
	},
	isConnected: () => {
		return true;
	},
	write: (a: any, b: any) => {
		// Maybe this is how it works?
		const data = PhysX.HEAPU8.subarray(a, a + b);
		// console.log(a, b);
		console.log(data);
	}
});
