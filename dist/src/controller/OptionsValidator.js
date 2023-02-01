"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionsValidator = void 0;
const KeyValidator_1 = require("./KeyValidator");
const QueryValidator_1 = require("./QueryValidator");
class OptionsValidator {
    constructor(keyValidator) {
        this.keyValidator = keyValidator;
    }
    checkOptionsEBNF(query) {
        let options = query.OPTIONS;
        if (typeof options === "undefined") {
            return "OPTIONS clause doesn't exist";
        }
        let columnsMsg = this.checkColumnsEBNF(options);
        if (columnsMsg !== QueryValidator_1.QueryValidator.validStr) {
            return columnsMsg;
        }
        let sortMsg = this.checkSortEBNF(options);
        if (sortMsg !== QueryValidator_1.QueryValidator.validStr) {
            return sortMsg;
        }
        return QueryValidator_1.QueryValidator.validStr;
    }
    checkSortEBNF(options) {
        let order = options.ORDER;
        if (typeof order === "undefined") {
            return QueryValidator_1.QueryValidator.validStr;
        }
        if (typeof order === "string") {
            let validKeyMsg = this.keyValidator.isValidKey(order, KeyValidator_1.FieldType.NA);
            if (validKeyMsg !== QueryValidator_1.QueryValidator.validStr) {
                return validKeyMsg;
            }
        }
        else {
            let validOrderObjMsg = this.isValidOrderObj(order);
            if (validOrderObjMsg !== QueryValidator_1.QueryValidator.validStr) {
                return validOrderObjMsg;
            }
        }
        return QueryValidator_1.QueryValidator.validStr;
    }
    isValidOrderObj(orderObj) {
        let dir = orderObj.dir;
        if (typeof dir === "undefined" || (dir !== "UP" && dir !== "DOWN")) {
            return "ORDER clause does not contain valid dir field";
        }
        let keys = orderObj.keys;
        if (!Array.isArray(keys) || keys.length < 1) {
            return "ORDER.keys is not an array with length >= 1";
        }
        for (let key of keys) {
            if (typeof key !== "string") {
                return "ORDER.keys is not an array of strings";
            }
            let validKeyMsg = this.keyValidator.isValidKey(key, KeyValidator_1.FieldType.NA);
            if (validKeyMsg !== QueryValidator_1.QueryValidator.validStr) {
                return validKeyMsg;
            }
        }
        if (QueryValidator_1.QueryValidator.numKeys(orderObj) > 2) {
            return "ORDER clause contains extra fields";
        }
        return QueryValidator_1.QueryValidator.validStr;
    }
    checkColumnsEBNF(options) {
        let columns = options.COLUMNS;
        if (typeof columns === "undefined") {
            return "COLUMNS clause doesn't exist";
        }
        if (!Array.isArray(columns)) {
            return "COLUMNS is not an array";
        }
        if (columns.length < 1) {
            return "COLUMNS is an empty array";
        }
        for (let col of columns) {
            if (typeof col !== "string") {
                return "COLUMNS is not an array of strings";
            }
            let colCheckMsg = this.keyValidator.isValidKey(col, KeyValidator_1.FieldType.NA);
            if (colCheckMsg !== QueryValidator_1.QueryValidator.validStr) {
                return colCheckMsg;
            }
        }
        return QueryValidator_1.QueryValidator.validStr;
    }
}
exports.OptionsValidator = OptionsValidator;
//# sourceMappingURL=OptionsValidator.js.map