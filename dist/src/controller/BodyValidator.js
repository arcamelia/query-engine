"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyValidator = void 0;
const QueryValidator_1 = require("./QueryValidator");
const Types_1 = require("./Types");
const KeyValidator_1 = require("./KeyValidator");
class BodyValidator {
    constructor(keyValidator) {
        this.keyValidator = keyValidator;
    }
    checkBodyEBNF(query) {
        let body = query.WHERE;
        if (typeof body === "undefined") {
            return "WHERE clause doesn't exist";
        }
        if (JSON.stringify(body) === JSON.stringify({})) {
            return QueryValidator_1.QueryValidator.validStr;
        }
        return this.checkFilterEBNF(body);
    }
    checkFilterEBNF(filter) {
        let type = Types_1.FilterHelper.filterType(filter);
        if (type === Types_1.Filter.Invalid) {
            return "Query body contains an invalid filter";
        }
        if (type === Types_1.Filter.MComp) {
            return this.checkMCompFilter(filter);
        }
        else if (type === Types_1.Filter.SComp) {
            return this.checkSCompFilter(filter);
        }
        else if (type === Types_1.Filter.Negation) {
            return this.checkFilterEBNF(filter.NOT);
        }
        else {
            return this.checkLogicCompFilter(filter);
        }
    }
    checkLogicCompFilter(filterObj) {
        let key = Types_1.FilterHelper.getFirstKey(filterObj);
        let filterArr = filterObj[key];
        if (!Array.isArray(filterArr)) {
            return "LOGIC COMPARISON filter value is not an array";
        }
        if (filterArr.length === 0) {
            return "LOGIC COMPARISON filter is empty";
        }
        for (let filter of filterArr) {
            let msg = this.checkFilterEBNF(filter);
            if (msg !== QueryValidator_1.QueryValidator.validStr) {
                return msg;
            }
        }
        return QueryValidator_1.QueryValidator.validStr;
    }
    checkSCompFilter(filter) {
        let sCompObj = filter.IS;
        let sKey = Types_1.FilterHelper.getFirstKey(sCompObj);
        let keyValidMsg = this.keyValidator.isValidKey(sKey, KeyValidator_1.FieldType.sField);
        if (keyValidMsg !== QueryValidator_1.QueryValidator.validStr) {
            return keyValidMsg;
        }
        let compString = sCompObj[sKey];
        if (typeof compString !== "string") {
            return "Input for S COMPARISON filter is not a string";
        }
        if (BodyValidator.wrongAsterisk(compString)) {
            return "S COMPARISON string contains invalid asterisk";
        }
        return QueryValidator_1.QueryValidator.validStr;
    }
    static wrongAsterisk(s) {
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
        let mCompType = Types_1.FilterHelper.mCompType(filter);
        if (mCompType === QueryValidator_1.QueryValidator.invalidStr) {
            return "Invalid M COMPARATOR";
        }
        let mCompObj = filter[mCompType];
        let mKey = Types_1.FilterHelper.getFirstKey(mCompObj);
        let keyValidMsg = this.keyValidator.isValidKey(mKey, KeyValidator_1.FieldType.mField);
        if (keyValidMsg !== QueryValidator_1.QueryValidator.validStr) {
            return keyValidMsg;
        }
        if (typeof mCompObj[mKey] !== "number") {
            return "M COMPARISON not comparing m key to a number";
        }
        return QueryValidator_1.QueryValidator.validStr;
    }
}
exports.BodyValidator = BodyValidator;
//# sourceMappingURL=BodyValidator.js.map