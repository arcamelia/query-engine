"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryValidator = void 0;
const IInsightFacade_1 = require("./IInsightFacade");
const BodyValidator_1 = require("./BodyValidator");
const KeyValidator_1 = require("./KeyValidator");
const OptionsValidator_1 = require("./OptionsValidator");
const TransformationsValidator_1 = require("./TransformationsValidator");
const Types_1 = require("./Types");
class QueryValidator {
    constructor() {
        this.keyValidator = new KeyValidator_1.KeyValidator();
        this.bodyValidator = new BodyValidator_1.BodyValidator(this.keyValidator);
        this.optionsValidator = new OptionsValidator_1.OptionsValidator(this.keyValidator);
        this.transformationsValidator = new TransformationsValidator_1.TransformationsValidator(this.keyValidator);
    }
    validateQuery(query) {
        if (!query) {
            return Promise.reject(new IInsightFacade_1.InsightError("Query is undefined or null"));
        }
        if (!QueryValidator.isValidJSON(query)) {
            return Promise.reject(new IInsightFacade_1.InsightError("Query is not a valid JSON object"));
        }
        let jQuery = JSON.parse(JSON.stringify(query));
        let syntaxCheck = this.checkQuerySyntax(jQuery);
        if (syntaxCheck !== QueryValidator.validStr) {
            return Promise.reject(new IInsightFacade_1.InsightError(syntaxCheck));
        }
        let semanticsCheck = this.checkQuerySemantics(jQuery);
        if (semanticsCheck !== QueryValidator.validStr) {
            return Promise.reject(new IInsightFacade_1.InsightError(semanticsCheck));
        }
        return Promise.resolve([]);
    }
    checkQuerySyntax(query) {
        let bodyMsg = this.bodyValidator.checkBodyEBNF(query);
        if (bodyMsg === QueryValidator.validStr) {
            let optionsMsg = this.optionsValidator.checkOptionsEBNF(query);
            if (optionsMsg === QueryValidator.validStr) {
                return this.transformationsValidator.checkTransformationsEBNF(query);
            }
            else {
                return optionsMsg;
            }
        }
        else {
            return bodyMsg;
        }
    }
    checkQuerySemantics(query) {
        let options = query.OPTIONS;
        let columnsArr = options.COLUMNS;
        let order = options.ORDER;
        if (typeof order !== "undefined") {
            if (typeof order === "string") {
                let orderKeyMsg = QueryValidator.checkOrderKeysInColumns([order], columnsArr);
                if (orderKeyMsg !== QueryValidator.validStr) {
                    return orderKeyMsg;
                }
            }
            else {
                let orderKeyArr = order.keys;
                let orderKeysMsg = QueryValidator.checkOrderKeysInColumns(orderKeyArr, columnsArr);
                if (orderKeysMsg !== QueryValidator.validStr) {
                    return orderKeysMsg;
                }
            }
        }
        let transformations = query.TRANSFORMATIONS;
        if (typeof transformations !== "undefined") {
            let applyArr = transformations.APPLY;
            let groupKeyArr = transformations.GROUP;
            let applyTokenMsg = QueryValidator.checkNumericApplyTokens(applyArr);
            if (applyTokenMsg !== QueryValidator.validStr) {
                return applyTokenMsg;
            }
            let uniqueApplyRuleMsg = QueryValidator.checkUniqueApplyRules(applyArr);
            if (uniqueApplyRuleMsg !== QueryValidator.validStr) {
                return uniqueApplyRuleMsg;
            }
            let validColsMsg = QueryValidator.checkValidColumns(columnsArr, groupKeyArr, this.keyValidator.applyKeys);
            if (validColsMsg !== QueryValidator.validStr) {
                return validColsMsg;
            }
        }
        return QueryValidator.validStr;
    }
    static checkValidColumns(columnsArr, groupKeyArr, applyKeyArr) {
        for (let col of columnsArr) {
            let isGroupKey = QueryValidator.isEltInArr(col, groupKeyArr);
            let isApplyKeyInApplyBlock = QueryValidator.isEltInArr(col, applyKeyArr);
            if (!isGroupKey && !isApplyKeyInApplyBlock) {
                return "Invalid column name is neither a GROUP key nor an apply key in APPLY block";
            }
        }
        return QueryValidator.validStr;
    }
    static checkUniqueApplyRules(applyArr) {
        let seenSoFarArr = [];
        for (let applyRule of applyArr) {
            let applyKey = Types_1.FilterHelper.getFirstKey(applyRule);
            if (QueryValidator.isEltInArr(applyKey, seenSoFarArr)) {
                return "Two APPLY RULEs share an apply key with the same name";
            }
            else {
                seenSoFarArr.push(applyKey);
            }
        }
        return QueryValidator.validStr;
    }
    static checkNumericApplyTokens(applyArr) {
        for (let applyRule of applyArr) {
            let applyKey = Types_1.FilterHelper.getFirstKey(applyRule);
            let applyTokenObj = applyRule[applyKey];
            let applyToken = Types_1.FilterHelper.getFirstKey(applyTokenObj);
            if (applyToken !== "COUNT") {
                let key = applyTokenObj[applyToken].split("_")[1];
                if (!KeyValidator_1.KeyValidator.isValidField(key, KeyValidator_1.FieldType.mField)) {
                    return "MAX/MIN/AVG/SUM being called on non-numeric field";
                }
            }
        }
        return QueryValidator.validStr;
    }
    static checkOrderKeysInColumns(orderKeyArr, columnsArr) {
        for (let orderKey of orderKeyArr) {
            if (!QueryValidator.isEltInArr(orderKey, columnsArr)) {
                return "ORDER key not in COLUMNS array";
            }
        }
        return QueryValidator.validStr;
    }
    static isEltInArr(elt, arr) {
        return arr.indexOf(elt) !== -1;
    }
    static numKeys(obj) {
        return Object.keys(obj).length;
    }
    static isValidJSON(obj) {
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
}
exports.QueryValidator = QueryValidator;
QueryValidator.validStr = "valid";
QueryValidator.invalidStr = "invalid";
//# sourceMappingURL=QueryValidator.js.map