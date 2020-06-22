import { h } from 'preact';
import { useQuery } from '@ecs/plugins/reactui';
import { ClientPingState } from '@ecs/plugins/net/components/ClientPingState';
import { all } from '@ecs/utils/QueryHelper';

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
