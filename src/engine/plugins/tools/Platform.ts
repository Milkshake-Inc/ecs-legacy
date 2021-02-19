export class PlatformHelper {
	private static isMobile = null;

	static get IsClient() {
		return !PlatformHelper.IsServer;
	}

	static get IsServer() {
		return typeof window === 'undefined';
	}

	static get IsMobile() {
		return (
			this.isMobile || (this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
		);
	}

	static get IsMac() {
		return window.navigator.platform == 'MacIntel';
	}
}

// enable decorators to stub functions when not running on client with @client
export function client(target, key, descriptor) {
	const fn = descriptor.value;

	if (typeof fn !== 'function') {
		throw new Error(`@client decorator can only be applied to methods not: ${typeof fn}`);
	}

	return {
		configurable: true,
		get() {
			return PlatformHelper.IsClient ? fn : () => {};
		}
	};
}

// enable decorators to stub functions when not running on server with @server
export function server(target, key, descriptor) {
	const fn = descriptor.value;

	if (typeof fn !== 'function') {
		throw new Error(`@server decorator can only be applied to methods not: ${typeof fn}`);
	}

	return {
		configurable: true,
		get() {
			return PlatformHelper.IsServer ? fn : () => {};
		}
	};
}
