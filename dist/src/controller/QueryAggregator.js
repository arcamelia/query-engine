"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryAggregator = void 0;
const Types_1 = require("./Types");
const IInsightFacade_1 = require("./IInsightFacade");
const decimal_js_1 = __importDefault(require("decimal.js"));
const KeyValidator_1 = require("./KeyValidator");
class QueryAggregator {
    constructor() {
    }
    groupAndApplyResults(resultArr, query) {
        let groupArr = query.TRANSFORMATIONS.GROUP;
        let columns = query.OPTIONS.COLUMNS;
        let columnsNoDatasetID = [];
        for (let i = 0; i < columns.length; i++) {
            if (columns[i].includes("_")) {
                columnsNoDatasetID[i] = columns[i].split("_")[1];
            }
            else {
                columnsNoDatasetID[i] = "placeholder";
            }
        }
        let applyArr = query.TRANSFORMATIONS.APPLY;
        let groupMap = QueryAggregator.groupResults(resultArr, groupArr);
        let groupedInsightResults = [];
        for (let [groupKey, groupedRecordsArr] of groupMap) {
            let grpInsightResult = {};
            for (let i = 0; i < columnsNoDatasetID.length; i++) {
                if (columnsNoDatasetID[i] !== "placeholder") {
                    let key = columnsNoDatasetID[i];
                    let irKey = columns[i];
                    grpInsightResult[irKey] = QueryAggregator.getGroupKeyValue(groupKey, groupArr, key);
                }
            }
            for (let applyObj of applyArr) {
                let key = Types_1.FilterHelper.getFirstKey(applyObj);
                let opObj = applyObj[key];
                let op = Types_1.FilterHelper.getFirstKey(opObj);
                let field = opObj[op];
                grpInsightResult[key] = QueryAggregator.evaluateApplyOp(op, field, groupedRecordsArr);
            }
            groupedInsightResults.push(grpInsightResult);
        }
        return groupedInsightResults;
    }
    static groupResults(records, groupArr) {
        if (records[0] instanceof Types_1.Section) {
            return QueryAggregator.groupSectionResults(records, groupArr);
        }
        else if (records[0] instanceof Types_1.Room) {
            return QueryAggregator.groupRoomResults(records, groupArr);
        }
        return new Map();
    }
    static groupSectionResults(records, groupArr) {
        let map = new Map();
        for (let record of records) {
            let mapKey = QueryAggregator.makeMapKey(record, groupArr);
            let mapValue = map.get(mapKey);
            if (typeof mapValue === "undefined") {
                map.set(mapKey, [record]);
            }
            else {
                map.set(mapKey, mapValue.concat(record));
            }
        }
        return map;
    }
    static groupRoomResults(records, groupArr) {
        let map = new Map();
        for (let record of records) {
            let mapKey = QueryAggregator.makeMapKey(record, groupArr);
            let mapValue = map.get(mapKey);
            if (typeof mapValue === "undefined") {
                map.set(mapKey, [record]);
            }
            else {
                map.set(mapKey, mapValue.concat(record));
            }
        }
        return map;
    }
    static makeMapKey(record, groupArr) {
        let type = IInsightFacade_1.InsightDatasetKind.Courses;
        if (record instanceof Types_1.Room) {
            type = IInsightFacade_1.InsightDatasetKind.Rooms;
        }
        let key = "";
        for (let field of groupArr) {
            let val;
            let fieldKey = field.split("_")[1];
            if (type === IInsightFacade_1.InsightDatasetKind.Rooms) {
                val = Types_1.Room.getRoomValue(record, fieldKey);
            }
            else {
                val = Types_1.Section.getSectionValue(record, fieldKey);
            }
            key = key.concat(val + "$");
        }
        return key;
    }
    static undoMapKey(key, groupArr) {
        let arr = key.split("$");
        if (arr.length > 0) {
            arr.pop();
        }
        return arr;
    }
    static getGroupKeyValue(mapKey, groupArr, key) {
        let val = "";
        let groupedValues = QueryAggregator.undoMapKey(mapKey, groupArr);
        for (let i = 0; i < groupArr.length; i++) {
            let groupedField = groupArr[i].split("_")[1];
            if (groupedField === key) {
                val = groupedValues[i];
                break;
            }
        }
        if (KeyValidator_1.KeyValidator.isValidField(key, KeyValidator_1.FieldType.mField)) {
            return Number(val);
        }
        return val;
    }
    static evaluateApplyOp(op, field, group) {
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
    static getMax(group, fieldKey) {
        let type = IInsightFacade_1.InsightDatasetKind.Courses;
        if (group[0] instanceof Types_1.Room) {
            type = IInsightFacade_1.InsightDatasetKind.Rooms;
        }
        let max = Number.NEGATIVE_INFINITY;
        for (let record of group) {
            let curr;
            if (type === IInsightFacade_1.InsightDatasetKind.Courses) {
                record = record;
                curr = Types_1.Section.getSectionValue(record, fieldKey);
            }
            else {
                record = record;
                curr = Types_1.Room.getRoomValue(record, fieldKey);
            }
            if (curr > max) {
                max = curr;
            }
        }
        return max;
    }
    static getMin(group, fieldKey) {
        let type = IInsightFacade_1.InsightDatasetKind.Courses;
        if (group[0] instanceof Types_1.Room) {
            type = IInsightFacade_1.InsightDatasetKind.Rooms;
        }
        let max = Number.POSITIVE_INFINITY;
        for (let record of group) {
            let curr;
            if (type === IInsightFacade_1.InsightDatasetKind.Courses) {
                record = record;
                curr = Types_1.Section.getSectionValue(record, fieldKey);
            }
            else {
                record = record;
                curr = Types_1.Room.getRoomValue(record, fieldKey);
            }
            if (curr < max) {
                max = curr;
            }
        }
        return max;
    }
    static getAvg(group, fieldKey) {
        let type = IInsightFacade_1.InsightDatasetKind.Courses;
        if (group[0] instanceof Types_1.Room) {
            type = IInsightFacade_1.InsightDatasetKind.Rooms;
        }
        let sum = new decimal_js_1.default(0);
        let numRecords = 0;
        for (let record of group) {
            let curr;
            if (type === IInsightFacade_1.InsightDatasetKind.Courses) {
                record = record;
                curr = Types_1.Section.getSectionValue(record, fieldKey);
            }
            else {
                record = record;
                curr = Types_1.Room.getRoomValue(record, fieldKey);
            }
            let currAsDecimal = new decimal_js_1.default(curr);
            sum = sum.add(currAsDecimal);
            numRecords++;
        }
        let avg = sum.toNumber() / numRecords;
        return Number(avg.toFixed(2));
    }
    static getSum(group, fieldKey) {
        let type = IInsightFacade_1.InsightDatasetKind.Courses;
        if (group[0] instanceof Types_1.Room) {
            type = IInsightFacade_1.InsightDatasetKind.Rooms;
        }
        let sum = 0;
        for (let record of group) {
            let curr;
            if (type === IInsightFacade_1.InsightDatasetKind.Courses) {
                record = record;
                curr = Types_1.Section.getSectionValue(record, fieldKey);
            }
            else {
                record = record;
                curr = Types_1.Room.getRoomValue(record, fieldKey);
            }
            sum += curr;
        }
        return Number(sum.toFixed(2));
    }
    static getCount(group, fieldKey) {
        let type = IInsightFacade_1.InsightDatasetKind.Courses;
        if (group[0] instanceof Types_1.Room) {
            type = IInsightFacade_1.InsightDatasetKind.Rooms;
        }
        let uniqueFields = new Map();
        for (let record of group) {
            let field;
            if (type === IInsightFacade_1.InsightDatasetKind.Courses) {
                record = record;
                field = Types_1.Section.getSectionValue(record, fieldKey);
            }
            else {
                record = record;
                field = Types_1.Room.getRoomValue(record, fieldKey);
            }
            let numOccurrences = uniqueFields.get(field);
            if (typeof numOccurrences === "undefined") {
                uniqueFields.set(field, 1);
            }
            else {
                uniqueFields.set(field, numOccurrences++);
            }
        }
        return uniqueFields.size;
    }
}
exports.QueryAggregator = QueryAggregator;
//# sourceMappingURL=QueryAggregator.js.map