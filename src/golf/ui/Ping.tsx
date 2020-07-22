import { h } from 'preact';
import { useQuery } from '@ecs/plugins/ui/react';
import { ClientPingState } from '@ecs/plugins/net/components/ClientPingState';
import { all } from '@ecs/ecs/Query';

export const Ping = () => {
	const query = useQuery(all(ClientPingState));
	const ping = query.first?.get(ClientPingState);

	if (!ping) return null;

	return (
		<div>
			<p>ping: {ping.rtt?.toFixed(2)}</p>
		</div>
	);
};
