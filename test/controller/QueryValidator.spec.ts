// import {InsightError, InsightResult} from "../../src/controller/IInsightFacade";
// import {folderTest} from "@ubccpsc310/folder-test";
// import {expect} from "chai";
// import {QueryValidator} from "../../src/controller/QueryValidator";
// import {Section} from "../../src/controller/Types";
//
// describe("ValidateQuery", () => {
// 	let queryValidator: QueryValidator = new QueryValidator();
//
// 	type PQErrorKind = "InsightError";
//
// 	folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
// 		"Dynamic validate query tests",
// 		(input) => queryValidator.validateQuery(input),
// 		"./test/resources/validateQueryTests",
// 		{
// 			errorValidator: (error): error is PQErrorKind =>
// 				error === "InsightError",
// 			assertOnError(actual, expected) {
// 				expect(actual).to.be.instanceof(InsightError);
// 			},
// 		}
// 	);
// });
