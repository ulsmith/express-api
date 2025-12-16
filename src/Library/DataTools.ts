/**
 * @module express-api/Library/DataTools
 * @class DataTools
 * @description Set of tools for playing with data
 * @author Paul Smith
 * @license MIT 
 */
export default class DataTools {

	/**
	 * @public @static @name checkType
	 * @description Check properties match in two objects, to ensure they have the same properties in both
	 * @param data The data to check
	 * @param {String} type The type to check against
	 * @return {Boolean} True if data is of correct type
	 */
	static checkType(data: any, type: string): boolean {
		switch (type.split('[')[0].toLowerCase()) {
			case 'boolean':
			case 'object':
			case 'number':
			case 'string': return typeof data === type;
			case 'array': return typeof data === 'object' && data.length !== undefined;
			case 'timestamp': return typeof data === 'number';
			case 'serial':
			case 'integer': return typeof data === 'number' && data % 1 === 0;
			case 'float': return typeof data === 'number' && data % 1 !== 0;
			case 'uuid': return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(data);
			case 'date': return !!(new Date(data));
			case 'datetime': return typeof data === 'string' && !isNaN(Date.parse(data));
			case 'enum': return typeof data === 'string' && type.indexOf('[' + data + ']') >= 0;
			case 'json':
			case 'jsonb':
				try { return (typeof data === 'string' && JSON.parse(data)) || (typeof data === 'object' && JSON.stringify(data)) }
				catch { return false }
			case 'cidr':
				return /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/.test(data) // IPv4 address
					|| /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(3[0-2]|[1-2][0-9]|[0-9]))$/.test(data) // IPv4 CIDR range
					|| /^s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:)))(%.+)?s*/.test(data) // IPv6 address
					|| /^s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:)))(%.+)?s*(\/(12[0-8]|1[0-1][0-9]|[1-9][0-9]|[0-9]))$/.test(data) // IPv6 CIDR range
			default: return true;
		}
	}

	/**
	 * @public @static @name snakeToCamel
	 * @description Turn a snake case string using underscores to camel case
	 * @param {String} s The string for camelification
	 * @return {String} The camelified string
	 */
	static normalizeHeader(s: string): string { 
		return (s.charAt(0).toUpperCase() + s.toLowerCase().slice(1)).replace(/\-\w/g, (m) => '-' + m[1].toUpperCase()) 
	}

	/**
	 * @public @static @name snakeToCamel
	 * @description Turn a snake case string using underscores to camel case
	 * @param {String} s The string for camelification
	 * @return {String} The camelified string
	 */
	static snakeToCamel(s: string): string { 
		return s.toLowerCase().replace(/\_\w|-\w/g, (m) => m[1].toUpperCase()) 
	}

	/**
	 * @public @static @name snakeToCamel
	 * @description Turn a snake case string using underscores to camel case
	 * @param {String} s The string for camelification
	 * @return {String} The camelified string
	 */
	static snakeToCapital(s: string): string { 
		const camel = DataTools.snakeToCamel(s);
		return camel.charAt(0).toUpperCase() + camel.slice(1);
	}

	/**
	 * @public @static @name camelToSnake
	 * @description Turn a camel case string to snake case using underscores
	 * @param {String} s The string for camelification
	 * @return {String} The camelified string
	 */
	static camelToSnake(s: string): string { 
		return s.replace(/[A-Z]/g, (m) => '_' + m[0].toLowerCase()) 
	}

	/**
	 * @public @static @name html
	 * @description Create html template string and bind in any properties into the string
	 * @param {...Mixed} properties The properties sent into to the method as an array
	 * @return {String} The html string with properties spliced in using js template literals
	 */
	static html(...properties: any[]): string { 
		return properties[0].reduce((acc: string, cur: string, idx: number) => acc + properties[idx] + cur) 
	}

	/**
	 * @public @static @name text
	 * @description Create text template string and bind in any properties into the string
	 * @param {...Mixed} properties The properties sent into to the method as an array
	 * @return {String} The text string with properties spliced in using js template literals
	 */
	static text(...properties: any[]): string { 
		return properties[0].reduce((acc: string, cur: string, idx: number) => acc + properties[idx] + cur) 
	}

	/**
	 * @public @static @name dataConditions
	 * @description Get data conditions from headers, sort through headers to find any Data- prefixed headers for adjusting data out. if order? then convert name to column name
	 * @param headers The headers as an object
	 * @return {object} The dataConditions as an object
	 */
	static dataConditions(headers: any): object {
		const cons: any = {};
		for (const name in headers) if (name.indexOf('Data-') === 0) cons[DataTools.snakeToCamel(name.replace('Data-', '').toLowerCase())] = headers[name];
		if (cons.order) cons.order = cons.order.split('.').map((o: string) => DataTools.camelToSnake(o)).join('_'); // remap userIdentity.name > user_identity_name
		return cons;
	}
}

