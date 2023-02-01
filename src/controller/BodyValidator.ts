import {QueryValidator} from "./QueryValidator";
import {Filter, FilterHelper} from "./Types";
import {FieldType, KeyValidator} from "./KeyValidator";

export class BodyValidator {

	private keyValidator: KeyValidator;

	constructor(keyValidator: KeyValidator) {
		this.keyValidator = keyValidator;
	}

	// returns "valid" if body conforms, else returns a helpful error msg
	// query is a JSON object
	public checkBodyEBNF(query: any): string {
		let body = query.WHERE;
		// if (QueryValidator.numKeys(body) > 1) {
		// 	return "Query contains excess keys";
		// }
		if (typeof body === "undefined") {
			return "WHERE clause doesn't exist";
		}
		if (JSON.stringify(body) === JSON.stringify({})) {  // empty WHERE clause is valid
			return QueryValidator.validStr;
		}
		return this.checkFilterEBNF(body);
	}

	// recursive helper to check if all filters in WHERE clause are valid
	private checkFilterEBNF(filter: any): string {
		let type: Filter = FilterHelper.filterType(filter);
		if (type === Filter.Invalid) {
			return "Query body contains an invalid filter";
		}
		if (type === Filter.MComp) {  // base case
			return this.checkMCompFilter(filter);
		} else if (type === Filter.SComp) {  // base case
			return this.checkSCompFilter(filter);
		} else if (type === Filter.Negation) {	// recurse
			return this.checkFilterEBNF(filter.NOT);
		} else {  // recurse
			return this.checkLogicCompFilter(filter);
		}
	}

	// verify that given logic comp filter has an array as its value, and that each filter in the array is also valid
	// filter key is one of: "AND", "OR"
	private checkLogicCompFilter(filterObj: any): string {
		let key = FilterHelper.getFirstKey(filterObj);
		let filterArr = filterObj[key];
		if (!Array.isArray(filterArr)) {
			return "LOGIC COMPARISON filter value is not an array";
		}
		if (filterArr.length === 0) {
			return "LOGIC COMPARISON filter is empty";
		}
		for (let filter of filterArr) {
			let msg = this.checkFilterEBNF(filter);
			if (msg !== QueryValidator.validStr) {
				return msg;
			}
		}
		return QueryValidator.validStr;
	}

	// { "IS": { sKey: [*]? inputString [*]? } }
	//		   |---------- sCompObj ---------|
	private checkSCompFilter(filter: any): string {
		let sCompObj = filter.IS;
		let sKey = FilterHelper.getFirstKey(sCompObj);

		let keyValidMsg = this.keyValidator.isValidKey(sKey, FieldType.sField);
		if (keyValidMsg !== QueryValidator.validStr) {
			return keyValidMsg;
		}

		let compString = sCompObj[sKey];
		if (typeof compString !== "string") {
			return "Input for S COMPARISON filter is not a string";
		}

		// check that there isn't an asterisk in the wrong spot of the comparison string
		if (BodyValidator.wrongAsterisk(compString)) {
			return "S COMPARISON string contains invalid asterisk";
		}

		return QueryValidator.validStr;
	}

	// returns true if s has an asterisk that isn't the first or last character of the string
	private static wrongAsterisk(s: string): boolean {
		let stringArr: string[] = Array.from(s);
		let wrongAsterisk = false;
		for (let i = 0; i < stringArr.length; i++) {
			// an asterisk can appear as the first and last character of s without consequence
			if (i !== 0 && i !== stringArr.length - 1) {
				if (stringArr[i] === "*") {
					wrongAsterisk = true;
					break;
				}
			}
		}
		return wrongAsterisk;
	}

	// { mCompType: { mKey: number } }
	//				|-- mCompObj --|
	private checkMCompFilter(filter: any): string {
		let mCompType = FilterHelper.mCompType(filter);
		if (mCompType === QueryValidator.invalidStr) {
			return "Invalid M COMPARATOR";
		}

		let mCompObj = filter[mCompType];
		let mKey = FilterHelper.getFirstKey(mCompObj);

		let keyValidMsg = this.keyValidator.isValidKey(mKey, FieldType.mField);
		if (keyValidMsg !== QueryValidator.validStr) {
			return keyValidMsg;
		}

		if (typeof mCompObj[mKey] !== "number") {
			return "M COMPARISON not comparing m key to a number";
		}

		return QueryValidator.validStr;
	}

}
