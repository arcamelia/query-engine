"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryFetcher = void 0;
const IInsightFacade_1 = require("./IInsightFacade");
const Types_1 = require("./Types");
const QueryAggregator_1 = require("./QueryAggregator");
const RoomQueryFitter_1 = require("./RoomQueryFitter");
const SectionQueryFitter_1 = require("./SectionQueryFitter");
class QueryFetcher {
    constructor(datasets) {
        this.datasets = datasets;
    }
    fetchResults(query) {
        let columns = query.OPTIONS.COLUMNS;
        let datasetID = QueryFetcher.getDatasetID(columns[0]);
        let dataset = this.datasets.getDataset(datasetID);
        if (typeof dataset === "undefined") {
            return Promise.reject(new IInsightFacade_1.InsightError("Query references a dataset that has not been added"));
        }
        let recordsThatFitQuery = this.getRecordsThatFitQuery(dataset, query);
        let insightResultArr = [];
        let transformations = query.TRANSFORMATIONS;
        if (typeof transformations !== "undefined") {
            let aggregator = new QueryAggregator_1.QueryAggregator();
            insightResultArr = aggregator.groupAndApplyResults(recordsThatFitQuery, query);
        }
        else {
            for (let record of recordsThatFitQuery) {
                let irRecord = QueryFetcher.createInsightResult(record, columns);
                insightResultArr.push(irRecord);
            }
        }
        if (insightResultArr.length > 5000) {
            return Promise.reject(new IInsightFacade_1.ResultTooLargeError("More than 5000 results"));
        }
        let order = query.OPTIONS.ORDER;
        if (typeof order !== "undefined") {
            insightResultArr = QueryFetcher.sortResults(insightResultArr, order);
        }
        return Promise.resolve(insightResultArr);
    }
    getRecordsThatFitQuery(dataset, query) {
        let queryBody = query.WHERE;
        let blankWhere = JSON.stringify(queryBody) === JSON.stringify({});
        let numRows = 0;
        if (dataset.sections) {
            let sections = dataset.sections;
            let resultSections = [];
            for (let section of sections) {
                if (blankWhere || this.fitsQuery(queryBody, section)) {
                    resultSections.push(section);
                    numRows++;
                }
            }
            return resultSections;
        }
        else if (dataset.rooms) {
            let rooms = dataset.rooms;
            let resultRooms = [];
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
    static createInsightResult(record, columns) {
        let irRecord = {};
        let columnsNoDatasetID = [];
        for (let i = 0; i < columns.length; i++) {
            columnsNoDatasetID[i] = columns[i].split("_")[1];
        }
        for (let i = 0; i < columnsNoDatasetID.length; i++) {
            let key = columnsNoDatasetID[i];
            let irKey = columns[i];
            if (record instanceof Types_1.Room) {
                let room = record;
                irRecord[irKey] = Types_1.Room.getRoomValue(room, key);
            }
            else {
                let section = record;
                irRecord[irKey] = Types_1.Section.getSectionValue(section, key);
            }
        }
        return irRecord;
    }
    fitsQuery(filterObj, record) {
        if (record instanceof Types_1.Room) {
            let roomFitter = new RoomQueryFitter_1.RoomQueryFitter();
            return roomFitter.fitsQuery(filterObj, record);
        }
        else {
            let sectionFitter = new SectionQueryFitter_1.SectionQueryFitter();
            return sectionFitter.fitsQuery(filterObj, record);
        }
    }
    static evaluateSComp(fieldString, compString) {
        let wildcardFirst = compString.startsWith("*");
        let wildcardLast = compString.endsWith("*");
        if (wildcardFirst && wildcardLast) {
            compString = compString.substring(1, compString.length - 1);
            return fieldString.includes(compString);
        }
        else if (wildcardFirst) {
            compString = compString.substring(1);
            return fieldString.endsWith(compString);
        }
        else if (wildcardLast) {
            compString = compString.substring(0, compString.length - 1);
            return fieldString.startsWith(compString);
        }
        return fieldString === compString;
    }
    static evaluateMComp(op, a, b) {
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
    static getDatasetKey(queryKey) {
        return queryKey.split("_")[1];
    }
    static getDatasetID(queryKey) {
        return queryKey.split("_")[0];
    }
    static sortResults(resultsArr, order) {
        if (typeof order === "string") {
            return QueryFetcher.sortByOneColumn(resultsArr, order, "UP");
        }
        return QueryFetcher.sortResultsWithOrderObj(resultsArr, order);
    }
    static sortResultsWithOrderObj(resultsArr, orderObj) {
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
    static sortByMultipleColumns(arr, sortKeys, dir) {
        return arr.sort(function (x, y) {
            let key = sortKeys[0];
            let xVal = x[key];
            let yVal = y[key];
            for (let i = 1; i < sortKeys.length; i++) {
                if (xVal === yVal) {
                    key = sortKeys[i];
                    xVal = x[key];
                    yVal = y[key];
                }
                else {
                    break;
                }
            }
            if (xVal < yVal) {
                if (dir === "UP") {
                    return -1;
                }
                else {
                    return 1;
                }
            }
            else {
                if (dir === "UP") {
                    return 1;
                }
                else {
                    return -1;
                }
            }
        });
    }
    static sortByOneColumn(resultsArr, orderKey, dir) {
        return resultsArr.sort(function (x, y) {
            let xVal = x[orderKey];
            let yVal = y[orderKey];
            if (xVal < yVal) {
                if (dir === "UP") {
                    return -1;
                }
                else {
                    return 1;
                }
            }
            else {
                if (dir === "UP") {
                    return 1;
                }
                else {
                    return -1;
                }
            }
        });
    }
}
exports.QueryFetcher = QueryFetcher;
//# sourceMappingURL=QueryFetcher.js.map