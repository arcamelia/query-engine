import {Dataset, Section} from "./Types";
import {InsightDataset} from "./IInsightFacade";

export class DatasetMap {
	public map: Map<string, Dataset>;

	constructor() {
		this.map = new Map<string, Dataset>();
	}

	public addDataset(ds: Dataset) {
		this.map.set(ds.id, ds);
	}

	public removeDataset(id: string) {
		if (typeof this.map.get(id) !== "undefined") {
			this.map.delete(id);
		}
	}

	// returns IDataset if it exists in the map, otherwise returns undefined
	public getDataset(id: string): Dataset | undefined {
		return this.map.get(id);
	}

	public getInsightDatasets(): InsightDataset[] {
		let insightDatasetArr: InsightDataset[] = [];
		for (let elt of this.map) {
			let ds = elt[1];
			let insightDataset = {id: ds.id, kind: ds.kind, numRows: ds.numRows};
			insightDatasetArr.push(insightDataset);
		}
		return insightDatasetArr;
	}
}
