import { EventEmitter } from 'events';

const EVENT_BUS = new EventEmitter();

export const useEvents = () => EVENT_BUS;
