"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("./IInsightFacade");
const fs = __importStar(require("fs-extra"));
const QueryValidator_1 = require("./QueryValidator");
const DatasetMap_1 = require("./DatasetMap");
const QueryFetcher_1 = require("./QueryFetcher");
const Types_1 = require("./Types");
const AddRemoveDatasetHelpers_1 = require("./AddRemoveDatasetHelpers");
class InsightFacade {
    constructor() {
        console.log("InsightFacadeImpl::init()");
        this.datasets = new DatasetMap_1.DatasetMap();
        const dsFiles = fs.readdirSync("./data");
        for (let fileName of dsFiles) {
            let rawData = fs.readFileSync("./data/" + fileName);
            let parsedFile = JSON.parse(rawData.toString());
            if (parsedFile.sections != null) {
                let sections = [];
                for (let JSONSection of parsedFile.sections) {
                    let section = Types_1.Section.getSectionFromJSON(JSONSection);
                    sections.push(section);
                }
                let ds = {
                    id: parsedFile.id,
                    sections: sections,
                    kind: IInsightFacade_1.InsightDatasetKind.Courses,
                    numRows: sections.length
                };
                this.datasets.map.set(fileName, ds);
            }
            if (parsedFile.rooms != null) {
                let rooms = [];
                for (let JSONRoom of parsedFile.rooms) {
                    let room = Types_1.Room.getRoomFromJSON(JSONRoom);
                    rooms.push(room);
                }
                let ds = {
                    id: parsedFile.id,
                    rooms: rooms,
                    kind: IInsightFacade_1.InsightDatasetKind.Courses,
                    numRows: rooms.length
                };
                this.datasets.map.set(fileName, ds);
            }
        }
    }
    addDataset(id, content, kind) {
        let addDatasetHelpers;
        addDatasetHelpers = new AddRemoveDatasetHelpers_1.AddRemoveDatasetHelpers(this.datasets);
        return addDatasetHelpers.addDataset(id, content, kind);
    }
    removeDataset(id) {
        let removeDatasetHelpers;
        removeDatasetHelpers = new AddRemoveDatasetHelpers_1.AddRemoveDatasetHelpers(this.datasets);
        return removeDatasetHelpers.removeDataset(id);
    }
    performQuery(query) {
        let queryValidator = new QueryValidator_1.QueryValidator();
        let queryFetcher = new QueryFetcher_1.QueryFetcher(this.datasets);
        return queryValidator.validateQuery(query)
            .then(() => queryFetcher.fetchResults(query))
            .catch((error) => Promise.reject(error));
    }
    listDatasets() {
        let currentDatasets = this.datasets.getInsightDatasets();
        return Promise.resolve(currentDatasets);
    }
}
exports.default = InsightFacade;
//# sourceMappingURL=InsightFacade.js.map