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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const IInsightFacade_1 = require("../controller/IInsightFacade");
const InsightFacade_1 = __importDefault(require("../controller/InsightFacade"));
const fs = __importStar(require("fs-extra"));
class Server {
    constructor(port) {
        console.info(`Server::<init>( ${port} )`);
        this.port = port;
        this.express = (0, express_1.default)();
        this.registerMiddleware();
        this.registerRoutes();
        this.insightFacade = new InsightFacade_1.default();
        if (!fs.existsSync("./data")) {
            fs.mkdirSync("./data");
        }
        this.express.use(express_1.default.static("./frontend/public"));
    }
    start() {
        return new Promise((resolve, reject) => {
            console.info("Server::start() - start");
            if (this.server !== undefined) {
                console.error("Server::start() - server already listening");
                reject();
            }
            else {
                this.server = this.express.listen(this.port, () => {
                    console.info(`Server::start() - server listening on port: ${this.port}`);
                    resolve();
                }).on("error", (err) => {
                    console.error(`Server::start() - server ERROR: ${err.message}`);
                    reject(err);
                });
            }
        });
    }
    stop() {
        console.info("Server::stop()");
        return new Promise((resolve, reject) => {
            if (this.server === undefined) {
                console.error("Server::stop() - ERROR: server not started");
                reject();
            }
            else {
                this.server.close(() => {
                    console.info("Server::stop() - server closed");
                    resolve();
                });
            }
        });
    }
    registerMiddleware() {
        this.express.use(express_1.default.json());
        this.express.use(express_1.default.raw({ type: "application/*", limit: "10mb" }));
        this.express.use((0, cors_1.default)());
    }
    registerRoutes() {
        this.express.get("/echo/:msg", Server.echo);
        console.log("registering routes");
        this.express.put("/dataset/:id/:kind", this.putHandler.bind(this));
        this.express.delete("/dataset/:id", this.deleteHandler.bind(this));
        this.express.post("/query", this.postHandler.bind(this));
        this.express.get("/datasets", this.getHandler.bind(this));
    }
    async putHandler(req, res) {
        try {
            if (req.params.kind !== "courses" && req.params.kind !== "rooms") {
                res.status(400).json({ error: "Dataset kind is not courses or rooms" });
            }
            let kind = req.params.kind === "rooms" ? IInsightFacade_1.InsightDatasetKind.Rooms : IInsightFacade_1.InsightDatasetKind.Courses;
            let content = Buffer.from(req.body).toString("base64");
            let response = await this.insightFacade.addDataset(req.params.id, content, kind);
            res.status(200).json({ result: response });
        }
        catch (err) {
            let error = err;
            res.status(400).json({ error: error.message });
        }
    }
    async deleteHandler(req, res) {
        try {
            let response = await this.insightFacade.removeDataset(req.params.id);
            res.status(200).json({ result: response });
        }
        catch (err) {
            let error = err;
            let statusCode = err instanceof IInsightFacade_1.NotFoundError ? 404 : 400;
            res.status(statusCode).json({ error: error.message });
        }
    }
    async postHandler(req, res) {
        console.log("inside post handler");
        try {
            const response = await this.insightFacade.performQuery(req.body);
            res.status(200).json({ result: response });
        }
        catch (err) {
            let error = err;
            console.log(error.message);
            res.status(400).json({ error: error.message });
        }
    }
    async getHandler(req, res) {
        try {
            const response = await this.insightFacade.listDatasets();
            res.status(200).json({ result: response });
        }
        catch (err) {
            let error = err;
            res.status(400).json({ error: error.message });
        }
    }
    static echo(req, res) {
        try {
            console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
            const response = Server.performEcho(req.params.msg);
            res.status(200).json({ result: response });
        }
        catch (err) {
            res.status(400).json({ error: err });
        }
    }
    static performEcho(msg) {
        if (typeof msg !== "undefined" && msg !== null) {
            return `${msg}...${msg}`;
        }
        else {
            return "Message not provided";
        }
    }
}
exports.default = Server;
//# sourceMappingURL=Server.js.map