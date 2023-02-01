import {InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import {Dataset, Room, Section} from "./Types";
import {DatasetMap} from "./DatasetMap";
import * as fs from "fs-extra";
import JSZip, {JSZipObject} from "jszip";
import {Element, Document, parse} from "parse5";
import {HtmlParsingFunctions} from "./HtmlParsingFunctions";

export class AddRemoveDatasetHelpers {
	private datasets: DatasetMap;

	constructor(dsMap: DatasetMap) {
		this.datasets = dsMap;
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// check that the Id is valid
		return this.checkValidId(id, false)
			.then(()=> {
				if (kind === InsightDatasetKind.Courses) {
					return this.createDatasetAndMakeFile(content, id);
				}

				if (kind === InsightDatasetKind.Rooms) {
					// throw new InsightError("Dataset kind is rooms");
					return this.createRoomsAndMakeFile(content, id);
				}

				return Promise.reject(new InsightError("Invalid dataset kind"));
			});
	}

	private checkValidId(id: string, idExpectedToAlreadyExist: boolean): Promise<any> {
		if (id.trim().length === 0) {
			return Promise.reject(new InsightError("id is empty"));
		}
		if (id && !id.trim()) {
			return Promise.reject(new InsightError("id is only whitespaces"));
		}
		if (id.indexOf("_") !== -1) {
			return Promise.reject(new InsightError("id has an underscore"));
		}

		let datasetIds = Array.from(this.datasets.map.keys());
		let datasetExists = datasetIds.includes(id);

		// if id should not already exist, throw error if it does
		if (!idExpectedToAlreadyExist && datasetExists) {
			return Promise.reject(new InsightError("id already exists"));
		}
		// if id should exist, throw error if it doesn't
		if (idExpectedToAlreadyExist && !datasetExists) {
			return Promise.reject(new NotFoundError("id doesn't exist"));
		}

		return Promise.resolve(true);
	}

	private async createDatasetAndMakeFile(content: string, id: string): Promise<string[]> {
		let datasetMapIds: string[] = [];
		try {
			let tryCreatingDataset = JSZip.loadAsync(content, {base64: true})
				.then(async (zip) => {
					let hasCoursesFolder = zip.folder("courses")?.file(/.*/);
					if (hasCoursesFolder) {
						let sections: Section[] = await this.getValidSections(content);
						if (sections.length > 0) {
							// create dataset
							let thisDataset: Dataset;
							thisDataset = {
								id: id,
								sections: sections,
								numRows: sections.length,
								kind: InsightDatasetKind.Courses
							};

							// add to database map
							this.datasets.addDataset(thisDataset);

							// create file and add to data folder
							fs.writeJsonSync("./data/" + id + ".json", thisDataset);

							return JSZip.loadAsync(content, {base64: true})
								.then(async () => {
									// add all Id's in dataset to array we want to return
									let datasetIds = Array.from(this.datasets.map.keys());
									datasetMapIds.push(...datasetIds);
								});
						}
					}
				});

			return tryCreatingDataset
				.then(() => {
					if (datasetMapIds.length < 1) {
						throw new InsightError("Invalid Course files");
					}
					return datasetMapIds;
				});
		} catch (e) {
			return Promise.reject(new InsightError("Not a Zip file"));
		}
	}

	private async getValidSections(content: string): Promise<Section[]> {
		let zipped = new JSZip();
		let sections: Section[] = [];
		return zipped.loadAsync(content, {base64: true}).then(function (zip: any) {
			let listOfFiles: Array<Promise<string>> = new Array<Promise<string>>();
			zip.folder("courses").forEach((_: string, file: JSZipObject) => {
				listOfFiles.push(file.async("string"));
			});
			return Promise.all(listOfFiles).then((files) => {
				for (let file of files) {
					try {
						let fileJSONParsed = JSON.parse(file);
						if (fileJSONParsed) {
							let validSections: Section[] = Section.createSectionsFromFile(fileJSONParsed);
							if (validSections.length > 0) {
								sections.push(...validSections);
							}
						}
					} catch (e) {
						// catch any exceptions thrown locally
					}
				}
				if (sections.length < 1) {
					return Promise.reject(new InsightError("No valid sections!"));
				}

				return sections;
			});
		});
	}

	private async createRoomsAndMakeFile(content: string, id: string): Promise<string[]> {
		let datasetMapIds: string[] = [];

		let tryCreatingDataset = JSZip.loadAsync(content, {base64: true})
			.then(async (zip) => {
				if (await zip.file("rooms/index.htm")?.async("text")) {
					let buildings = await this.parseBuildingsFromJSZip(zip);

					// get all valid rooms
					let validRooms: Room[] = [];

					// let getValidRooms = buildings.then((async) => {
					for await (const building of buildings) {
						let buildingHtml = building[0];
						let buildingTag = building[1];
						let currRooms = await Room.getValidRoomsFromBuilding(buildingHtml, buildingTag);
						validRooms.push(...currRooms);
					}

					if (validRooms.length > 0) {
						let thisDataset: Dataset = {
							id: id,
							rooms: validRooms,
							numRows: validRooms.length,
							kind: InsightDatasetKind.Rooms};

						// create file and add to data folder
						fs.writeJsonSync("./data/" + id + ".json", thisDataset);

						this.datasets.addDataset(thisDataset);

						// add all Id's in dataset to array we want to return
						let datasetIds = Array.from(this.datasets.map.keys());
						datasetMapIds.push(...datasetIds);
					}
				}
				return Promise.resolve();
			});

		return tryCreatingDataset
			.then(()=> {
				if (datasetMapIds.length < 1) {
					return Promise.reject(new InsightError("No Rooms to add"));
				}
				return Promise.resolve(datasetMapIds);
			});
	}

	private async parseBuildingsFromJSZip(zip: any): Promise<Array<[Document, Element]>> {
		// let buildingFiles: Document[] = [];
		let buildingFilesAndTag: Array<[Document, Element]> = [];
		let h: HtmlParsingFunctions = new HtmlParsingFunctions();

		let indexHtm = await zip.file("rooms/index.htm")?.async("text");
		let indexHtmParsed = parse(indexHtm || "");

		let tbody = h.findSpecificHtmlNodes("tbody", indexHtmParsed.childNodes)[0];

		// every tr tag in tbody is a building
		for await (const buildingNodes of h.findSpecificHtmlNodes("tr", (tbody as Element).childNodes)) {
			try {
				let buildingEntryPath = h.findHref(buildingNodes as Element);

				if (buildingEntryPath) {
					// read file with building, parse it, and add it to our return array of buildings
					let buildingFile = await zip.file("rooms" + buildingEntryPath.substr(1))?.async("text");
					// buildingFile.then(() => {
					if (buildingFile) {
						let buildingFileParsed = parse(buildingFile);
						buildingFilesAndTag.push([buildingFileParsed, buildingNodes as Element]);
					}
				}
			} catch {
				continue;
			}
		}
		return Promise.resolve(buildingFilesAndTag);
	}

	public removeDataset(id: string): Promise<string> {
		return this.checkValidId(id, true)
			.then(()=> {
				// removes dataset from our map
				this.datasets.removeDataset(id);
				fs.removeSync("./data/" + id + ".json");
				return Promise.resolve(id);
			});
	}
}
