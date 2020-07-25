import { System } from '@ecs/ecs/System';
import Tweakpane from 'tweakpane';
import { Engine } from '@ecs/ecs/Engine';
import { Entity } from '@ecs/ecs/Entity';
import { useSingletonQuery } from '@ecs/ecs/helpers';
import { ClientSnapshotStatistics } from './ClientSnapshotSystem';
import { useGolfNetworking, GolfPacketOpcode } from '../../constants/GolfNetworking';

export default class TweakSystem extends System {
	private engine: Engine;
	private tweakPane = new Tweakpane();
	private paramas: {
		entities: number;
		components: number;
		timeSinceLastSnapshot: number;
		serverFrameTime: number;
	};

	private getSnapshotStatstics = useSingletonQuery(this, ClientSnapshotStatistics);

	networking = useGolfNetworking(this);

	constructor() {
		super();

		this.paramas = {
			entities: 0,
			components: 0,
			timeSinceLastSnapshot: 0,
			serverFrameTime: 0
		};

		this.networking.on(GolfPacketOpcode.SERVER_DEBUG, packet => {
			this.paramas.serverFrameTime = packet.frameTime;
		});

		this.tweakPane.addMonitor(this.paramas, 'entities', {
			interval: 500
		});

		this.tweakPane.addMonitor(this.paramas, 'entities', {
			view: 'graph',
			min: 0,
			max: 500
		});

		this.tweakPane.addMonitor(this.paramas, 'components', {
			interval: 500
		});

		this.tweakPane.addMonitor(this.paramas, 'components', {
			view: 'graph',
			min: 0,
			max: 5000
		});

		this.tweakPane.addMonitor(this.paramas, 'timeSinceLastSnapshot', {
			interval: 500
		});

		this.tweakPane.addMonitor(this.paramas, 'timeSinceLastSnapshot', {
			view: 'graph',
			min: 0,
			max: 200,
			label: 'snapshot'
		});

		this.tweakPane.addMonitor(this.paramas, 'serverFrameTime', {
			interval: 500,
			label: 'serverFrame'
		});

		this.tweakPane.addMonitor(this.paramas, 'serverFrameTime', {
			view: 'graph',
			min: 0,
			max: 30,
			label: 'serverFrame'
		});
	}

	onAddedToEngine(engine: Engine) {
		this.engine = engine;
	}

	update(deltaTime: number) {
		super.update(deltaTime);

		this.paramas.entities = this.engine.entities.length;
		this.paramas.components = Entity.COMPONENTS;
		this.paramas.timeSinceLastSnapshot = this.getSnapshotStatstics().timeSinceLastSnapshot;
	}
}
