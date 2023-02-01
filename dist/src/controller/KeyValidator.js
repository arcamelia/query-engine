"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyValidator = exports.FieldType = void 0;
const QueryValidator_1 = require("./QueryValidator");
var FieldType;
(function (FieldType) {
    FieldType[FieldType["mField"] = 0] = "mField";
    FieldType[FieldType["sField"] = 1] = "sField";
    FieldType[FieldType["NA"] = 2] = "NA";
})(FieldType = exports.FieldType || (exports.FieldType = {}));
class KeyValidator {
    constructor() {
        this.datasetID = "not_set";
        this.firstKeyEncountered = false;
        this.applyKeys = [];
    }
    isValidKey(key, type) {
        let msKeyMsg = this.isValidMSKey(key, type);
        let applyKeyMsg = this.isValidApplyKey(key);
        if (msKeyMsg === QueryValidator_1.QueryValidator.validStr || applyKeyMsg === QueryValidator_1.QueryValidator.validStr) {
            return QueryValidator_1.QueryValidator.validStr;
        }
        if (msKeyMsg !== QueryValidator_1.QueryValidator.validStr) {
            return msKeyMsg;
        }
        return applyKeyMsg;
    }
    isValidApplyKey(key) {
        let numUnderscores = key.replace(/[^_]/g, "").length;
        if (numUnderscores > 0) {
            return "Apply key contains an underscore";
        }
        return QueryValidator_1.QueryValidator.validStr;
    }
    isValidMSKey(key, type) {
        let numUnderscores = key.replace(/[^_]/g, "").length;
        if (numUnderscores > 1) {
            return "Query key contains more than one underscore";
        }
        if (numUnderscores === 0) {
            return "Query key doesn't contain an underscore";
        }
        let keyParts = key.split("_");
        let id = keyParts[0];
        let field = keyParts[1];
        if (!this.isSameDatasetID(id)) {
            return "Dataset IDs do not match across query";
        }
        if (!KeyValidator.isValidField(field, type)) {
            if (type === FieldType.mField) {
                return "Invalid m field";
            }
            else if (type === FieldType.sField) {
                return "Invalid s field";
            }
            return "Invalid dataset query field";
        }
        return QueryValidator_1.QueryValidator.validStr;
    }
    isSameDatasetID(id) {
        if (!this.firstKeyEncountered) {
            this.datasetID = id;
            this.firstKeyEncountered = true;
            return true;
        }
        else {
            return id === this.datasetID;
        }
    }
    static isValidField(key, type) {
        switch (type) {
            case FieldType.mField:
                return KeyValidator.mFields.indexOf(key) !== -1;
            case FieldType.sField:
                return KeyValidator.sFields.indexOf(key) !== -1;
            case FieldType.NA:
                return KeyValidator.possibleFields.indexOf(key) !== -1;
            default:
                return false;
        }
    }
}
exports.KeyValidator = KeyValidator;
KeyValidator.mFields = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
KeyValidator.sFields = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname",
    "number", "name", "address", "type", "furniture", "href"];
KeyValidator.possibleFields = KeyValidator.mFields.concat(KeyValidator.sFields);
//# sourceMappingURL=KeyValidator.js.map