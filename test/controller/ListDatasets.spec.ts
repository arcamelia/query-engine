// import {expect} from "chai";
// import InsightFacade from "../../src/controller/InsightFacade";
// import {Dataset, Section} from "../../src/controller/Types";
// import {InsightDataset, InsightDatasetKind} from "../../src/controller/IInsightFacade";
// import {DatasetMap} from "../../src/controller/DatasetMap";
//
// describe("ListDatasets", () => {
// 	let courseSections: Section[];
// 	let coursesDataset: Dataset;
// 	let coursesDataset2: Dataset;
// 	let coursesDataset3: Dataset;
// 	let datasets: DatasetMap;
//
// 	before(function () {
// 		courseSections = [
// 			new Section( "310",
// 				"cpsc",
// 				85,
// 				"Elisa",
// 				"intro to software eng",
// 				150,
// 				10,
// 				0,
// 				"12345",
// 				2021),
// 			new Section(
// 				"304",
// 				"cpsc",
// 				75,
// 				"Raymond",
// 				"intro to relational databases",
// 				150,
// 				10,
// 				0,
// 				"26265",
// 				2021)
// 		];
// 		coursesDataset = {
// 			id: "courses",
// 			kind: InsightDatasetKind.Courses,
// 			numRows: 2,
// 			sections: courseSections
// 		};
// 		coursesDataset2 = {
// 			id: "courses2",
// 			kind: InsightDatasetKind.Courses,
// 			numRows: 2,
// 			sections: courseSections
// 		};
// 		coursesDataset3 = {
// 			id: "courses3",
// 			kind: InsightDatasetKind.Courses,
// 			numRows: 2,
// 			sections: courseSections
// 		};
// 		datasets = new DatasetMap();
// 	});
//
// 	it("should list no datasets", function () {
// 		let currDatasets: InsightDataset[] = datasets.getInsightDatasets();
// 		expect(currDatasets).to.deep.equal([]);
// 	});
//
// 	it("should list one dataset", function () {
// 		datasets.addDataset(coursesDataset);
// 		let currDatasets: InsightDataset[] = datasets.getInsightDatasets();
// 		expect(currDatasets).to.deep.equal([
// 			{
// 				id: "courses",
// 				kind: InsightDatasetKind.Courses,
// 				numRows: 2
// 			}
// 		]);
// 	});
//
// 	it("should list multiple datasets", function () {
// 		datasets.addDataset(coursesDataset);
// 		datasets.addDataset(coursesDataset2);
// 		datasets.addDataset(coursesDataset3);
// 		let currDatasets: InsightDataset[] = datasets.getInsightDatasets();
// 		expect(currDatasets).to.deep.equal([
// 			{
// 				id: "courses",
// 				kind: InsightDatasetKind.Courses,
// 				numRows: 2
// 			},
// 			{
// 				id: "courses2",
// 				kind: InsightDatasetKind.Courses,
// 				numRows: 2
// 			},
// 			{
// 				id: "courses3",
// 				kind: InsightDatasetKind.Courses,
// 				numRows: 2
// 			}
// 		]);
// 	});
// });
