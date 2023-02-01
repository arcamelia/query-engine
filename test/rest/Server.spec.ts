import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import {expect, use} from "chai";
import chaiHttp from "chai-http";
import * as fs from "fs-extra";
import {getContentFromArchives} from "../TestUtil";

describe("Facade D3", function () {

	let facade: InsightFacade;
	let server: Server;
	const coursesContent = getContentFromArchives("courses.zip");

	use(chaiHttp);

	before(function () {
		facade = new InsightFacade();
		server = new Server(4321);
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
		// might want to add some process logging here to keep track of what's going on
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what"s going on
	});

	// Sample on how to format PUT requests
	/*
	it("PUT test for courses dataset", function () {
		try {
			return chai.request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
		}
	});
	*/

	it("PUT test for courses dataset",  async function () {
		try {
			return  chai.request("http://localhost:4321")
				.put("/dataset/courses/courses")
				.send(coursesContent)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					expect.fail();
				});
		} catch (err) {
			expect.fail();
		}
	});

	// The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
