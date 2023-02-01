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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlParsingFunctions = void 0;
const http = __importStar(require("http"));
class HtmlParsingFunctions {
    findSpecificHtmlNodes(htmlTag, childNodes, attributeValue) {
        let nodeResults = [];
        for (let node of childNodes) {
            if (node.nodeName === htmlTag) {
                if (!attributeValue) {
                    nodeResults.push(node);
                }
                else {
                    let currElement = node;
                    let elementAttribute = currElement.attrs.find((a) => a.name === attributeValue.attr);
                    let doesElementAttributeValueExist = elementAttribute ? elementAttribute.value.includes(attributeValue.value) : false;
                    if (doesElementAttributeValueExist) {
                        nodeResults.push(node);
                    }
                }
            }
            let currChildNodes = node.childNodes;
            if (currChildNodes != null) {
                nodeResults.push(...this.findSpecificHtmlNodes(htmlTag, currChildNodes, attributeValue));
            }
        }
        return nodeResults;
    }
    findSpecificRoomField(htmlClass, tr) {
        let childNodes = tr.childNodes;
        let attributeValue = {
            attr: "class",
            value: htmlClass,
        };
        let parentField = this.findSpecificHtmlNodes("td", childNodes, attributeValue)[0];
        let field = parentField.childNodes[0];
        let fieldString = field.value.replace(/\s + /g, " ").trim();
        if (fieldString) {
            return fieldString;
        }
        else {
            return "";
        }
    }
    findFullNameOrNumber(htmlClass, tr) {
        let childNodes = tr.childNodes;
        let attributeValue = {
            attr: "class",
            value: htmlClass,
        };
        let tdElement = this.findSpecificHtmlNodes("td", childNodes, attributeValue)[0];
        let parentField = this.findSpecificHtmlNodes("a", tdElement.childNodes)[0];
        let field = parentField.childNodes[0].value;
        if (field) {
            return field;
        }
        else {
            return "";
        }
    }
    findHref(tr) {
        let hrefHtmlNodes = this.findSpecificHtmlNodes("a", tr.childNodes);
        let firstHrefHtmlNode = hrefHtmlNodes[0];
        let hrefAttributeValue = firstHrefHtmlNode.attrs.find((attr) => attr.name === "href")?.value;
        if (hrefAttributeValue) {
            return hrefAttributeValue;
        }
        else {
            throw new Error("Href couldn't be found");
        }
    }
    async findLatAndLon(address) {
        let apiURL = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team594/";
        const addressFormatted = address.replace(/\s/g, "%20");
        apiURL = apiURL + addressFormatted;
        let getLatLon;
        getLatLon = new Promise((resolve) => {
            http.get(apiURL, (res) => {
                const { statusCode } = res;
                const contentType = res.headers["content-type"];
                let error;
                if (statusCode !== 200) {
                    error = new Error("Request Failed.\n" +
                        `Status Code: ${statusCode}`);
                }
                else if (contentType ? !/^application\/json/.test(contentType) : true) {
                    error = new Error("Invalid content-type.\n" +
                        `Expected application/json but received ${contentType}`);
                }
                if (error) {
                    console.error(error.message);
                    res.resume();
                    return;
                }
                res.setEncoding("utf8");
                let rawData = "";
                res.on("data", (chunk) => {
                    rawData += chunk;
                });
                res.on("end", () => {
                    try {
                        const parsedData = JSON.parse(rawData);
                        let latitude = parsedData.lat;
                        let longitude = parsedData.lon;
                        resolve([latitude, longitude]);
                    }
                    catch (e) {
                    }
                });
            });
        });
        return getLatLon.then((result) => {
            return result;
        });
    }
}
exports.HtmlParsingFunctions = HtmlParsingFunctions;
//# sourceMappingURL=HtmlParsingFunctions.js.map