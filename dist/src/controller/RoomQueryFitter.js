"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomQueryFitter = void 0;
const Types_1 = require("./Types");
const QueryFetcher_1 = require("./QueryFetcher");
class RoomQueryFitter {
    constructor() {
    }
    fitsQuery(filterObj, room) {
        let type = Types_1.FilterHelper.filterType(filterObj);
        let filterKey = Types_1.FilterHelper.getFirstKey(filterObj);
        if (type === Types_1.Filter.MComp || type === Types_1.Filter.SComp) {
            let compObj = filterObj[filterKey];
            let field = Types_1.FilterHelper.getFirstKey(compObj);
            let val1 = Types_1.Room.getRoomValue(room, QueryFetcher_1.QueryFetcher.getDatasetKey(field));
            let val2 = compObj[field];
            return RoomQueryFitter.delegateMSCompEval(type, filterKey, val1, val2);
        }
        else {
            return this.delegateNegLogicCompEval(type, filterObj, filterKey, room);
        }
    }
    delegateNegLogicCompEval(filterType, filterObj, filterKey, room) {
        if (filterType === Types_1.Filter.Negation) {
            return !this.fitsQuery(filterObj[filterKey], room);
        }
        else {
            let filterArr = filterObj[filterKey];
            if (filterKey === "AND") {
                return filterArr.reduce((acc, currFilter) => {
                    let currFilterFits = this.fitsQuery(currFilter, room);
                    return acc && currFilterFits;
                }, true);
            }
            else {
                return filterArr.reduce((acc, currFilter) => {
                    let currFilterFits = this.fitsQuery(currFilter, room);
                    return acc || currFilterFits;
                }, false);
            }
        }
    }
    static delegateMSCompEval(filterType, op, val1, val2) {
        if (filterType === Types_1.Filter.MComp) {
            return QueryFetcher_1.QueryFetcher.evaluateMComp(op, val1, val2);
        }
        else {
            return QueryFetcher_1.QueryFetcher.evaluateSComp(val1, val2);
        }
    }
}
exports.RoomQueryFitter = RoomQueryFitter;
//# sourceMappingURL=RoomQueryFitter.js.map