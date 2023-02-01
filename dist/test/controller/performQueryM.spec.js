"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const IInsightFacade_1 = require("../../src/controller/IInsightFacade");
const mocha_1 = require("mocha");
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const fs_1 = __importDefault(require("fs"));
const folder_test_1 = require("@ubccpsc310/folder-test");
const TestUtil_1 = require("../TestUtil");
chai_1.default.use(chai_as_promised_1.default);
let insightFacade;
function getFileContent(path) {
    return fs_1.default.readFileSync(path).toString("base64");
}
(0, mocha_1.describe)("performQuery", function () {
    before(async function () {
        (0, TestUtil_1.clearDisk)();
        (0, TestUtil_1.addDisk)();
        insightFacade = new InsightFacade_1.default();
        const courses = getFileContent("test/resources/archives/courses.zip");
        await insightFacade.addDataset("courses", courses, IInsightFacade_1.InsightDatasetKind.Courses);
    });
    after(function () {
        (0, TestUtil_1.clearDisk)();
    });
    (0, folder_test_1.folderTest)("Dynamic tests", (input) => insightFacade.performQuery(input), "test/resources/mqueries", {
        errorValidator: (error) => error === "InsightError" || error === "ResultTooLargeError",
        assertOnResult(expected, actual, input) {
            const orderKey = input.OPTIONS.ORDER;
            (0, chai_1.expect)(actual).to.be.an.instanceof(Array);
            (0, chai_1.expect)(actual).to.have.length(expected.length);
            (0, chai_1.expect)(actual).to.have.deep.members(expected);
            if (orderKey !== undefined) {
                for (let i = 1; i < actual.length; i = i + 1) {
                    let a = actual[i - 1][orderKey];
                    let b = actual[i][orderKey];
                    let res = a <= b;
                    (0, chai_1.expect)(res).to.be.true;
                }
            }
        },
        assertOnError: (expected, actual) => {
            if (expected === "InsightError") {
                (0, chai_1.expect)(actual).to.be.instanceof(IInsightFacade_1.InsightError);
            }
            else if (expected === "ResultTooLargeError") {
                (0, chai_1.expect)(actual).to.be.instanceof(IInsightFacade_1.ResultTooLargeError);
            }
            else {
                chai_1.expect.fail("UNEXPECTED ERROR");
            }
        },
    });
});
//# sourceMappingURL=performQueryM.spec.js.map