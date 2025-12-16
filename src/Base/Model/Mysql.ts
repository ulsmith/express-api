import Core from '../../System/Core';
import ModelError from '../../Error/Model';
import DataTools from '../../Library/DataTools';
import { GlobalsType } from '../../Types/System';

/**
 * @module express-api/Base/Model/Mysql
 * @class ModelMysql
 * @extends Core
 * @description System class to give a base for creating MySQL models, exposing the knex DB service and giving base methods
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT 
 */
export default class ModelMysql<T extends GlobalsType> extends Core<T> {

	public dbname: string;
	public table: string;
	public softDelete?: boolean;
	public idCol: string;
	public createdCol: string;
	public updatedCol: string;
	public deleteCol: string;
	public columns?: { [key: string]: any };

	/**
	 * @public @method constructor
	 * @description Base method when instantiating class
	 */
	constructor(globals: T, dbname: string, table: string, params?: { softDelete?: boolean; idCol?: string; createdCol?: string; updatedCol?: string; deleteCol?: string }) {
		super(globals);

		this.dbname = !table ? (this.$environment as any)?.MYSQL_DATABASE || dbname : dbname;
		this.table = !table ? dbname : table;
		this.softDelete = params?.softDelete;
		this.idCol = params?.idCol || 'id';
		this.createdCol = params?.createdCol || 'created';
		this.updatedCol = params?.updatedCol || 'updated';
		this.deleteCol = params?.deleteCol || 'deleted';
	}

	/**
	 * @public @get db
	 * @desciption Get the services available to the system
	 * @return {any} MySQL connection
	 */
	get db(): any { return (this.$services as any)['mysql:' + this.dbname].con }

	/**
	 * @public notSoftDeleted
	 * @desciption Get insertable for soft delete check
	 * @return {String} The query insertable for checking soft delete, if set
	 */
	notSoftDeleted(prefix: string): string { return this.softDelete ? `${prefix} ${this.inject(this.deleteCol)} IS NULL` : '' }

	/**
	 * @public @method get
	 * @description Get a single resource in a single table by table id
	 * @param {Number} id The resource id to get
	 * @return {Promise} a resulting promise of data or error on failure
	 */
	get(id: any): Promise<any> { return this.db.query(`SELECT * FROM ${this.inject(this.table)} WHERE ${this.inject(this.idCol)} = ? ${this.notSoftDeleted('AND')} LIMIT 1;`, [id]).then(([rows]: any) => rows[0] || {}) }

	/**
	 * @public @method find
	 * @description Find one or more resources from a where object in a single table
	 * @param {Object} where The where object as key value, or knex style where object
	 * @return {Promise} a resulting promise of data or error on failure
	 */
	find(where: any): Promise<any> {
		let q = Object.keys(where).map((w, i) => ` ${this.inject(w)} = ? `).join(' AND ');
		let v = Object.values(where);

		return this.db.query(`SELECT * FROM ${this.inject(this.table)} WHERE ${q} ${this.notSoftDeleted('AND')};`, v).then(([rows]: any) => rows);
	}

	/**
	 * @public @method first
	 * @description Find one or more resources from a where object in a single table
	 * @param {Object} where The where object as key value, or knex style where object
	 * @return {Promise} a resulting promise of data or error on failure
	 */
	first(where?: any): Promise<any> {
		if (!this.createdCol) throw new ModelError('Must set created column in super request to use this feature.');
		if (!where || Object.keys(where).length < 1) return this.db.query(`SELECT * FROM ${this.inject(this.table)} ${this.notSoftDeleted('WHERE')} ORDER BY ${this.inject(this.createdCol)} ASC LIMIT 1;`).then(([rows]: any) => rows[0] || {});

		let q = Object.keys(where).map((w, i) => ` ${this.inject(w)} = ? `).join(' AND ');
		let v = Object.values(where);

		return this.db.query(`SELECT * FROM ${this.inject(this.table)} WHERE ${q} ${this.notSoftDeleted('AND')} ORDER BY ${this.inject(this.createdCol)} ASC LIMIT 1;`, v).then(([rows]: any) => rows[0] || {});
	}

	/**
	 * @public @method last
	 * @description Find one or more resources from a where object in a single table
	 * @param {Object} where The where object as key value, or knex style where object
	 * @return {Promise} a resulting promise of data or error on failure
	 */
	last(where?: any): Promise<any> {
		if (!this.createdCol) throw new ModelError('Must set created column in super request to use this feature.');
		if (!where || Object.keys(where).length < 1) return this.db.query(`SELECT * FROM ${this.inject(this.table)} ${this.notSoftDeleted('WHERE')} ORDER BY ${this.inject(this.createdCol)} DESC LIMIT 1;`).then(([rows]: any) => rows[0] || {});

		let q = Object.keys(where).map((w, i) => ` ${this.inject(w)} = ? `).join(' AND ');
		let v = Object.values(where);

		return this.db.query(`SELECT * FROM ${this.inject(this.table)} WHERE ${q} ${this.notSoftDeleted('AND')} ORDER BY ${this.inject(this.createdCol)} DESC LIMIT 1;`, v).then(([rows]: any) => rows[0] || {});
	}

	/**
	 * @public @method all
	 * @description all resources from a single table
	 * @return {Promise} a resulting promise of data or error on failure
	 */
	all(): Promise<any> { return this.db.query(`SELECT * FROM ${this.inject(this.table)} ${this.notSoftDeleted('WHERE')};`) }

	/**
	 * @public @method insert
	 * @description Insert single/many resource/s in a single table, clear any default data (id, created, updated)
	 * @param {Array[Object]|Object} data The object data to insert into the resource as {key: value}
	 * @param {Mixed} returning The array of returned columns or a string
	 * @return {Promise} a resulting promise of data or error on failure
	 */
	insert(data: any, returning?: any): Promise<any> {
		data = this.__cleanIncommingData(data, true);
		if (typeof data === 'object' && (data as any).length === undefined) data = [data];

		let qk = Object.keys(data[0]).map((k) => `${this.inject(k)}`).join(',');
		let cc = 0;
		let qv = data.map((d: any, i: number) => '(' + Object.values(d).map((dd: any, ii: number) => {
			cc++;
			if (dd && !isNaN((dd as any).x) && !isNaN((dd as any).y)) {
				cc++;
				return `POINT(?, ?)`;
			}
			return `?`;
		}).join(',') + ')').join(',');
		let v = data.flatMap((d: any) => Object.values(d).flatMap((d: any) => d && !isNaN((d as any).x) && !isNaN((d as any).y) ? [(d as any).x, (d as any).y] : d));

		return this.db.query(`INSERT INTO ${this.inject(this.table)} (${qk}) VALUES ${qv};`, v).then(([rows]: any) => rows || []);
	}

	/**
	 * @public @method update
	 * @description Update a single resource in a single table by table id, clear any default data (id, created, updated)
	 * @param {Mixed} where The resource id to update or an object of where data
	 * @param {Object} data The object data to update on the resource as {key: value}
	 * @return {Promise} a resulting promise of data or error on failure
	 */
	update(where: any, data: any): Promise<any> {
		data = this.__cleanIncommingData(data);
		if (!where || ['object', 'string', 'number'].indexOf(typeof where) < 0) throw new ModelError('Must use where criteria in update as either an ID or object containing col: value');
		if (typeof where !== 'object') where = { id: where };
		if (Object.keys(where).length < 1) throw new ModelError('Must have at least one where criteria in where object');

		let dl = 0;
		let qu = Object.keys(data).map((d, i) => {
			dl++;
			if (!this.columns || !this.columns[d] || this.columns[d].type !== 'point') return ` ${this.inject(d)} = ? `;
			dl++; // points have two bits of data
			return ` ${this.inject(d)} = POINT(?, ?) `;
		}).join(',');
		let qw = Object.keys(where).map((w, i) => ` ${this.inject(w)} = ?} `).join(' AND ');
		// flatten any point data
		let v = [...Object.values(data).flatMap((d: any) => d && !isNaN((d as any).x) && !isNaN((d as any).y) ? [(d as any).x, (d as any).y] : d), ...Object.values(where)];
		
		return this.db.query(`UPDATE ${this.inject(this.table)} SET ${qu} WHERE ${qw};`, v).then(([rows]: any) => rows || []);
	}

	/**
	 * @public @method delete
	 * @description Delete a single resource in a single table by table id
	 * @param {Number} id The resource id to delete
	 * @return {Promise} a resulting promise of data or error on failure
	 */
	delete(id: any, type?: string): Promise<any> {
		// soft delete off and not explicitly soft, or explicitly hard
		if ((!this.softDelete && type !== 'soft') || type === 'hard') return this.db.query(`DELETE FROM ${this.inject(this.table)} WHERE id = ?;`, [id]);

		return this.db.query(`UPDATE ${this.inject(this.table)} SET ${this.inject(this.deleteCol)} = ? WHERE ${this.inject(this.idCol)} = ?;`, [new Date(), id]);
	}

	/**
	 * @public @method restore
	 * @description Soft restore a single resource (undelete) in a single table that has been soft deleted
	 * @param {Number} id The resource id to soft restore
	 * @return {Promise} a resulting promise of data or error on failure
	 */
	restore(id: any): Promise<any> {
		return this.db.query(`UPDATE ${this.inject(this.table)} SET ${this.inject(this.deleteCol)} = ? WHERE ${this.inject(this.idCol)} = ?;`, [null, id]);
	}

	/**
	 * @public @method queryWhere
	 * @description Builds an SQL query snippit to add on to a query, from an object including where property or simple key values matching table names
	 * @param {Object} args Arguments to work through
	 * @param {Array} values Values object pointer to fill with values as they are created for binding to be used in execution
	 * @param {String} chain The chain type to join on with or default to 'WHERE' for no chain
	 * @return {String} The SQL snippit to add to SQL query
	 * @example 
	 * SIMPLE QUERY (as AND)
	 *  { id: '12345', name: 'test' }
	 * 
	 * COMPLEX QUERY (nested and various types)
	 * 	{
	 *		"where": [
	 *			{ "key": "id", "condition": "EQUALS", "value": "00231a73a9981d63b0f11a789a46ccb1" },
	 *			{ "chain": "AND", "key": "id", "condition": "IN", "value": ["00231a73a9981d63b0f11a789a46ccb1"] },
	 *			{ "chain": "AND", "key": "id", "condition": "EQUALS", "value": "00231a73a9981d63b0f11a789a46ccb1" },
	 *			{
	 *				"chain": "OR",
	 *				"where": [
	 *					{ "key": "id", "condition": "IS", "value": null },
	 *					{ "chain": "OR", "key": "id", "condition": "NOT", "value": "abc123" },
	 *					{ "chain": "OR", "key": "id", "condition": "EQUALS", "value": "00231a73a9981d63b0f11a789a46ccb1" }
	 *				]
	 *			}
	 *		]
	 *	}
	 */
	queryWhere(args: any, values: any[], chain?: string): string {
		if (Object.keys(args.where || args).length < 1) return '';

		return ` ${chain || 'WHERE'} ` + this.__parseQueryWhere(args, values);
	}
	
	/**
	 * @public @method queryOrder
	 * @description Builds a query snippit to add on to a query string adding ORDER BY from arguments passed in
	 * @param {Object} args Arguments to work through as the whole argument list containing the order/orderBy as a property
	 * @return {String} The snippit to add to query as SQL snippet
	 * @example 
	 * {
	 *    order/orderBy: [
	 *        { key: "reference", direction: "ASC" },
	 *        { key: "id", direction: "ASC" }
	 *    ]
	 * }
	 * 
	 */
	queryOrder(args: any): string {
		if (!args || (!args.order && !args.orderBy)) return '';

		let ord = args.order || args.orderBy || args;
		let ords = Array.isArray(ord) ? ord : [ord];

		let q = '';
		for (let i = 0; i < ords.length; i++) {
			if (!ords[i].key) throw new ModelError(`Cannot parse order, key [${ords[i].key}] key missing`);
			if (!ords[i].direction) throw new ModelError(`Cannot parse order, value [${ords[i].direction}] direction missing`);
			if (!this.columns || !this.columns[DataTools.camelToSnake(ords[i].key)]) throw new ModelError(`Cannot set order, key [${ords[i].key}] not found in data`);
			q += ` ${i > 0 ? ',' : ''} ${this.inject(DataTools.camelToSnake(this.table + '.' + ords[i].key))} ${this.__parseDirection(ords[i].direction || 'ASC')} `;
		}

		return 'ORDER BY ' + q;
	}

	/**
	 * @public @method queryLimit
	 * @description Builds a query snippit to add on to a query string adding LIMIT from arguments passed in
	 * @param {Object} args Arguments to work through as a whole argument list containing the limit as a property 
	 * @return {String} The snippit to add to query as SQL snippet
	 * @example
	 *   {
	 *    	limit: 10
	 *   }
	 */
	queryLimit(args: any): string {
		if (!args || !args.limit) return '';
		let limit = Number(args.limit);
		if (!limit) return '';

		return ` LIMIT ${limit} `;
	}

	/**
	 * @public @method queryOffset
	 * @description Builds a query snippit to add on to a query string adding OFFSET from arguments passed in
	 * @param {Object} args Arguments to work through as a whole argument list containing the offset as a property
	 * @return {String} The snippit to add to query as SQL snippet
	 * @example 
	 *   {
	 *    	offset: 10
	 *   }
	 */
	queryOffset(args: any): string {
		if (!args || !args.offset) return '';
		let offset = Number(args.offset);
		if (!offset) return '';

		return ` OFFSET ${offset} `;
	}

	/**
	 * @public @method arrayWhere
	 * @description Builds an array filter to apply where style query to JSON arrays returned from a query, including where property or simple key values matching table names
	 * @param {Object} args Arguments to work through
	 * @param {Array} items Array of the items to filter with SQL where style filtering
	 * @return {Array} The filtered array of items
	 * @example 
	 * SIMPLE QUERY (as AND)
	 *  { id: '12345', name: 'test' }
	 * 
	 * COMPLEX QUERY (nested and various types)
	 * 	{
	 *		"where": [
	 *			{ "key": "id", "condition": "EQUALS", "value": "00231a73a9981d63b0f11a789a46ccb1" },
	 *			{ "chain": "AND", "key": "id", "condition": "IN", "value": ["00231a73a9981d63b0f11a789a46ccb1"] },
	 *			{ "chain": "AND", "key": "id", "condition": "EQUALS", "value": "00231a73a9981d63b0f11a789a46ccb1" },
	 *			{
	 *				"chain": "OR",
	 *				"where": [
	 *					{ "key": "id", "condition": "IS", "value": null },
	 *					{ "chain": "OR", "key": "id", "condition": "NOT", "value": "abc123" },
	 *					{ "chain": "OR", "key": "id", "condition": "EQUALS", "value": "00231a73a9981d63b0f11a789a46ccb1" }
	 *				]
	 *			}
	 *		]
	 *	}
	 */
	arrayWhere(args: any, items: any[]): any[] {
		if (Object.keys(args.where || args).length < 1) return items;
		return this.__parseArrayWhere(args, items);
	}

	/**
	 * @public @method arrayOrder
	 * @description Builds a sorter snippit to sort an array of items in an SQL style 'order by' way
	 * @param {Object} args Arguments to work through as the whole argument list containing the order/orderBy as a property
	 * @param {Array} items Array of the items to filter with SQL where style filtering
	 * @return {Array} The filtered array of items
	 * @example 
	 * {
	 *    order/orderBy: [
	 *        { key: "reference", direction: "ASC" },
	 *        { key: "id", direction: "ASC" }
	 *    ]
	 * }
	 * 
	 */
	arrayOrder(args: any, items: any[]): any[] {
		if (!args || (!args.order && !args.orderBy)) return items;

		let ord = args.order || args.orderBy || args;
		let ords = Array.isArray(ord) ? ord : [ord];

		for (let i = 0; i < ords.length; i++) {
			items = items.sort((a, b) => {
				if (!a[ords[i].key]) throw new ModelError(`Cannot parse order key [${ords[i].key}], key does not exist`);
				// __parseDirection only returns 'ASC' or 'DESC', or throws an error
				return this.__parseDirection(ords[i].direction) === 'ASC' 
					? (a[ords[i].key] > b[ords[i].key] ? 1 : -1)
					: (a[ords[i].key] < b[ords[i].key] ? 1 : -1);
			})

		}

		return items;
	}

	/**
	 * @public @method arrayLimit
	 * @description Builds a splicer to splice 'limit' amount of records from an array in an SQL style way
	 * @param {Object} args Arguments to work through as a whole argument list containing the limit as a property 
	 * @param {Array} items Array of the items to filter with SQL where style filtering
	 * @return {Array} The filtered array of items
	 * @example
	 *   {
	 *    	limit: 10
	 *   }
	 */
	arrayLimit(args: any, items: any[]): any[] {
		if (!args || !args.limit || !Array.isArray(items) || items.length < 1) return items;

		let limit = Number(args.limit);
		if (!limit) return items;

		return items.splice(0, limit);
	}

	/**
	 * @public @method arrayOffset
	 * @description Builds a splicer to splice array from 'offset' from an array in an SQL style way
	 * @param {Object} args Arguments to work through as a whole argument list containing the limit as a property 
	 * @param {Array} items Array of the items to filter with SQL where style filtering
	 * @example 
	 *   {
	 *    	offset: 10
	 *   }
	 */
	arrayOffset(args: any, items: any[]): any[] {
		if (!args || !args.offset || !Array.isArray(items) || items.length < 1) return items;

		let offset = Number(args.offset);
		if (!offset) return items;

		return items.splice(offset);
	}

	/**
	 * @public @method mapDataToColumn
	 * @description Map all incoming data, to columns to make sure we have a full dataset, or send partial flag true to map only partial dataset
	 * @param {Object} data The data to check against the columns
	 * @param {Boolean} partial The flag to force a partial map on only data available in dataset
	 * @return {Object} a resulting promise of data or error on failure
	 */
	mapDataToColumn(data: any, partial?: boolean): any {
		if (!this.columns) throw new ModelError('Cannot map data without setting columns getter in model [' + DataTools.snakeToCamel(this.table.split('.')[1]) + ']');

		// single entry
		let clean: any = {};
		for (const key in this.columns) {
			let dataKey = DataTools.snakeToCamel(key);
			if ((!data || data[dataKey] === undefined || data[dataKey] === null) && this.columns[key].required && !partial) {
				let columns = Object.keys(this.columns).reduce((p, c) => ({ ...p, ...{ [DataTools.snakeToCamel(c)]: this.columns![c] } }), {});
				throw new ModelError('Invalid data, required property [' + dataKey + '] missing from [' + DataTools.snakeToCamel(this.table.split('.')[1]) + ']', columns);
			}

			if (data[dataKey] !== undefined && data[dataKey] !== null) {
				if (!DataTools.checkType(data[dataKey], this.columns[key].type)) {
					let columns = Object.keys(this.columns).reduce((p, c) => ({ ...p, ...{ [DataTools.snakeToCamel(c)]: this.columns![c] } }), {});
					throw new ModelError('Invalid data, property [' + dataKey + '] type incorrect for [' + DataTools.snakeToCamel(this.table.split('.')[1]) + ']', columns);
				}

				// check for point types
				if (this.columns[key].type.split('[')[0].toLowerCase().includes('point') && (!data[dataKey] || isNaN((data[dataKey] as any).x) || isNaN((data[dataKey] as any).y))) {
					let columns = Object.keys(this.columns).reduce((p, c) => ({ ...p, ...{ [DataTools.snakeToCamel(c)]: this.columns![c] } }), {});
					throw new ModelError('Invalid data, property [' + dataKey + '] type incorrect, requires point data as {x: ..., y: ... } for [' + DataTools.snakeToCamel(this.table.split('.')[1]) + ']', columns);
				}

				clean[key] = this.columns[key].type.split('[')[0].toLowerCase().indexOf('json') < 0 ? data[dataKey] : (typeof data[dataKey] === 'string' ? data[dataKey] : JSON.stringify(data[dataKey]));
			} else if (data[dataKey] === null) {
				clean[key] = null;
			}
		}

		// empty
		if (partial && Object.keys(clean).length < 1) {
			let columns = Object.keys(this.columns).reduce((p, c) => ({ ...p, ...{ [DataTools.snakeToCamel(c)]: this.columns![c] } }), {});
			throw new ModelError('Invalid data, must have at least one property in [' + DataTools.snakeToCamel(this.table.split('.')[1]) + ']', columns);
		}

		return Object.keys(clean).length > 0 ? clean : undefined;
	}

	/**
	 * @public @method mapDataArrayToColumn
	 * @description Map all incoming data array of data, to columns to make sure we have a full dataset, or send partial flag true to map only partial dataset
	 * @param {Array} data The data to check against the columns
	 * @param {Boolean} partial The flag to force a partial map on only data available in dataset
	 * @return {Array} a resulting promise of data or error on failure
	 */
	mapDataArrayToColumn(data: any, partial?: boolean): any {
		if (partial && !data) return;
		if (!data || !data.length) throw new ModelError('Data must be an array of data objects for [' + DataTools.snakeToCamel(this.table.split('.')[1]) + ']');

		// array of data entries?
		let allClean = [];
		for (let i = 0; i < data.length; i++) allClean.push(this.mapDataToColumn(data[i], partial));
		return allClean;
	}

	/**
	 * @public @method parseError
	 * @description Parse the error code from teh database to see if we can show it, else generic message
	 * @param {Error} error The error object
	 * @return {Object} with parsed error data in fo rthe end user
	 */
	parseError(error: any): any {
		if (!error) return { expected: this.columns };

		return { error: 'mysql error',  detail: error.detail };
	}

	/**
	 * @public @method checkColumnsStrict
	 * @description Check columns against dataset, ensure required are present too
	 * @param {Object} data The data to check against the columns
	 * @return {Promise} a resulting promise of data or error on failure
	 */
	checkColumnsStrict(data: any): boolean {
		if (!this.columns) return false;
		for (const key in data) if (this.columns[key] === undefined) return false;
		for (const key in this.columns) if (data[key] === undefined && this.columns[key].required) return false;
		return true
	}

	/**
	 * @public @method inject
	 * @description Prepares text to inject into SQL directly for column names and such removing bad chars, quoting non * refs. WARNING! only inject variables for column names etc, NOT data!
	 * @param {String} text The string to inject into SQL that needs cleaning
	 * @return {String} a cleaned string
	 */
	inject(text: string): string {
		text = text.replace(/[^a-zA-Z0-9_.*]/g, '');
		return text.split('.').map((t) => t === '*' ? t : `\`${t}\``).join('.');
	}

	/**
	 * @private @method __cleanIncommingData
	 * @description Clean any incomming data free of default values set by the DB directly
	 * @param {Mixed} data The resource data to clean or array of data
	 * @param {Bool} skipId Should we skip ID
	 * @return {Mixed} The cleaned data object or array of objects
	 */
	__cleanIncommingData(data: any, skipId?: boolean): any {
		if (!data) return;

		if ((data as any).length > 0) {
			let dataArray = [];
			for (let i = 0; i < (data as any).length; i++) dataArray.push(this.__cleanIncommingData((data as any)[i]));
			return dataArray;
		}

		let cleaned = Object.assign({}, data);

		if (this.idCol && cleaned[this.idCol] && !skipId) delete cleaned[this.idCol];
		if (this.createdCol && cleaned[this.createdCol]) delete cleaned[this.createdCol];
		if (this.updatedCol && cleaned[this.updatedCol]) delete cleaned[this.updatedCol];
		if (this.deleteCol && cleaned[this.deleteCol]) delete cleaned[this.deleteCol];

		return cleaned;
	}

	/**
	 * @private @method __parseQueryWhere
	 * @description Recursive where clause parser, building nested where SQL strings from objects
	 * @param {Object} args The data to use for where building as a nested where object
	 * @param {Array} values The values to bind to as a pointer so they can be passed in to SQL execution
	 * @return {String} The where portion of the SQL string as the whole or recursive part
	 */
	__parseQueryWhere(args: any, values: any[]): string {
		if (typeof args !== 'object') throw new ModelError('Cannot set where criteria on query, structure incorrect');

		// if more than one, then and them
		let q = '';

		// need to loop through the where object now and build up the query adding to string
		let w: any = args.where || args; // map all where
		let c = 0;
		for (let k in w) {
			// sub query? then tag on with chain type
			if (w[k] && (w[k] as any).where) {
				q += ` ${c === 0 ? '' : ((w[k] as any).chain ? this.__parseChain((w[k] as any).chain) : 'AND')} (${this.__parseQueryWhere(w[k], values)}) `;
				c++;
				continue;
			}

			// is this direct simple matchy or detailed chainy, map to common vars
			let key = Array.isArray(w) ? (w[Number(k)] as any).key : k;
			let val = this.__parseValue(Array.isArray(w) ? (w[Number(k)] as any) : w[k]);
			let con = this.__parseCondition(Array.isArray(w) ? ((w[Number(k)] as any).condition || '=') : '='); // default to equals
			let chn = this.__parseChain(Array.isArray(w) ? ((w[Number(k)] as any).chain || 'AND') : 'AND'); // default to AND

			// do we need to override val and con? if single val in array and default = switch to single val, if more values and default = switch to IN
			if (Array.isArray(val) && val.length < 2 && con !== 'IN') val = val[0];
			if (Array.isArray(val) && val.length > 1 && con === '=') con = 'IN';
			if (con === '=' && val === null) con = 'IS NULL';
			if (con === '!=' && val === null) con = 'IS NOT NULL';

			// check key is present in colum list
			if (!this.columns || !this.columns[DataTools.camelToSnake(key)]) throw new ModelError(`Cannot set where criteria query, key [${key}] not found in data`);

			// map out how many binds we need, push values seperately if IN or push first if not and dont push if value null as we type it out
			let bnd = '';
			if (val !== null) {
				if (con === 'IN' && Array.isArray(val)) {
					val.map((v) => values.push(v));
					bnd = '(' + val.map((v) => '?').join(',') + ')';
				}
				else {
					values.push(Array.isArray(val) ? val[0] : val);
					bnd = '?';
				}
			}

			// build up where string, does this need to be cast to date for date checks
			let wItem = Array.isArray(w) ? w[Number(k)] : w[k];
			if ((wItem as any).date) q += ` ${c === 0 ? '' : chn} DATE(${this.inject(DataTools.camelToSnake(this.table + '.' + key))}) ${con} DATE(${bnd}) `;
			else q += ` ${c === 0 ? '' : chn} ${this.inject(DataTools.camelToSnake(this.table + '.' + key))} ${con} ${bnd} `;

			// track count
			c++;
		}

		return q;
	}

	/**
	 * @private @method __parseArrayWhere
	 * @description Recursive where clause parser, filtering arrays of object in an SQL way
	 * @param {Object} args The data to use for where building as a nested where object
	 * @param {Array} items Array of the items to filter with SQL where style filtering
	 * @return {Array} The filtered array of items
	 */
	__parseArrayWhere(args: any, items: any[]): any[] {
		if (typeof args !== 'object') throw new ModelError('Cannot set where criteria on array, structure incorrect');
		if (Object.keys(args.where || args).length < 1) return items;

		// need to loop through the where object now and build up the query adding to string
		let w: any = args.where || args; // map all where

		return items.filter((item) => {
			// filter concolusion
			let f = true;

			for (let k in w) {
				// sub query? then tag on with chain type
				if (w[k] && (w[k] as any).where) {
					f = ((w[k] as any).chain ? this.__parseChain((w[k] as any).chain) : 'AND') === 'AND' ? f && this.__parseArrayWhere(w[k], items).length > 0 : f || this.__parseArrayWhere(w[k], items).length > 0;
					continue;
				}

				// is this direct simple matchy or detailed chainy, map to common vars
				let key = Array.isArray(w) ? (w[Number(k)] as any).key : k;
				let val = this.__parseValue(Array.isArray(w) ? (w[Number(k)] as any) : w[k]);
				let con = this.__parseCondition(Array.isArray(w) ? ((w[Number(k)] as any).condition || '=') : '='); // default to equals
				let chn = this.__parseChain(Array.isArray(w) ? ((w[Number(k)] as any).chain || 'AND') : 'AND'); // default to AND

				// do we need to override val and con? if single val in array and default = switch to single val, if more values and default = switch to IN
				if (Array.isArray(val) && val.length < 2 && con !== 'IN') val = val[0];
				if (Array.isArray(val) && val.length > 1 && con === '=') con = 'IN';

				// check key is present in colum list
				if (!item[key]) throw new ModelError(`Cannot set where criteria, key [${key}] not found in data`);

				// if this is a date check we need to convert DateTime to date
				let wItem = Array.isArray(w) ? w[Number(k)] : w[k];
				if ((wItem as any).date) {
					val = new Date(val as any).toISOString().split('T')[0];
					(item as any)[key] = new Date((item as any)[key]).toISOString().split('T')[0];
				}

				// compare
				switch (chn + ' ' + con) {
					case 'AND =': f = f && (item as any)[key] === val; break;
					case 'AND >': f = f && (item as any)[key] > val; break;
					case 'AND <': f = f && (item as any)[key] < val; break;
					case 'AND >=': f = f && (item as any)[key] >= val; break;
					case 'AND <=': f = f && (item as any)[key] <= val; break;
					case 'AND !=': f = f && (item as any)[key] !== val; break;
					case 'AND LIKE': f = f && (new RegExp(`^${(val as string).replace(/\%|\*/g, '.*')}$`)).test((item as any)[key]); break;
					case 'AND NOT LIKE': f = f && !(new RegExp(`^${(val as string).replace(/\%|\*/g, '.*')}$`)).test((item as any)[key]); break;
					case 'AND IN': f = f && (val as any[]).includes((item as any)[key]); break;
					case 'OR =': f = f || (item as any)[key] === val; break;
					case 'OR >': f = f || (item as any)[key] > val; break;
					case 'OR <': f = f || (item as any)[key] < val; break;
					case 'OR >=': f = f || (item as any)[key] >= val; break;
					case 'OR <=': f = f || (item as any)[key] <= val; break;
					case 'OR !=': f = f || (item as any)[key] !== val; break;
					case 'OR LIKE': f = f || (new RegExp(`^${(val as string).replace(/\%|\*/g, '.*')}$`)).test((item as any)[key]); break;
					case 'OR NOT LIKE': f = f || !(new RegExp(`^${(val as string).replace(/\%|\*/g, '.*')}$`)).test((item as any)[key]); break;
					case 'OR IN': f = f || (val as any[]).includes((item as any)[key]); break;
				}
			}

			return f;
		});
	}

	/**
	 * @private @method __parseValue
	 * @description Parser for values to pull them from many typed or generic property names casting to types
	 * @param {Object} val The value sent in as an object with a typeed property such as { boolean: true, string: 'test', number: 1, date: '2018-01-01', value: 'anything' }
	 * @param {Array} values The values to bind to as a pointer
	 * @return {String} The where portion of the clause
	 */
	__parseValue(val: any): any {
		// simple query with a null value or array
		if (val === null) return null;

		// complex query with a specific value
		if (typeof val === 'object') {
			if (val.value || val.value === null) return val.value;
			if (val.string || val.string === null) return String(val.string);
			if (val.number || val.number === null) return Number(val.number);
			if (val.booolean || val.boolean === null) return Boolean(val.boolean);
			if (val.date || val.date === null) return new Date(val.date);
			if (val.dateTime || val.dateTime === null) return new Date(val.dateTime);
		}

		// else just return it
		return val; // not typed so just return
	}

	/**
	 * @private @method __parseCondition
	 * @description Parser for condition used in comparison logic, changing into SQL string
	 * @param {String} con The condition string to be changed to SQL string
	 * @return {String} The condition as SQL string
	 */
	__parseCondition(con: any): string {
		switch (con ? con.toLowerCase() : undefined) {
			case '=': 
			case 'equal':
			case 'equals':
			case 'is':
				return '=';
			case 'gt':
			case 'greater_than':
			case 'greater than':
				return '>';
			case 'lt':
			case 'less_than':
			case 'less than':
				return '<';
			case 'gte':
			case 'greater_than_equals':
			case 'greater than equals':
				return '>=';
			case 'lte':
			case 'less_than_equals':
			case 'less than equals':
				return '<=';
			case 'lk':
			case 'like':
				return 'LIKE';
			case 'nl':
			case 'not_like':
			case 'not like':
				return 'NOT LIKE';
			case '!':
			case '!=':
			case 'nt':
			case 'not':
			case 'not_equal':
			case 'not_equals':
			case 'is_not':
				return '!=';
			case '[]':
			case '()':
			case 'in':
				return 'IN';
			default: throw new ModelError(`Cannot parse where condition [${con}], structure incorrect`);
		}
	}

	/**
	 * @private @method __parseChain
	 * @description Parser for the chain used in chaining arguments such as AND or OR changing to SQL format
	 * @param {String} chn The chain string to be changed to SQL string
	 * @return {String} The SQL string used to chain arguments
	 */
	__parseChain(chn: any): string {
		switch (chn ? chn.toLowerCase() : undefined) {
			case '&':
			case '&&':
			case 'and':
				return 'AND';
			case '|':
			case '||':
			case 'or':
				return 'OR';
			default: throw new ModelError(`Cannot parse where chain [${chn}], structure incorrect`);
		}
	}

	/**
	 * @private @method __parseDirection
	 * @description Parser for standardising incomming data to SQL equivelent
	 * @param {String} dir The direction as a string in several ways
	 * @return {String} The SQL standard sting
	 */
	__parseDirection(dir: any): string {
		switch (dir ? dir.toLowerCase() : undefined) {
			case 'asc':
			case 'ac':
			case 'ascending':
				return 'ASC';
			case 'desc':
			case 'dc':
			case 'descending':
				return 'DESC';
			default: throw new ModelError(`Cannot parse order direction [${dir}], structure incorrect`);
		}
	}
}

