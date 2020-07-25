import * as QueryString from 'query-string';
class Config {
	get debug() {
		return Boolean(QueryString.parse(location.search).debug as string);
	}
	get tweak() {
		return Boolean(QueryString.parse(location.search).tweak as string);
	}
}

export default new Config();
