import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightResult
} from "./IInsightFacade";
import * as fs from "fs-extra";
import {QueryValidator} from "./QueryValidator";
import {DatasetMap} from "./DatasetMap";
import {QueryFetcher} from "./QueryFetcher";
import {Dataset, Section, Room} from "./Types";
import {AddRemoveDatasetHelpers} from "./AddRemoveDatasetHelpers";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private datasets: DatasetMap;

	constructor() {
		console.log("InsightFacadeImpl::init()");

		// create new map
		this.datasets = new DatasetMap();

		const dsFiles = fs.readdirSync("./data");
		for (let fileName of dsFiles) {
			let rawData = fs.readFileSync("./data/" + fileName);
			let parsedFile = JSON.parse(rawData.toString());

			// file is Sections
			if (parsedFile.sections != null) {
				// create each section from file
				let sections: Section[] = [];
				for (let JSONSection of parsedFile.sections) {
					let section = Section.getSectionFromJSON(JSONSection);
					sections.push(section);
				}

				let ds: Dataset = {
					id: parsedFile.id,
					sections: sections,
					kind: InsightDatasetKind.Courses,
					numRows: sections.length
				};
				this.datasets.map.set(fileName, ds);
			}

			// file is Rooms
			if (parsedFile.rooms != null) {
				// create each room from file
				let rooms: Room[] = [];
				for (let JSONRoom of parsedFile.rooms) {
					let room = Room.getRoomFromJSON(JSONRoom);
					rooms.push(room);
				}

				let ds: Dataset = {
					id: parsedFile.id,
					rooms: rooms,
					kind: InsightDatasetKind.Courses,
					numRows: rooms.length
				};
				this.datasets.map.set(fileName, ds);
			}
		}
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		let addDatasetHelpers: AddRemoveDatasetHelpers;
		addDatasetHelpers = new AddRemoveDatasetHelpers(this.datasets);
		return addDatasetHelpers.addDataset(id, content,kind);
	}

	public removeDataset(id: string): Promise<string> {
		let removeDatasetHelpers: AddRemoveDatasetHelpers;
		removeDatasetHelpers = new AddRemoveDatasetHelpers(this.datasets);
		return removeDatasetHelpers.removeDataset(id);
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		let queryValidator = new QueryValidator();
		let queryFetcher = new QueryFetcher(this.datasets);
		return queryValidator.validateQuery(query)
			.then(() => queryFetcher.fetchResults(query))
			.catch((error: Error) => Promise.reject(error));
	}

	public listDatasets(): Promise<InsightDataset[]> {
		let currentDatasets: InsightDataset[] = this.datasets.getInsightDatasets();
		return Promise.resolve(currentDatasets);
	}
}
