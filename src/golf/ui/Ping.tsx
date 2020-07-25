import { h } from 'preact';
import { useECS } from '@ecs/plugins/ui/react';
import { ClientPingState } from '@ecs/plugins/net/components/ClientPingState';
import { all } from '@ecs/ecs/Query';
import { useQueries } from '@ecs/ecs/helpers';

export const Ping = () => {
	const { queries } = useECS(engine => ({
		queries: useQueries(engine, {
			ping: all(ClientPingState)
		})
	}));

	const ping = queries.ping.first?.get(ClientPingState);
	if (!ping) return null;

	return (
		<div>
			<p>ping: {ping.rtt?.toFixed(2)}</p>
		</div>
	);
};
