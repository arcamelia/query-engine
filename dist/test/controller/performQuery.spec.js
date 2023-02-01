"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const folder_test_1 = require("@ubccpsc310/folder-test");
const chai_1 = require("chai");
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const TestUtil_1 = require("../TestUtil");
describe("perform query", () => {
    let insightFacade;
    before(async function () {
        (0, TestUtil_1.clearDisk)();
        (0, TestUtil_1.addDisk)();
        insightFacade = new InsightFacade_1.default();
        const coursesContent = (0, TestUtil_1.getContentFromArchives)("courses.zip");
        await insightFacade.addDataset("courses", coursesContent, IInsightFacade_1.InsightDatasetKind.Courses);
    });
    after(function () {
        (0, TestUtil_1.clearDisk)();
    });
    (0, folder_test_1.folderTest)("c1 perform query tests", (input) => insightFacade.performQuery(input), "./test/resources/queries", {
        errorValidator: (error) => error === "ResultTooLargeError" || error === "InsightError",
        assertOnError(actual, expected) {
            if (expected === "ResultTooLargeError") {
                (0, chai_1.expect)(actual).to.be.instanceof(IInsightFacade_1.ResultTooLargeError);
            }
            else {
                (0, chai_1.expect)(actual).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        },
    });
    (0, folder_test_1.folderTest)("c2 perform query tests", (input) => insightFacade.performQuery(input), "./test/resources/c2-queries", {
        errorValidator: (error) => error === "ResultTooLargeError" || error === "InsightError",
        assertOnError(actual, expected) {
            if (expected === "ResultTooLargeError") {
                (0, chai_1.expect)(actual).to.be.instanceof(IInsightFacade_1.ResultTooLargeError);
            }
            else {
                (0, chai_1.expect)(actual).to.be.instanceof(IInsightFacade_1.InsightError);
            }
        },
    });
});
//# sourceMappingURL=performQuery.spec.js.map