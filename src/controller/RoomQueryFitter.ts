import {Filter, FilterHelper, Room, Section} from "./Types";
import {QueryFetcher} from "./QueryFetcher";

export class RoomQueryFitter {
	constructor() {
		//
	}

	// returns true if section fits given filter object
	public fitsQuery(filterObj: any, room: Room): boolean {
		let type = FilterHelper.filterType(filterObj);
		let filterKey = FilterHelper.getFirstKey(filterObj);
		if (type === Filter.MComp || type === Filter.SComp) { // base case
			let compObj = filterObj[filterKey];
			let field = FilterHelper.getFirstKey(compObj);
			let val1 = Room.getRoomValue(room, QueryFetcher.getDatasetKey(field));
			let val2 = compObj[field];
			return RoomQueryFitter.delegateMSCompEval(type, filterKey, val1, val2);
		} else {
			return this.delegateNegLogicCompEval(type, filterObj, filterKey, room);
		}
	}

	// REQUIRES: filterType is Filter.Negation | Filter.LogicComp
	private delegateNegLogicCompEval(filterType: Filter, filterObj: any, filterKey: string, room: Room): boolean {
		if (filterType === Filter.Negation) {
			return !this.fitsQuery(filterObj[filterKey], room);
		} else {  // logic comparison
			let filterArr = filterObj[filterKey];
			if (filterKey === "AND") {
				return filterArr.reduce((acc: boolean, currFilter: any) => {
					let currFilterFits = this.fitsQuery(currFilter, room);
					return acc && currFilterFits;
				}, true);
			} else {	// filterKey === "OR"
				return filterArr.reduce((acc: boolean, currFilter: boolean) => {
					let currFilterFits = this.fitsQuery(currFilter, room);
					return acc || currFilterFits;
				}, false);
			}
		}
	}

	// REQUIRES: filterType is Filter.MComp | Filter.SComp, val1 & val2 are string | number
	private static delegateMSCompEval(filterType: Filter, op: string, val1: any, val2: any): boolean {
		if (filterType === Filter.MComp) {
			return QueryFetcher.evaluateMComp(op, val1, val2);
		} else {
			return QueryFetcher.evaluateSComp(val1, val2);
		}
	}

}
