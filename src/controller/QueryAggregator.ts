import {FilterHelper, Room, Section} from "./Types";
import {InsightDatasetKind, InsightResult} from "./IInsightFacade";
import Decimal from "decimal.js";
import {FieldType, KeyValidator} from "./KeyValidator";

export class QueryAggregator {
	constructor() {
		// console.log("Aggregating results...");
	}

	//  if GROUP/APPLY clause is given:
	//       1. group insightResultArr into prescribed groups
	//       2. execute APPLY operation(s)
	public groupAndApplyResults(resultArr: Section[] | Room[], query: any): InsightResult[] {
		let groupArr: string[] = query.TRANSFORMATIONS.GROUP;
		let columns: string[] = query.OPTIONS.COLUMNS;

		let columnsNoDatasetID: string[] = [];
		for (let i = 0; i < columns.length; i++) {
			if (columns[i].includes("_")) {
				columnsNoDatasetID[i] = columns[i].split("_")[1];
			} else {
				columnsNoDatasetID[i] = "placeholder";
			}
		}

		let applyArr: any[] = query.TRANSFORMATIONS.APPLY;
		let groupMap: Map<string, Section[] | Room[]> = QueryAggregator.groupResults(resultArr, groupArr);
		let groupedInsightResults: InsightResult[] = [];

		for (let [groupKey,groupedRecordsArr] of groupMap) {
			let grpInsightResult: InsightResult = {};

			// add regular column values to the insight result
			for (let i = 0; i < columnsNoDatasetID.length; i++) {
				if (columnsNoDatasetID[i] !== "placeholder") {
					let key = columnsNoDatasetID[i];
					let irKey = columns[i];
					grpInsightResult[irKey] = QueryAggregator.getGroupKeyValue(groupKey, groupArr, key);
				}
			}

			// add aggregated column values to the insight result
			for (let applyObj of applyArr) {
				let key: string = FilterHelper.getFirstKey(applyObj);
				let opObj = applyObj[key];
				let op: string = FilterHelper.getFirstKey(opObj);
				let field: string = opObj[op];
				grpInsightResult[key] = QueryAggregator.evaluateApplyOp(op, field, groupedRecordsArr);
			}

			groupedInsightResults.push(grpInsightResult);
		}

		return groupedInsightResults;
	}

	// groups all records in the resultsArr by the unique values of the fields specified by the groupArr
	// delegates to group Section and Room results differently
	private static groupResults(records: Section[] | Room[], groupArr: string[]): Map<string, Section[] | Room[]> {
		if (records[0] instanceof Section) {
			return QueryAggregator.groupSectionResults(records as Section[], groupArr);
		} else if (records[0] instanceof Room) {
			return QueryAggregator.groupRoomResults(records as Room[], groupArr);
		}
		return new Map<string, Section[] | Room[]>();
	}

	// creates a map with the keys based on the groupArr and the values are all sections that have the same key
	private static groupSectionResults(records: Section[], groupArr: string[]): Map<string, Section[]> {
		let map: Map<string, Section[]> = new Map<string, Section[]>();
		for (let record of records) {
			let mapKey = QueryAggregator.makeMapKey(record, groupArr);
			let mapValue = map.get(mapKey);
			if (typeof mapValue === "undefined") {
				map.set(mapKey, [record]);
			} else {
				map.set(mapKey, mapValue.concat(record));
			}
		}
		return map;
	}

	// creates a map with the keys based on the groupArr and the values are all rooms that have the same key
	private static groupRoomResults(records: Room[], groupArr: string[]): Map<string, Room[]> {
		let map: Map<string, Room[]> = new Map<string, Room[]>();
		for (let record of records) {
			let mapKey = QueryAggregator.makeMapKey(record, groupArr);
			let mapValue = map.get(mapKey);
			if (typeof mapValue === "undefined") {
				map.set(mapKey, [record]);
			} else {
				map.set(mapKey, mapValue.concat(record));
			}
		}
		return map;
	}

	// makes a key that is the concatenated values of the grouped columns, separated by $
	private static makeMapKey(record: Section | Room, groupArr: string[]): string {
		let type: InsightDatasetKind = InsightDatasetKind.Courses;
		if (record instanceof Room) {
			type = InsightDatasetKind.Rooms;
		}

		let key = "";
		for (let field of groupArr) {
			let val: string | number;
			let fieldKey = field.split("_")[1];
			if (type === InsightDatasetKind.Rooms) {
				val = Room.getRoomValue(record as Room, fieldKey);
			} else {
				val = Section.getSectionValue(record as Section, fieldKey);
			}
			key = key.concat(val + "$");
		}
		return key;
	}

	// returns a string array of the decomposed key
	private static undoMapKey(key: string, groupArr: string[]): string[] {
		let arr: string[] = key.split("$");
		// last entry of arr is an empty string (since a $ is always the last character of the key if its non empty)
		if (arr.length > 0) {
			arr.pop();
		}
		return arr;
	}

	// mapKey is the values of the grouped columns, separated by $
	// groupArr contains the fields that are in the groupKey
	// key is the field that we want the value for
	private static getGroupKeyValue(mapKey: string, groupArr: string[], key: string): string | number {
		let val: string = "";
		let groupedValues: string[] = QueryAggregator.undoMapKey(mapKey, groupArr);
		for (let i = 0; i < groupArr.length; i++) {
			let groupedField = groupArr[i].split("_")[1];
			if (groupedField === key) {
				val = groupedValues[i];
				break;
			}
		}
		// if the key is a numeric field convert val to a number before returning it
		if (KeyValidator.isValidField(key, FieldType.mField)) {
			return Number(val);
		}
		return val;
	}

	// op is one of: MAX, MIN, AVG, SUM, COUNT
	private static evaluateApplyOp(op: string, field: string, group: Section[] | Room[]): number {
		let fieldKey = field.split("_")[1];
		switch (op) {
			case "MAX": return QueryAggregator.getMax(group, fieldKey);
			case "MIN": return QueryAggregator.getMin(group, fieldKey);
			case "AVG": return QueryAggregator.getAvg(group, fieldKey);
			case "SUM": return QueryAggregator.getSum(group, fieldKey);
			case "COUNT": return QueryAggregator.getCount(group, fieldKey);
		}
		return -1;
	}

	// can only be called on numeric fields
	private static getMax(group: Section[] | Room[], fieldKey: string): number {
		let type: InsightDatasetKind = InsightDatasetKind.Courses;
		if (group[0] instanceof Room) {
			type = InsightDatasetKind.Rooms;
		}

		let max = Number.NEGATIVE_INFINITY;
		for (let record of group) {
			let curr: number;
			if (type === InsightDatasetKind.Courses) {
				record = record as Section;
				curr = Section.getSectionValue(record, fieldKey) as number;
			} else {
				record = record as Room;
				curr = Room.getRoomValue(record, fieldKey) as number;
			}
			if (curr > max) {
				max = curr;
			}
		}

		return max;
	}

	// can only be called on numeric keys
	private static getMin(group: Section[] | Room[], fieldKey: string): number {
		let type: InsightDatasetKind = InsightDatasetKind.Courses;
		if (group[0] instanceof Room) {
			type = InsightDatasetKind.Rooms;
		}

		let max = Number.POSITIVE_INFINITY;
		for (let record of group) {
			let curr: number;
			if (type === InsightDatasetKind.Courses) {
				record = record as Section;
				curr = Section.getSectionValue(record, fieldKey) as number;
			} else {
				record = record as Room;
				curr = Room.getRoomValue(record, fieldKey) as number;
			}
			if (curr < max) {
				max = curr;
			}
		}

		return max;
	}

	// can only be called on numeric fields
	// sums using the decimal package (ie can't get sum from getSum method bc it is summed differently)
	private static getAvg(group: Section[] | Room[], fieldKey: string): number {
		let type: InsightDatasetKind = InsightDatasetKind.Courses;
		if (group[0] instanceof Room) {
			type = InsightDatasetKind.Rooms;
		}

		let sum: Decimal = new Decimal(0);
		let numRecords = 0;
		for (let record of group) {
			let curr: number;
			if (type === InsightDatasetKind.Courses) {
				record = record as Section;
				curr = Section.getSectionValue(record, fieldKey) as number;
			} else {
				record = record as Room;
				curr = Room.getRoomValue(record, fieldKey) as number;
			}
			let currAsDecimal: Decimal = new Decimal(curr);
			sum = sum.add(currAsDecimal);
			numRecords++;
		}

		let avg: number = sum.toNumber() / numRecords;
		return Number(avg.toFixed(2));
	}

	// can only be called on numeric fields
	private static getSum(group: Section[] | Room[], fieldKey: string): number {
		let type: InsightDatasetKind = InsightDatasetKind.Courses;
		if (group[0] instanceof Room) {
			type = InsightDatasetKind.Rooms;
		}

		let sum = 0;
		for (let record of group) {
			let curr: number;
			if (type === InsightDatasetKind.Courses) {
				record = record as Section;
				curr = Section.getSectionValue(record, fieldKey) as number;
			} else {
				record = record as Room;
				curr = Room.getRoomValue(record, fieldKey) as number;
			}
			sum += curr;
		}

		return Number(sum.toFixed(2));
	}

	// uses a map to account for duplicate field values (we only want to count the number of unique values)
	private static getCount(group: Section[] | Room[], fieldKey: string): number {
		let type: InsightDatasetKind = InsightDatasetKind.Courses;
		if (group[0] instanceof Room) {
			type = InsightDatasetKind.Rooms;
		}

		// map key is the field value, map value is the number of occurrences of that field in the given group
		let uniqueFields: Map<string | number, number> = new Map<string, number>();
		for (let record of group) {
			let field: string | number;
			if (type === InsightDatasetKind.Courses) {
				record = record as Section;
				field = Section.getSectionValue(record, fieldKey) as number;
			} else {
				record = record as Room;
				field = Room.getRoomValue(record, fieldKey) as number;
			}

			let numOccurrences = uniqueFields.get(field);
			if (typeof numOccurrences === "undefined") {
				uniqueFields.set(field, 1);
			} else {
				uniqueFields.set(field, numOccurrences++);
			}
		}

		return uniqueFields.size;
	}
}
