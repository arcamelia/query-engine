import {FieldType, KeyValidator} from "./KeyValidator";
import {QueryValidator} from "./QueryValidator";

export class OptionsValidator {

	private keyValidator: KeyValidator;

	constructor(keyValidator: KeyValidator) {
		this.keyValidator = keyValidator;
	}

	// returns "valid" if body conforms, else returns a helpful error msg
	// query is a JSON object
	public checkOptionsEBNF(query: any): string {
		let options = query.OPTIONS;
		// if (QueryValidator.numKeys(options) > 2) {
		// 	return "Query contains excess keys";
		// }
		if (typeof options === "undefined") {
			return "OPTIONS clause doesn't exist";
		}
		let columnsMsg = this.checkColumnsEBNF(options);
		if (columnsMsg !== QueryValidator.validStr) {
			return columnsMsg;
		}
		let sortMsg = this.checkSortEBNF(options);
		if (sortMsg !== QueryValidator.validStr) {
			return sortMsg;
		}

		return QueryValidator.validStr;
	}

	// check that if sort clause exists it contains an order clause that conforms to EBNF
	private checkSortEBNF(options: any): string {
		let order = options.ORDER;
		if (typeof order === "undefined") {
			// order clause doesn't exist, which is valid
			return QueryValidator.validStr;
		}

		// ORDER object is either ANYKEY || { dir:  DIRECTION, keys: [ ANYKEY (',' ANYKEY)* ] }
		if (typeof order === "string") {
			let validKeyMsg = this.keyValidator.isValidKey(order, FieldType.NA);
			if (validKeyMsg !== QueryValidator.validStr) {
				return validKeyMsg;
			}
		} else {
			let validOrderObjMsg = this.isValidOrderObj(order);
			if (validOrderObjMsg !== QueryValidator.validStr) {
				return validOrderObjMsg;
			}
		}

		return QueryValidator.validStr;
	}

	// valid ORDER object is: { dir:  DIRECTION, keys: [ ANYKEY (',' ANYKEY)* ] }
	private isValidOrderObj(orderObj: any): string {
		// check that direction field exists and is "UP" or "DOWN"
		let dir = orderObj.dir;
		if (typeof dir === "undefined" || (dir !== "UP" && dir !== "DOWN")) {
			return "ORDER clause does not contain valid dir field";
		}

		// check that keys field exists and is a non-empty array of valid ANYKEYs
		let keys = orderObj.keys;
		if (!Array.isArray(keys) || keys.length < 1) {
			return "ORDER.keys is not an array with length >= 1";
		}

		// check that all keys in the keys array are valid ANYKEYS
		for (let key of keys) {
			if (typeof key !== "string") {
				return "ORDER.keys is not an array of strings";
			}
			let validKeyMsg = this.keyValidator.isValidKey(key, FieldType.NA);
			if (validKeyMsg !== QueryValidator.validStr) {
				return validKeyMsg;
			}
		}

		// check that no other fields exist on the orderObj
		if (QueryValidator.numKeys(orderObj) > 2) {
			return "ORDER clause contains extra fields";
		}
		return QueryValidator.validStr;
	}

	// check that columns exist and is a non-empty array of valid keys
	private checkColumnsEBNF(options: any): string {
		let columns = options.COLUMNS;

		if (typeof columns === "undefined") {
			return "COLUMNS clause doesn't exist";
		}
		if (!Array.isArray(columns)) {
			return "COLUMNS is not an array";
		}
		if (columns.length < 1) {
			return "COLUMNS is an empty array";
		}

		for (let col of columns) {
			if (typeof col !== "string") {
				return "COLUMNS is not an array of strings";
			}
			let colCheckMsg = this.keyValidator.isValidKey(col, FieldType.NA);
			if (colCheckMsg !== QueryValidator.validStr) {
				return colCheckMsg;
			}
		}

		return QueryValidator.validStr;
	}
}
