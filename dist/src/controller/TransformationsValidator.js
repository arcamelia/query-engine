"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransformationsValidator = void 0;
const KeyValidator_1 = require("./KeyValidator");
const QueryValidator_1 = require("./QueryValidator");
const Types_1 = require("./Types");
class TransformationsValidator {
    constructor(keyValidator) {
        this.applyTokens = ["MAX", "MIN", "AVG", "COUNT", "SUM"];
        this.keyValidator = keyValidator;
    }
    checkTransformationsEBNF(query) {
        let transformations = query.TRANSFORMATIONS;
        if (typeof transformations === "undefined") {
            return QueryValidator_1.QueryValidator.validStr;
        }
        let groupMsg = this.checkGroupEBNF(transformations);
        if (groupMsg !== QueryValidator_1.QueryValidator.validStr) {
            return groupMsg;
        }
        let applyMsg = this.checkApplyEBNF(transformations);
        if (applyMsg !== QueryValidator_1.QueryValidator.validStr) {
            return applyMsg;
        }
        return QueryValidator_1.QueryValidator.validStr;
    }
    checkGroupEBNF(transformationsObj) {
        let groupKeys = transformationsObj.GROUP;
        if (typeof groupKeys === "undefined") {
            return "Missing GROUP clause from transformations";
        }
        if (!Array.isArray(groupKeys)) {
            return "GROUP field isn't an array";
        }
        if (groupKeys.length < 1) {
            return "GROUP array is empty";
        }
        for (let key of groupKeys) {
            if (typeof key !== "string") {
                return "GROUP array contains non string elements";
            }
            if (!this.keyValidator.isValidMSKey(key, KeyValidator_1.FieldType.NA)) {
                return "GROUP array contains invalid keys";
            }
        }
        return QueryValidator_1.QueryValidator.validStr;
    }
    checkApplyEBNF(transformationsObj) {
        let applyRules = transformationsObj.APPLY;
        if (typeof applyRules === "undefined") {
            return "Missing APPLY clause from transformations";
        }
        if (!Array.isArray(applyRules)) {
            return "APPLY field isn't an array";
        }
        for (let ar of applyRules) {
            let arMsg = this.isValidApplyRule(ar);
            if (arMsg !== QueryValidator_1.QueryValidator.validStr) {
                return arMsg;
            }
        }
        return QueryValidator_1.QueryValidator.validStr;
    }
    isValidApplyRule(ar) {
        let arKey = Types_1.FilterHelper.getFirstKey(ar);
        let arKeyMsg = this.keyValidator.isValidApplyKey(arKey);
        if (arKeyMsg !== QueryValidator_1.QueryValidator.validStr) {
            return arKeyMsg;
        }
        this.keyValidator.applyKeys.push(arKey);
        let applyObj = ar[arKey];
        let applyToken = Types_1.FilterHelper.getFirstKey(applyObj);
        if (!this.isValidApplyToken(applyToken)) {
            return "Invalid APPLY TOKEN given";
        }
        let key = applyObj[applyToken];
        let validKeyMsg = this.keyValidator.isValidMSKey(key, KeyValidator_1.FieldType.NA);
        if (validKeyMsg !== QueryValidator_1.QueryValidator.validStr) {
            return validKeyMsg;
        }
        return QueryValidator_1.QueryValidator.validStr;
    }
    isValidApplyToken(at) {
        return this.applyTokens.indexOf(at) !== -1;
    }
}
exports.TransformationsValidator = TransformationsValidator;
//# sourceMappingURL=TransformationsValidator.js.map