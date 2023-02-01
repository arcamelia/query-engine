// import {InsightDatasetKind, InsightError, InsightResult} from "../../src/controller/IInsightFacade";
// import {folderTest} from "@ubccpsc310/folder-test";
// import {expect} from "chai";
// import {DatasetMap} from "../../src/controller/DatasetMap";
// import {Dataset, Section} from "../../src/controller/Types";
// import {QueryFetcher} from "../../src/controller/QueryFetcher";
//
// describe("fits query", () => {
// 	let queryFetcher: QueryFetcher = new QueryFetcher(new DatasetMap());
// 	let section: Section = new Section("310", "cpsc", 90, "elisa",
// 		"software engineering", 100, 10, 0, "123", 2021);
// 	let stringFilter: any = {IS: {courses_dept: "cpsc"}};
// 	let complexFilter =
// 		{
// 			OR: [
// 				{AND: [
// 					{GT: {courses_avg: 80}},
// 					{IS: {courses_dept: "math"}},
// 					{GT: {courses_id: 300}}
// 				]},
// 				{GT: {courses_avg: 90}}
// 			]
// 		};
//
// 	it("should fit query", () => {
// 		let fitsQuery: boolean = queryFetcher.fitsQuery(complexFilter, section);
// 		expect(fitsQuery).to.be.false;
// 	});
// });

// describe("FetchResults", () => {
// 	let queryFetcher: QueryFetcher;
//
// 	before(function () {
// 		let courseSections: Section[] = [
// 			new Section(
// 				"310",
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
// 				2021),
// 			new Section(
// 				"320",
// 				"cpsc",
// 				82,
// 				"Patrice",
// 				"algo analysis",
// 				120,
// 				15,
// 				1,
// 				"22222",
// 				2021),
// 			new Section(
// 				"111",
// 				"math",
// 				95,
// 				"unknown",
// 				"something",
// 				198,
// 				2,
// 				1,
// 				"33334",
// 				2020),
// 			new Section(
// 				"222",
// 				"math",
// 				55,
// 				"unknown","something else",
// 				100,
// 				100,
// 				1,
// 				"33333",
// 				2020),
// 			new Section(
// 				"221",
// 				"cpsc",
// 				92,
// 				"unknown",
// 				"something but cpsc",170,
// 				20,
// 				0,
// 				"99900",
// 				2020)
// 		];
// 		let coursesDataset: Dataset = {
// 			id: "courses",
// 			kind: InsightDatasetKind.Courses,
// 			numRows: 6,
// 			sections: courseSections
// 		};
// 		let datasets = new DatasetMap();
// 		datasets.addDataset(coursesDataset);
// 		queryFetcher = new QueryFetcher(datasets);
// 	});
//
// 	type PQErrorKind = "InsightError";
//
// 	folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
// 		"Dynamic fetch query results tests",
// 		(input) => queryFetcher.fetchResults(input),
// 		"./test/resources/fetchQueryResultsTests",
// 		{
// 			errorValidator: (error): error is PQErrorKind =>
// 				error === "InsightError",
// 			assertOnError(actual, expected) {
// 				expect(actual).to.be.instanceof(InsightError);
// 			},
// 		}
// 	);
// });
