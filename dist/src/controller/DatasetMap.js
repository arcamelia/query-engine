"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetMap = void 0;
class DatasetMap {
    constructor() {
        this.map = new Map();
    }
    addDataset(ds) {
        this.map.set(ds.id, ds);
    }
    removeDataset(id) {
        if (typeof this.map.get(id) !== "undefined") {
            this.map.delete(id);
        }
    }
    getDataset(id) {
        return this.map.get(id);
    }
    getInsightDatasets() {
        let insightDatasetArr = [];
        for (let elt of this.map) {
            let ds = elt[1];
            let insightDataset = { id: ds.id, kind: ds.kind, numRows: ds.numRows };
            insightDatasetArr.push(insightDataset);
        }
        return insightDatasetArr;
    }
}
exports.DatasetMap = DatasetMap;
//# sourceMappingURL=DatasetMap.js.map