import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError, InsightResult,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import {describe} from "mocha";
import InsightFacade from "../../src/controller/InsightFacade";
import fs from "fs";
import {folderTest} from "@ubccpsc310/folder-test";
import {addDisk, clearDisk} from "../TestUtil";


chai.use(chaiAsPromised);

let insightFacade: IInsightFacade;

/**
 * Wipes all state of InsightFacade
 * Meant to be used between tests
 */

function getFileContent(path: string): string {
	return fs.readFileSync(path).toString("base64");
}

type Error = "InsightError" | "ResultTooLargeError";

describe("performQuery", function () {
	before(async function () {
		clearDisk();
		addDisk();
		insightFacade = new InsightFacade();
		const courses = getFileContent("test/resources/archives/courses.zip");
		await insightFacade.addDataset("courses", courses, InsightDatasetKind.Courses);
	});

	after(function () {
		clearDisk();
	});

	folderTest<unknown, Promise<InsightResult[]>, Error>(
		"Dynamic tests",
		(input) => insightFacade.performQuery(input),
		"test/resources/mqueries",
		{
			errorValidator: (error): error is Error =>
				error === "InsightError" || error === "ResultTooLargeError",
			assertOnResult(expected, actual: any, input: any) {
				const orderKey = input.OPTIONS.ORDER;
				expect(actual).to.be.an.instanceof(Array);
				expect(actual).to.have.length(expected.length);
				expect(actual).to.have.deep.members(expected);
				if (orderKey !== undefined) {
					// check the order of actual array
					for (let i = 1; i < actual.length; i = i + 1) {
						let a = actual[i - 1][orderKey];
						let b = actual[i][orderKey];
						let res = a <= b;
						expect(res).to.be.true;
					}
				}
			},
			assertOnError: (expected, actual) => {
				if (expected === "InsightError") {
					expect(actual).to.be.instanceof(InsightError);
				} else if (expected === "ResultTooLargeError") {
					expect(actual).to.be.instanceof(ResultTooLargeError);
				} else {
					expect.fail("UNEXPECTED ERROR");
				}
			},
		}
	);

	// folderTest<unknown, Promise<InsightResult[]>, Error> (
	// 	"Dynamic tests for C2 query aggregation",
	// 	(input) =>  insightFacade.performQuery(input),
	// 	"test/resources/mqueries/m-c2-performquery",
	//
	// 	{
	// 		errorValidator: (error): error is Error =>
	// 			error === "InsightError" || error === "ResultTooLargeError",
	// 		assertOnResult(expected, actual: any, input: any) {
	// 			const orderKey = input.OPTIONS.ORDER;
	// 			expect(actual).to.be.an.instanceof(Array);
	// 			expect(actual).to.have.length(expected.length);
	// 			expect(actual).to.have.deep.members(expected);
	// 			if (orderKey !== undefined) {
	// 				if ("keys" in orderKey) {
	// 					let orderKeyList = orderKey["keys"];
	// 					let dir = orderKey["dir"];
	// 					for (let i = 1; i < actual.length; i = i + 1) {
	// 						let index: number = 1;
	// 						let a = actual[i - 1][orderKeyList[0]];
	// 						let b = actual[i][orderKeyList[0]];
	// 						let res: boolean;
	// 						if (dir === "UP") {
	// 							if (a === b) {
	// 								while (a === b && index < orderKeyList.length) {
	// 									a = actual[i - 1][orderKeyList[index]];
	// 									b = actual[i - 1][orderKeyList[index]];
	// 									index = index + 1;
	// 								}
	// 							}
	// 							res = a <= b;
	// 						} else {
	// 							if (a === b) {
	// 								while (a === b && index < orderKeyList.length) {
	// 									a = actual[i - 1][orderKeyList[index]];
	// 									b = actual[i - 1][orderKeyList[index]];
	// 									index = index + 1;
	// 								}
	// 							}
	// 							res = a >= b;
	// 						}
	// 						expect(res).to.be.true;
	// 					}
	// 				} else {
	// 					for (let i = 1; i < actual.length; i = i + 1) {
	// 						let a = actual[i - 1][orderKey];
	// 						let b = actual[i][orderKey];
	// 						let res = a <= b;
	// 						expect(res).to.be.true;
	// 					}
	// 				}
	// 			}
	// 		},
	// 		assertOnError: (expected, actual) => {
	// 			if (expected === "InsightError") {
	// 				expect(actual).to.be.instanceof(InsightError);
	// 			} else if (expected === "ResultTooLargeError") {
	// 				expect(actual).to.be.instanceof(ResultTooLargeError);
	// 			} else {
	// 				expect.fail("UNEXPECTED ERROR");
	// 			}
	// 		},
	// 	}
	// );
});
