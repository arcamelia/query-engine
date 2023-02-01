import {InsightError, InsightResult} from "./IInsightFacade";
import {BodyValidator} from "./BodyValidator";
import {FieldType, KeyValidator} from "./KeyValidator";
import {OptionsValidator} from "./OptionsValidator";
import {TransformationsValidator} from "./TransformationsValidator";
import {FilterHelper} from "./Types";
import {QueryFetcher} from "./QueryFetcher";

export class QueryValidator {

	public static validStr = "valid";
	public static invalidStr = "invalid";

	private readonly keyValidator: KeyValidator;
	private bodyValidator: BodyValidator;
	private optionsValidator: OptionsValidator;
	private transformationsValidator: TransformationsValidator;

	constructor() {
		// console.log("Validating query...");
		this.keyValidator = new KeyValidator();
		this.bodyValidator = new BodyValidator(this.keyValidator);
		this.optionsValidator = new OptionsValidator(this.keyValidator);
		this.transformationsValidator = new TransformationsValidator(this.keyValidator);
	}

	// TODO: check that no more keys than the required ones are given in each object

	// resolves with an empty array if query is valid
	// else rejects with an InsightError describing the error
	public validateQuery(query: unknown): Promise<InsightResult[]> {
		// check that query is not null or undefined
		if (!query) {
			return Promise.reject(new InsightError("Query is undefined or null"));
		}
		// check query is a valid JSON object
		if (!QueryValidator.isValidJSON(query)) {
			return Promise.reject(new InsightError("Query is not a valid JSON object"));
		}
		// safe to parse to JSON now
		let jQuery = JSON.parse(JSON.stringify(query));
		// check query grammar conforms
		let syntaxCheck: string = this.checkQuerySyntax(jQuery);
		if (syntaxCheck !== QueryValidator.validStr) {
			return Promise.reject(new InsightError(syntaxCheck));
		}
		// check query semantics conform
		let semanticsCheck: string = this.checkQuerySemantics(jQuery);
		if (semanticsCheck !== QueryValidator.validStr) {
			return Promise.reject(new InsightError(semanticsCheck));
		}
		// query is valid, resolve promise
		return Promise.resolve([]);
	}

	// returns "valid" if query conforms, else returns a helpful error message
	private checkQuerySyntax(query: any): string {
		// if (QueryValidator.numKeys(query) > 2) {
		// 	return "Query contains excess keys";
		// }
		let bodyMsg = this.bodyValidator.checkBodyEBNF(query);
		if (bodyMsg === QueryValidator.validStr) {

			let optionsMsg =  this.optionsValidator.checkOptionsEBNF(query);
			if (optionsMsg === QueryValidator.validStr) {
				return this.transformationsValidator.checkTransformationsEBNF(query);

			} else {
				return optionsMsg;
			}

		} else {
			return bodyMsg;
		}
	}

	// returns "valid" if query conforms, else returns a helpful error message
	// query is a JSON object
	// semantic checks:
	//		- all ORDER keys provided must be in COLUMNS
	//		- the applyKey in an APPLY RULE should be unique
	//		  (no two APPLY RULEs should share an applyKey with the same name)
	//		- if a GROUP is present, all COLUMNS terms must correspond to either GROUP keys or to
	//		  applyKeys defined in the APPLY block
	//		- MAX/MIN/AVG/SUM should only be requested for numeric keys (COUNT can be requested for all keys)
	private checkQuerySemantics(query: any): string {
		let options = query.OPTIONS;
		let columnsArr = options.COLUMNS;

		// check that ORDER keys are in COLUMNS array (if ORDER clause is specified)
		let order = options.ORDER;
		if (typeof order !== "undefined") {
			// order is just one key
			if (typeof order === "string") {
				let orderKeyMsg = QueryValidator.checkOrderKeysInColumns([order], columnsArr);
				if (orderKeyMsg !== QueryValidator.validStr) {
					return orderKeyMsg;
				}
			} else {
				// order is an object with a keys array
				let orderKeyArr = order.keys;
				let orderKeysMsg = QueryValidator.checkOrderKeysInColumns(orderKeyArr, columnsArr);
				if (orderKeysMsg !== QueryValidator.validStr) {
					return orderKeysMsg;
				}
			}
		}

		// if TRANSFORMATIONS clause is specified (i.e., GROUP and APPLY clauses are specified)
		let transformations = query.TRANSFORMATIONS;
		if (typeof transformations !== "undefined") {
			let applyArr = transformations.APPLY;
			let groupKeyArr = transformations.GROUP;

			// check that MAX/MIN/AVG/SUM is only being called on numeric keys (m fields)
			let applyTokenMsg = QueryValidator.checkNumericApplyTokens(applyArr);
			if (applyTokenMsg !== QueryValidator.validStr) {
				return applyTokenMsg;
			}

			// check that no two APPLY RULEs share an applyKey with the same name
			let uniqueApplyRuleMsg = QueryValidator.checkUniqueApplyRules(applyArr);
			if (uniqueApplyRuleMsg !== QueryValidator.validStr) {
				return uniqueApplyRuleMsg;
			}

			// check that all COLUMNS terms correspond to either GROUP keys or to applyKeys defined in the APPLY block
			let validColsMsg = QueryValidator.checkValidColumns(columnsArr, groupKeyArr, this.keyValidator.applyKeys);
			if (validColsMsg !== QueryValidator.validStr) {
				return validColsMsg;
			}
		}

		return QueryValidator.validStr;
	}

	private static checkValidColumns(columnsArr: string[], groupKeyArr: string[], applyKeyArr: string[]): string {
		for (let col of columnsArr) {
			let isGroupKey = QueryValidator.isEltInArr(col, groupKeyArr);
			let isApplyKeyInApplyBlock = QueryValidator.isEltInArr(col, applyKeyArr);
			if (!isGroupKey && !isApplyKeyInApplyBlock) {
				return "Invalid column name is neither a GROUP key nor an apply key in APPLY block";
			}
		}
		return QueryValidator.validStr;
	}

	private static checkUniqueApplyRules(applyArr: any[]): string {
		let seenSoFarArr: string[] = [];
		for (let applyRule of applyArr) {
			let applyKey = FilterHelper.getFirstKey(applyRule);
			if (QueryValidator.isEltInArr(applyKey, seenSoFarArr)) {
				return "Two APPLY RULEs share an apply key with the same name";
			} else {
				seenSoFarArr.push(applyKey);
			}
		}
		return QueryValidator.validStr;
	}

	private static checkNumericApplyTokens(applyArr: any[]): string {
		for (let applyRule of applyArr) {
			let applyKey = FilterHelper.getFirstKey(applyRule);
			let applyTokenObj = applyRule[applyKey];
			let applyToken = FilterHelper.getFirstKey(applyTokenObj);
			if (applyToken !== "COUNT") {	// applyToken is one of: "MAX", "MIN", "AVG", "SUM"
				let key = applyTokenObj[applyToken].split("_")[1];
				if (!KeyValidator.isValidField(key, FieldType.mField)) {
					return "MAX/MIN/AVG/SUM being called on non-numeric field";
				}
			}
		}
		return QueryValidator.validStr;
	}

	private static checkOrderKeysInColumns(orderKeyArr: string[], columnsArr: string[]): string {
		for (let orderKey of orderKeyArr) {
			if (!QueryValidator.isEltInArr(orderKey, columnsArr)) {
				return "ORDER key not in COLUMNS array";
			}
		}
		return QueryValidator.validStr;
	}

	// returns true if elt is in arr
	private static isEltInArr(elt: string, arr: string[]): boolean {
		return arr.indexOf(elt) !== -1;
	}

	public static numKeys(obj: any) {
		return Object.keys(obj).length;
	}

	// returns true if obj is a valid JSON object
	private static isValidJSON(obj: unknown): boolean {
		let stringObj = typeof obj !== "string" ? JSON.stringify(obj) : obj;
		let jsonObj;
		try {
			jsonObj = JSON.parse(stringObj);
		} catch (e) {
			return false;
		}
		return jsonObj && typeof jsonObj === "object";
	}
}
