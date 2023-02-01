import {Filter, FilterHelper, Section} from "./Types";
import {QueryFetcher} from "./QueryFetcher";

export class SectionQueryFitter {
	constructor() {
		//
	}

	// returns true if section fits given filter object
	public fitsQuery(filterObj: any, section: Section): boolean {
		let type = FilterHelper.filterType(filterObj);
		let filterKey = FilterHelper.getFirstKey(filterObj);
		if (type === Filter.MComp || type === Filter.SComp) { // base case
			let compObj = filterObj[filterKey];
			let field = FilterHelper.getFirstKey(compObj);
			let val1 = Section.getSectionValue(section, QueryFetcher.getDatasetKey(field));
			let val2 = compObj[field];
			return SectionQueryFitter.delegateMSCompEval(type, filterKey, val1, val2);
		} else {
			return this.delegateNegLogicCompEval(type, filterObj, filterKey, section);
		}
	}

	// REQUIRES: filterType is Filter.Negation | Filter.LogicComp
	private delegateNegLogicCompEval(filterType: Filter, filterObj: any, filterKey: string, section: Section): boolean {
		if (filterType === Filter.Negation) {
			return !this.fitsQuery(filterObj[filterKey], section);
		} else {  // logic comparison
			let filterArr = filterObj[filterKey];
			if (filterKey === "AND") {
				return filterArr.reduce((acc: boolean, currFilter: any) => {
					let currFilterFits = this.fitsQuery(currFilter, section);
					return acc && currFilterFits;
				}, true);
			} else {	// filterKey === "OR"
				return filterArr.reduce((acc: boolean, currFilter: boolean) => {
					let currFilterFits = this.fitsQuery(currFilter, section);
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
