"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = __importDefault(require("../../src/rest/Server"));
const InsightFacade_1 = __importDefault(require("../../src/controller/InsightFacade"));
const chai_1 = require("chai");
const chai_http_1 = __importDefault(require("chai-http"));
const TestUtil_1 = require("../TestUtil");
describe("Facade D3", function () {
    let facade;
    let server;
    const coursesContent = (0, TestUtil_1.getContentFromArchives)("courses.zip");
    (0, chai_1.use)(chai_http_1.default);
    before(function () {
        facade = new InsightFacade_1.default();
        server = new Server_1.default(4321);
        return server.start()
            .then(() => {
            console.log("Server started successfully");
        }).catch(() => {
            console.log("Server failed to start");
        });
    });
    after(function () {
        return server.stop()
            .then(() => {
            console.log("Server stopped successfully");
        }).catch(() => {
            console.log("Server failed to stop");
        });
    });
    beforeEach(function () {
    });
    afterEach(function () {
    });
    it("PUT test for courses dataset", async function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .send(coursesContent)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res) {
                (0, chai_1.expect)(res.status).to.be.equal(200);
            })
                .catch(function (err) {
                chai_1.expect.fail();
            });
        }
        catch (err) {
            chai_1.expect.fail();
        }
    });
});
//# sourceMappingURL=Server.spec.js.map