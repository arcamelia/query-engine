"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryValidator = void 0;
const IInsightFacade_1 = require("./IInsightFacade");
class QueryValidator {
    constructor() {
        console.log("Verifying query...");
    }
    validateQuery(query) {
        if (!this.isValidJSON(query)) {
            return Promise.reject(new IInsightFacade_1.InsightError("query is not a valid JSON object"));
        }
        let jQuery = JSON.parse(JSON.stringify(query));
        let syntaxCheck = this.checkQuerySyntax(jQuery);
        if (syntaxCheck !== "valid") {
            return Promise.reject(new IInsightFacade_1.InsightError(syntaxCheck));
        }
        let semanticsCheck = this.checkQuerySemantics(jQuery);
        if (semanticsCheck !== "valid") {
            return Promise.reject(new IInsightFacade_1.InsightError(semanticsCheck));
        }
        return Promise.resolve([]);
    }
    isValidJSON(obj) {
        let stringObj = typeof obj !== "string" ? JSON.stringify(obj) : obj;
        let jsonObj;
        try {
            jsonObj = JSON.parse(stringObj);
        }
        catch (e) {
            return false;
        }
        return jsonObj && typeof jsonObj === "object";
    }
    checkQuerySyntax(query) {
        let bodyMsg = this.checkBodyEBNF(query);
        if (bodyMsg === "valid") {
            return this.checkOptionsEBNF(query);
        }
        return bodyMsg;
    }
    checkBodyEBNF(query) {
        let body = query["WHERE"];
        if (typeof body === "undefined") {
            return "WHERE clause doesn't exist";
        }
        if (body === {}) {
            return "valid";
        }
        return this.checkFilterEBNF(body);
    }
    checkFilterEBNF(filter) {
        let type = this.filterType(filter);
        if (type === -1) {
            return "Query body contains an invalid filter";
        }
        if (type <= 1) {
            if (type === 0) {
                return this.checkMCompFilter(filter);
            }
            else {
                return this.checkSCompFilter(filter);
            }
        }
        else {
            if (type === 3) {
                return this.checkFilterEBNF(filter["NOT"]);
            }
            return this.checkLogicCompFilter(filter);
        }
    }
    checkLogicCompFilter(filterObj) {
        let key = this.getFirstKey(filterObj);
        let filterArr = filterObj[key];
        if (!Array.isArray(filterArr)) {
            return "LOGIC COMPARISON filter value is not an array";
        }
        for (let filter in filterArr) {
            let msg = this.checkFilterEBNF(filter);
            if (msg !== "valid") {
                return msg;
            }
        }
        return "valid";
    }
    checkSCompFilter(filter) {
        let sCompObj = filter["IS"];
        let sKey = this.getFirstKey(sCompObj);
        if (sKey !== "invalid") {
            let compString = sCompObj[sKey];
            if (typeof compString !== "string") {
                return "Input for SCOMPARISON filter is not a string";
            }
            if (this.wrongAsterisk(compString)) {
                return "SCOMPARISON string contains more than one asterisk back to back";
            }
        }
        return "not implemented";
    }
    getFirstKey(obj) {
        let keys = Object.keys(obj);
        return keys[0];
    }
    wrongAsterisk(s) {
        let stringArr = Array.from(s);
        let wrongAsterisk = false;
        for (let i = 0; i < stringArr.length; i++) {
            if (i !== 0 && i !== stringArr.length - 1) {
                if (stringArr[i] === "*") {
                    wrongAsterisk = true;
                    break;
                }
            }
        }
        return wrongAsterisk;
    }
    checkMCompFilter(filter) {
        let mCompType = this.mCompType(filter);
        if (mCompType !== "-1") {
            let mCompObj = filter[mCompType];
            let mKey = this.getFirstKey(mCompObj);
            if (mKey !== "invalid") {
                if (typeof mCompObj[mKey] === "number") {
                    return "valid";
                }
                return "MCOMPARISON not comparing mkey to a number";
            }
            return "Invalid mkey";
        }
        return "Invalid MCOMPARATOR";
    }
    mCompType(filter) {
        if (typeof filter["EQ"] !== "undefined") {
            return "EQ";
        }
        if (typeof filter["LT"] !== "undefined") {
            return "LT";
        }
        if (typeof filter["GT"] !== "undefined") {
            return "GT";
        }
        return "-1";
    }
    filterType(filterObj) {
        let key = this.getFirstKey(filterObj);
        if (key === "LT" || key === "GT" || key === "EQ") {
            return 0;
        }
        if (key === "IS") {
            return 1;
        }
        if (key === "AND" || key === "OR") {
            return 2;
        }
        if (key === "NOT") {
            return 3;
        }
        return -1;
    }
    checkOptionsEBNF(query) {
        let options = query["OPTIONS"];
        if (typeof options === "undefined") {
            return "OPTIONS clause doesn't exist";
        }
        let columns = options["COLUMNS"];
        if (typeof columns === "undefined") {
            return "COLUMNS clause doesn't exist";
        }
        if (!Array.isArray(columns)) {
            return "COLUMNS is not an array";
        }
        if (columns.length < 1) {
            return "COLUMNS is an empty array";
        }
        columns.forEach(function (col) {
            if (typeof col !== "string") {
                return "COLUMNS is not an array of strings";
            }
        });
        let order = options["ORDER"];
        if (typeof order !== "undefined" && typeof order !== "string") {
            return "ORDER key is not a string";
        }
        return "valid";
    }
    checkQuerySemantics(query) {
        let options = query["OPTIONS"];
        let orderKey = options["ORDER"];
        let columnsArr = query["COLUMNS"];
        if (columnsArr.indexOf(orderKey) === -1) {
            return "ORDER key is not in COLUMNS array";
        }
        let queryKey = columnsArr[0];
        let numUnderscores = queryKey.replace(/[^_]/g, "").length;
        if (numUnderscores > 1) {
            return "Query key contains more than one underscore";
        }
        if (numUnderscores === 0) {
            return "Query key doesn't contain an underscore";
        }
        let dsID = queryKey.split("_")[0];
        columnsArr.forEach(function (col) {
            if (col.split("_")[0] !== dsID) {
                return "Column dataset IDs do not match";
            }
        });
        return "valid";
    }
}
exports.QueryValidator = QueryValidator;
//# sourceMappingURL=QueryVerifier.js.map