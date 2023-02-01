import {QueryValidator} from "./QueryValidator";

export enum FieldType {
	mField, sField, NA
}

export class KeyValidator {

	private datasetID: string;
	private firstKeyEncountered: boolean;

	public static mFields = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
	public static sFields = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname",
		"number", "name", "address", "type", "furniture", "href"];

	public static possibleFields = KeyValidator.mFields.concat(KeyValidator.sFields);

	public applyKeys: string[];

	constructor() {
		this.datasetID = "not_set";
		this.firstKeyEncountered = false;
		this.applyKeys = [];
	}

	// returns validStr if key is valid, else returns a helpful error message
	// key is: "<dataset_id>_<query_field>"
	public isValidKey(key: string, type: FieldType): string {
		let msKeyMsg = this.isValidMSKey(key, type);
		let applyKeyMsg = this.isValidApplyKey(key);
		if (msKeyMsg === QueryValidator.validStr || applyKeyMsg === QueryValidator.validStr) {
			return QueryValidator.validStr;
		}
		if (msKeyMsg !== QueryValidator.validStr) {
			return msKeyMsg;
		}
		return applyKeyMsg;
	}

	// returns QueryValidator.validStr if given key is a valid applykey
	public isValidApplyKey(key: string): string {
		let numUnderscores = key.replace(/[^_]/g, "").length;
		if (numUnderscores > 0) {
			return "Apply key contains an underscore";
		}
		return QueryValidator.validStr;
	}

	// mkey: "<id>_<mfield>"
	// skey: "<id>_<sfield>"
	// returns QueryValidator.validStr if given key is a valid mkey or skey
	public isValidMSKey(key: string, type: FieldType): string {
		// check that key has one underscore
		let numUnderscores = key.replace(/[^_]/g, "").length;
		if (numUnderscores > 1) {
			return "Query key contains more than one underscore";
		}
		if (numUnderscores === 0) {
			return "Query key doesn't contain an underscore";
		}

		// check that the dataset id & query field are both valid
		let keyParts = key.split("_");
		let id = keyParts[0];
		let field = keyParts[1];

		if (!this.isSameDatasetID(id)) {
			return "Dataset IDs do not match across query";
		}

		if (!KeyValidator.isValidField(field, type)) {
			if (type === FieldType.mField) {
				return "Invalid m field";
			} else if (type === FieldType.sField) {
				return "Invalid s field";
			}
			return "Invalid dataset query field";
		}

		return QueryValidator.validStr;
	}

	// if we are encountering a dataset id for the first time, set it and return true
	// else check if the id matches our dataset id for the overall query
	private isSameDatasetID(id: string): boolean {
		if (!this.firstKeyEncountered) {
			this.datasetID = id;
			this.firstKeyEncountered = true;
			return true;
		} else {
			return id === this.datasetID;
		}
	}

	public static isValidField(key: string, type: FieldType): boolean {
		switch (type) {
			case FieldType.mField:
				return KeyValidator.mFields.indexOf(key) !== -1;
			case FieldType.sField:
				return KeyValidator.sFields.indexOf(key) !== -1;
			case FieldType.NA:
				return KeyValidator.possibleFields.indexOf(key) !== -1;
			default:
				return false;
		}
	}
}
