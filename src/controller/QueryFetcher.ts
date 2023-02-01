import {InsightError, InsightResult, ResultTooLargeError} from "./IInsightFacade";
import {Dataset, Room, Section} from "./Types";
import {DatasetMap} from "./DatasetMap";
import {QueryAggregator} from "./QueryAggregator";
import {RoomQueryFitter} from "./RoomQueryFitter";
import {SectionQueryFitter} from "./SectionQueryFitter";

export class QueryFetcher {
	private datasets: DatasetMap;

	constructor(datasets: DatasetMap) {
		this.datasets = datasets;
		// console.log("Fetching data...");
	}

	// REQUIRES: query is syntactically and semantically valid
	// RETURNS: an InsightResult array of all sections or rooms that meet the criteria given in the query
	public fetchResults(query: any): Promise<InsightResult[]> {
		let columns: string[] = query.OPTIONS.COLUMNS;
		let datasetID: string = QueryFetcher.getDatasetID(columns[0]);
		let dataset: Dataset | undefined = this.datasets.getDataset(datasetID);

		if (typeof dataset === "undefined") {
			return Promise.reject(new InsightError("Query references a dataset that has not been added"));
		}

		let recordsThatFitQuery: Section[] | Room[] = this.getRecordsThatFitQuery(dataset, query);

		let insightResultArr: InsightResult[] = [];

		// apply aggregation if transformations clause is given
		let transformations = query.TRANSFORMATIONS;
		if (typeof transformations !== "undefined") {
			// this also takes care of building the insight result array
			let aggregator: QueryAggregator = new QueryAggregator();
			insightResultArr = aggregator.groupAndApplyResults(recordsThatFitQuery, query);
		} else {
			// no special columns, just build a regular array of insight results
			for (let record of recordsThatFitQuery) {
				let irRecord = QueryFetcher.createInsightResult(record, columns);
				insightResultArr.push(irRecord);
			}
		}

		// reject with result too large error if number of rows > 5000
		if (insightResultArr.length > 5000) {
			return Promise.reject(new ResultTooLargeError("More than 5000 results"));
		}

		// sort results if order clause is given
		let order = query.OPTIONS.ORDER;
		if (typeof order !== "undefined") {
			insightResultArr = QueryFetcher.sortResults(insightResultArr, order);
		}

		return Promise.resolve(insightResultArr);
	}

	// build an array of Sections or Rooms that fits the query
	private getRecordsThatFitQuery(dataset: Dataset, query: any): Section[] | Room[] {
		let queryBody = query.WHERE;
		let blankWhere = JSON.stringify(queryBody) === JSON.stringify({});
		let numRows = 0;

		if (dataset.sections) {
			let sections = dataset.sections;
			let resultSections: Section[] = [];
			for (let section of sections) {
				if (blankWhere || this.fitsQuery(queryBody, section)) {
					resultSections.push(section);
					numRows++;
				}
			}
			return resultSections;

		} else if (dataset.rooms) {
			let rooms = dataset.rooms;
			let resultRooms: Room[] = [];
			for (let room of rooms) {
				if (blankWhere || this.fitsQuery(queryBody, room)) {
					resultRooms.push(room);
					numRows++;
				}
			}
			return resultRooms;
		}

		return [];
	}

	// expects that columns doesn't have any aggregation keys
	// create an InsightResult from a Section or Room and the list of columns that the InsightResult must have
	private static createInsightResult(record: Section | Room, columns: string[]): InsightResult {
		let irRecord: InsightResult = {};

		let columnsNoDatasetID: string[] = [];
		for (let i = 0; i < columns.length; i++) {
			columnsNoDatasetID[i] = columns[i].split("_")[1];
		}

		for (let i = 0; i < columnsNoDatasetID.length; i++) {
			let key = columnsNoDatasetID[i];
			let irKey = columns[i];

			if (record instanceof Room) {
				let room = record as Room;
				irRecord[irKey] = Room.getRoomValue(room, key);
			} else {
				let section = record as Section;
				irRecord[irKey] = Section.getSectionValue(section, key);
			}
		}

		return irRecord;
	}

	// delegates to SectionQueryFitter or RoomQueryFitter based on record type
	public fitsQuery(filterObj: any, record: Section | Room): boolean {
		if (record instanceof Room) {
			let roomFitter = new RoomQueryFitter();
			return roomFitter.fitsQuery(filterObj, record as Room);
		} else {
			let sectionFitter = new SectionQueryFitter();
			return sectionFitter.fitsQuery(filterObj, record as Section);
		}
	}

	// returns true if fieldString contains compString
	public static evaluateSComp(fieldString: string, compString: string): boolean {
		let wildcardFirst: boolean = compString.startsWith("*");
		let wildcardLast: boolean = compString.endsWith("*");
		if (wildcardFirst && wildcardLast) {
			compString = compString.substring(1, compString.length - 1);
			return fieldString.includes(compString);
		} else if (wildcardFirst) {
			compString = compString.substring(1);
			return fieldString.endsWith(compString);
		} else if (wildcardLast) {
			compString = compString.substring(0, compString.length - 1);
			return fieldString.startsWith(compString);
		}
		return fieldString === compString;
	}

	// REQUIRES: op is one of: ">", "<", "==="
	public static evaluateMComp(op: string, a: number, b: number): boolean {
		switch (op) {
			case "GT":
				return a > b;
			case "LT":
				return a < b;
			case "EQ":
				return a === b;
		}
		return false;
	}

	public static getDatasetKey(queryKey: string): string {
		return queryKey.split("_")[1];
	}

	private static getDatasetID(queryKey: string): string {
		return queryKey.split("_")[0];
	}

	private static sortResults(resultsArr: InsightResult[], order: any): InsightResult[] {
		if (typeof order === "string") {
			return QueryFetcher.sortByOneColumn(resultsArr, order, "UP");
		}
		return QueryFetcher.sortResultsWithOrderObj(resultsArr, order);
	}

	// orderObj: { dir: DIRECTION, keys: [ ANYKEY, ANYKEY* ] }
	private static sortResultsWithOrderObj(resultsArr: InsightResult[], orderObj: any): InsightResult[] {
		let direction = orderObj.dir;
		let sortKeys = orderObj.keys;

		if (sortKeys.length === 0) {
			return resultsArr;
		}
		if (sortKeys.length === 1) {
			return QueryFetcher.sortByOneColumn(resultsArr, sortKeys[0], direction);
		}
		return QueryFetcher.sortByMultipleColumns(resultsArr, sortKeys, direction);
	}

	private static sortByMultipleColumns(arr: InsightResult[], sortKeys: string[], dir: string): InsightResult[] {
		// a return value < 0 puts x before y, a return value > 0 puts y before x
		return arr.sort(function (x, y) {
			let key = sortKeys[0];
			let xVal: any = x[key];
			let yVal: any = y[key];

			// break ties
			for (let i = 1; i < sortKeys.length; i++) {
				if (xVal === yVal) {
					key = sortKeys[i];
					xVal = x[key];
					yVal = y[key];
				} else {
					break;
				}
			}

			if (xVal < yVal) {
				if (dir === "UP") {
					return -1;
				} else {
					return 1;
				}
			} else {
				if (dir === "UP") {
					return 1;
				} else {
					return -1;
				}
			}
		});
	}

	private static sortByOneColumn(resultsArr: InsightResult[], orderKey: string, dir: string): InsightResult[] {
		return resultsArr.sort(function (x, y) {
			let xVal: any = x[orderKey];
			let yVal: any = y[orderKey];

			if (xVal < yVal) {
				if (dir === "UP") {
					return -1;
				} else {
					return 1;
				}
			} else {
				if (dir === "UP") {
					return 1;
				} else {
					return -1;
				}
			}
		});
	}

	// // returns true if section fits given filter object
	// public fitsQuery(filterObj: any, section: Section): boolean {
	// 	let type = FilterHelper.filterType(filterObj);
	// 	let filterKey = FilterHelper.getFirstKey(filterObj);
	// 	if (type === Filter.MComp || type === Filter.SComp) { // base case
	// 		let compObj = filterObj[filterKey];
	// 		let field = FilterHelper.getFirstKey(compObj);
	// 		let val1 = Section.getSectionValue(section, QueryFetcher.getDatasetKey(field));
	// 		let val2 = compObj[field];
	// 		return QueryFetcher.delegateMSCompEval(type, filterKey, val1, val2);
	// 	} else {
	// 		return this.delegateNegLogicCompEval(type, filterObj, filterKey, section);
	// 	}
	// }
	//
	// // REQUIRES: filterType is Filter.Negation | Filter.LogicComp
	// private delegateNegLogicCompEval(filterType: Filter, filterObj: any, filterKey: string, section: Section): boolean {
	// 	if (filterType === Filter.Negation) {
	// 		return !this.fitsQuery(filterObj[filterKey], section);
	// 	} else {  // logic comparison
	// 		let filterArr = filterObj[filterKey];
	// 		if (filterKey === "AND") {
	// 			return filterArr.reduce((acc: boolean, currFilter: any) => {
	// 				let currFilterFits = this.fitsQuery(currFilter, section);
	// 				return acc && currFilterFits;
	// 			}, true);
	// 		} else {	// filterKey === "OR"
	// 			return filterArr.reduce((acc: boolean, currFilter: boolean) => {
	// 				let currFilterFits = this.fitsQuery(currFilter, section);
	// 				return acc || currFilterFits;
	// 			}, false);
	// 		}
	// 	}
	// }
	//
	// // REQUIRES: filterType is Filter.MComp | Filter.SComp, val1 & val2 are string | number
	// private static delegateMSCompEval(filterType: Filter, op: string, val1: any, val2: any): boolean {
	// 	if (filterType === Filter.MComp) {
	// 		return QueryFetcher.evaluateMComp(op, val1, val2);
	// 	} else {
	// 		return QueryFetcher.evaluateSComp(val1, val2);
	// 	}
	// }

}
