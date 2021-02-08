import { PlatformHelper } from './Platform';

export const getHostName = () => {
	let hostname = 'localhost';
	if (PlatformHelper.IsClient) {
		hostname = window?.location?.hostname;
	} else {
		const getLocalIp = () => {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const interfaces = require('os').networkInterfaces();
			const ips = (Object.values(interfaces) as any[]).flat(1).filter(net => net.family === 'IPv4' && !net.internal);
			return ips.length > 0 ? ips[0].address : null;
		};
		hostname = getLocalIp();
	}

	return hostname;
};
