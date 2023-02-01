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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddRemoveDatasetHelpers = void 0;
const IInsightFacade_1 = require("./IInsightFacade");
const Types_1 = require("./Types");
const fs = __importStar(require("fs-extra"));
const jszip_1 = __importDefault(require("jszip"));
const parse5_1 = require("parse5");
const HtmlParsingFunctions_1 = require("./HtmlParsingFunctions");
class AddRemoveDatasetHelpers {
    constructor(dsMap) {
        this.datasets = dsMap;
    }
    addDataset(id, content, kind) {
        return this.checkValidId(id, false)
            .then(() => {
            if (kind === IInsightFacade_1.InsightDatasetKind.Courses) {
                return this.createDatasetAndMakeFile(content, id);
            }
            if (kind === IInsightFacade_1.InsightDatasetKind.Rooms) {
                return this.createRoomsAndMakeFile(content, id);
            }
            return Promise.reject(new IInsightFacade_1.InsightError("Invalid dataset kind"));
        });
    }
    checkValidId(id, idExpectedToAlreadyExist) {
        if (id.trim().length === 0) {
            return Promise.reject(new IInsightFacade_1.InsightError("id is empty"));
        }
        if (id && !id.trim()) {
            return Promise.reject(new IInsightFacade_1.InsightError("id is only whitespaces"));
        }
        if (id.indexOf("_") !== -1) {
            return Promise.reject(new IInsightFacade_1.InsightError("id has an underscore"));
        }
        let datasetIds = Array.from(this.datasets.map.keys());
        let datasetExists = datasetIds.includes(id);
        if (!idExpectedToAlreadyExist && datasetExists) {
            return Promise.reject(new IInsightFacade_1.InsightError("id already exists"));
        }
        if (idExpectedToAlreadyExist && !datasetExists) {
            return Promise.reject(new IInsightFacade_1.NotFoundError("id doesn't exist"));
        }
        return Promise.resolve(true);
    }
    async createDatasetAndMakeFile(content, id) {
        let datasetMapIds = [];
        try {
            let tryCreatingDataset = jszip_1.default.loadAsync(content, { base64: true })
                .then(async (zip) => {
                let hasCoursesFolder = zip.folder("courses")?.file(/.*/);
                if (hasCoursesFolder) {
                    let sections = await this.getValidSections(content);
                    if (sections.length > 0) {
                        let thisDataset;
                        thisDataset = {
                            id: id,
                            sections: sections,
                            numRows: sections.length,
                            kind: IInsightFacade_1.InsightDatasetKind.Courses
                        };
                        this.datasets.addDataset(thisDataset);
                        fs.writeJsonSync("./data/" + id + ".json", thisDataset);
                        return jszip_1.default.loadAsync(content, { base64: true })
                            .then(async () => {
                            let datasetIds = Array.from(this.datasets.map.keys());
                            datasetMapIds.push(...datasetIds);
                        });
                    }
                }
            });
            return tryCreatingDataset
                .then(() => {
                if (datasetMapIds.length < 1) {
                    throw new IInsightFacade_1.InsightError("Invalid Course files");
                }
                return datasetMapIds;
            });
        }
        catch (e) {
            return Promise.reject(new IInsightFacade_1.InsightError("Not a Zip file"));
        }
    }
    async getValidSections(content) {
        let zipped = new jszip_1.default();
        let sections = [];
        return zipped.loadAsync(content, { base64: true }).then(function (zip) {
            let listOfFiles = new Array();
            zip.folder("courses").forEach((_, file) => {
                listOfFiles.push(file.async("string"));
            });
            return Promise.all(listOfFiles).then((files) => {
                for (let file of files) {
                    try {
                        let fileJSONParsed = JSON.parse(file);
                        if (fileJSONParsed) {
                            let validSections = Types_1.Section.createSectionsFromFile(fileJSONParsed);
                            if (validSections.length > 0) {
                                sections.push(...validSections);
                            }
                        }
                    }
                    catch (e) {
                    }
                }
                if (sections.length < 1) {
                    return Promise.reject(new IInsightFacade_1.InsightError("No valid sections!"));
                }
                return sections;
            });
        });
    }
    async createRoomsAndMakeFile(content, id) {
        let datasetMapIds = [];
        let tryCreatingDataset = jszip_1.default.loadAsync(content, { base64: true })
            .then(async (zip) => {
            if (await zip.file("rooms/index.htm")?.async("text")) {
                let buildings = await this.parseBuildingsFromJSZip(zip);
                let validRooms = [];
                for await (const building of buildings) {
                    let buildingHtml = building[0];
                    let buildingTag = building[1];
                    let currRooms = await Types_1.Room.getValidRoomsFromBuilding(buildingHtml, buildingTag);
                    validRooms.push(...currRooms);
                }
                if (validRooms.length > 0) {
                    let thisDataset = {
                        id: id,
                        rooms: validRooms,
                        numRows: validRooms.length,
                        kind: IInsightFacade_1.InsightDatasetKind.Rooms
                    };
                    fs.writeJsonSync("./data/" + id + ".json", thisDataset);
                    this.datasets.addDataset(thisDataset);
                    let datasetIds = Array.from(this.datasets.map.keys());
                    datasetMapIds.push(...datasetIds);
                }
            }
            return Promise.resolve();
        });
        return tryCreatingDataset
            .then(() => {
            if (datasetMapIds.length < 1) {
                return Promise.reject(new IInsightFacade_1.InsightError("No Rooms to add"));
            }
            return Promise.resolve(datasetMapIds);
        });
    }
    async parseBuildingsFromJSZip(zip) {
        let buildingFilesAndTag = [];
        let h = new HtmlParsingFunctions_1.HtmlParsingFunctions();
        let indexHtm = await zip.file("rooms/index.htm")?.async("text");
        let indexHtmParsed = (0, parse5_1.parse)(indexHtm || "");
        let tbody = h.findSpecificHtmlNodes("tbody", indexHtmParsed.childNodes)[0];
        for await (const buildingNodes of h.findSpecificHtmlNodes("tr", tbody.childNodes)) {
            try {
                let buildingEntryPath = h.findHref(buildingNodes);
                if (buildingEntryPath) {
                    let buildingFile = await zip.file("rooms" + buildingEntryPath.substr(1))?.async("text");
                    if (buildingFile) {
                        let buildingFileParsed = (0, parse5_1.parse)(buildingFile);
                        buildingFilesAndTag.push([buildingFileParsed, buildingNodes]);
                    }
                }
            }
            catch {
                continue;
            }
        }
        return Promise.resolve(buildingFilesAndTag);
    }
    removeDataset(id) {
        return this.checkValidId(id, true)
            .then(() => {
            this.datasets.removeDataset(id);
            fs.removeSync("./data/" + id + ".json");
            return Promise.resolve(id);
        });
    }
}
exports.AddRemoveDatasetHelpers = AddRemoveDatasetHelpers;
//# sourceMappingURL=AddRemoveDatasetHelpers.js.map