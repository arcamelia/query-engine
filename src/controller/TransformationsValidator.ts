import {FieldType, KeyValidator} from "./KeyValidator";
import {QueryValidator} from "./QueryValidator";
import {FilterHelper} from "./Types";

export class TransformationsValidator {

	private keyValidator: KeyValidator;

	public applyTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];

	constructor(keyValidator: KeyValidator) {
		this.keyValidator = keyValidator;
	}

	// returns "valid" if body conforms, else returns a helpful error msg
	// query is a JSON object
	public checkTransformationsEBNF(query: any): string {
		let transformations = query.TRANSFORMATIONS;

		if (typeof transformations === "undefined") {
			// having no TRANSFORMATIONS clause is valid
			return QueryValidator.validStr;
		}

		let groupMsg = this.checkGroupEBNF(transformations);
		if (groupMsg !== QueryValidator.validStr) {
			return groupMsg;
		}
		let applyMsg = this.checkApplyEBNF(transformations);
		if (applyMsg !== QueryValidator.validStr) {
			return applyMsg;
		}

		return QueryValidator.validStr;
	}

	private checkGroupEBNF(transformationsObj: any): string {
		let groupKeys = transformationsObj.GROUP;

		// check that group keys array exists and is non-empty
		if (typeof groupKeys === "undefined") {
			return "Missing GROUP clause from transformations";
		}
		if (!Array.isArray(groupKeys)) {
			return "GROUP field isn't an array";
		}
		if (groupKeys.length < 1) {
			return "GROUP array is empty";
		}

		// check that group key array is filled only with valid regular keys (not ANYKEYs)
		for (let key of groupKeys) {
			if (typeof key !== "string") {
				return "GROUP array contains non string elements";
			}
			if (!this.keyValidator.isValidMSKey(key, FieldType.NA)) {
				return "GROUP array contains invalid keys";
			}
		}

		return QueryValidator.validStr;
	}

	private checkApplyEBNF(transformationsObj: any): string {
		let applyRules = transformationsObj.APPLY;

		// check that group keys array exists and is non-empty
		if (typeof applyRules === "undefined") {
			return "Missing APPLY clause from transformations";
		}
		if (!Array.isArray(applyRules)) {
			return "APPLY field isn't an array";
		}
		// note: apply array can be empty

		// check that all APPLY RULES in array are valid
		for (let ar of applyRules) {
			let arMsg = this.isValidApplyRule(ar);
			if (arMsg !== QueryValidator.validStr) {
				return arMsg;
			}
		}

		return QueryValidator.validStr;
	}

	// APPLY RULE: { <apply_key>: { <APPLY_TOKEN>: <regular_key> }}
	private isValidApplyRule(ar: any): string {
		let arKey = FilterHelper.getFirstKey(ar);

		// check that key is a valid applyKey
		let arKeyMsg = this.keyValidator.isValidApplyKey(arKey);
		if (arKeyMsg !== QueryValidator.validStr) {
			return arKeyMsg;
		}
		// it's a valid applyKey, add it to our record of applyKeys for the query
		this.keyValidator.applyKeys.push(arKey);

		let applyObj = ar[arKey];

		// check that APPLY_TOKEN is valid
		let applyToken = FilterHelper.getFirstKey(applyObj);
		if (!this.isValidApplyToken(applyToken)) {
			return "Invalid APPLY TOKEN given";
		}

		// check that key is a valid regular key
		let key = applyObj[applyToken];
		let validKeyMsg = this.keyValidator.isValidMSKey(key, FieldType.NA);
		if (validKeyMsg !== QueryValidator.validStr) {
			return validKeyMsg;
		}

		return QueryValidator.validStr;
	}

	private isValidApplyToken(at: string): boolean {
		return this.applyTokens.indexOf(at) !== -1;
	}

}
