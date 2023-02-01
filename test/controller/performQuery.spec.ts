import {
	InsightDatasetKind,
	InsightError,
	InsightResult,
	ResultTooLargeError
} from "../../src/controller/IInsightFacade";
import {folderTest} from "@ubccpsc310/folder-test";
import {expect} from "chai";
import InsightFacade from "../../src/controller/InsightFacade";
import {addDisk, clearDisk, getContentFromArchives} from "../TestUtil";

/**
 *
 *
 * */

describe("perform query", () => {
	let insightFacade: InsightFacade;

	before(async function () {
		clearDisk();
		addDisk();
		insightFacade = new InsightFacade();
		const coursesContent = getContentFromArchives("courses.zip");
		await insightFacade.addDataset("courses", coursesContent, InsightDatasetKind.Courses);
		// const CRWR = getContentFromArchives("crwr-courses.zip");
		// const CPSC_CRWR = getContentFromArchives("cpsc-crwr-courses.zip");
		// const CRWR_ECON = getContentFromArchives("crwr-econ-courses.zip");
		// const halfCourses = getContentFromArchives("half-courses.zip");
		// await insightFacade.addDataset("courses", halfCourses, InsightDatasetKind.Courses);
	});

	after(function () {
		clearDisk();
	});

	type PQErrorKind = "InsightError" | "ResultTooLargeError";

	folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
		"c1 perform query tests",
		(input) => insightFacade.performQuery(input),
		"./test/resources/queries",
		{
			errorValidator: (error): error is PQErrorKind =>
				error === "ResultTooLargeError" || error === "InsightError",
			assertOnError(actual, expected) {
				if (expected === "ResultTooLargeError") {
					expect(actual).to.be.instanceof(ResultTooLargeError);
				} else {
					expect(actual).to.be.instanceof(InsightError);
				}
			},
		}
	);

	folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
		"c2 perform query tests",
		(input) => insightFacade.performQuery(input),
		"./test/resources/c2-queries",
		{
			errorValidator: (error): error is PQErrorKind =>
				error === "ResultTooLargeError" || error === "InsightError",
			assertOnError(actual, expected) {
				if (expected === "ResultTooLargeError") {
					expect(actual).to.be.instanceof(ResultTooLargeError);
				} else {
					expect(actual).to.be.instanceof(InsightError);
				}
			},
		}
	);
});
