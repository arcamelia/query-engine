import {Attribute, ChildNode, Element, TextNode} from "parse5";
import * as http from "http";

export class HtmlParsingFunctions {

	public findSpecificHtmlNodes(
		htmlTag: string,
		childNodes: ChildNode[],
		attributeValue?: {attr: string; value: string}): ChildNode[] {
		let nodeResults = [];

		for (let node of childNodes) {
			if (node.nodeName === htmlTag) {
				if (!attributeValue) {
					nodeResults.push(node);
				} else {
					let currElement: Element = node as Element;
					let elementAttribute: Attribute | undefined = currElement.attrs.find((a) =>
						a.name === attributeValue.attr);

					// if element attribute exists, add it to the result of nodes
					let doesElementAttributeValueExist: boolean =
						elementAttribute ? elementAttribute.value.includes(attributeValue.value) : false;
					if (doesElementAttributeValueExist) {
						nodeResults.push(node);
					}
				}
			}

			let currChildNodes = (node as Element).childNodes;

			if (currChildNodes != null) {
				nodeResults.push(...this.findSpecificHtmlNodes(htmlTag, currChildNodes, attributeValue));
			}
		}
		return nodeResults;
	}

	public findSpecificRoomField(htmlClass: string, tr: Element) {
		let childNodes: ChildNode[] = tr.childNodes;
		let attributeValue =  {
			attr: "class",
			value: htmlClass,
		};

		let parentField = (this.findSpecificHtmlNodes("td", childNodes, attributeValue)[0] as Element);
		let field = parentField.childNodes[0] as TextNode;

		let fieldString: string = field.value.replace(/\s + /g, " ").trim();

		if (fieldString) {
			return fieldString;
		} else {
			return "";
		}
	}

	// this function specifically gets either fullName or Number field for Room
	public findFullNameOrNumber(htmlClass: string, tr: Element) {
		let childNodes: ChildNode[] = tr.childNodes;
		let attributeValue =  {
			attr: "class",
			value: htmlClass,
		};

		let tdElement: Element = this.findSpecificHtmlNodes("td", childNodes, attributeValue)[0] as Element;

		let parentField: Element = this.findSpecificHtmlNodes("a", tdElement.childNodes)[0] as Element;

		let field = (parentField.childNodes[0] as TextNode).value;

		if (field) {
			return field;
		} else {
			return "";
		}
	}

	public findHref(tr: Element) {
		let hrefHtmlNodes = this.findSpecificHtmlNodes("a", tr.childNodes);
		let firstHrefHtmlNode = hrefHtmlNodes[0] as Element;
		let hrefAttributeValue = firstHrefHtmlNode.attrs.find((attr) => attr.name === "href")?.value;

		if (hrefAttributeValue) {
			return hrefAttributeValue;
		} else {
			throw new Error("Href couldn't be found");
		}
	}

	public async findLatAndLon(address: string): Promise<([number, number])> {
		let apiURL: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team594/";
		const addressFormatted: string = address.replace(/\s/g, "%20");
		apiURL = apiURL + addressFormatted;

		// CREDIT: code taken from https://nodejs.org/api/http.html#http_http
		let getLatLon: Promise<[number, number]>;
		getLatLon = new Promise<[number, number]>((resolve) => {
			http.get(apiURL, (res) => {
				const {statusCode} = res;
				const contentType = res.headers["content-type"];

				let error;
				// Any 2xx status code signals a successful response but
				// here we're only checking for 200.
				if (statusCode !== 200) {
					error = new Error("Request Failed.\n" +
						`Status Code: ${statusCode}`);
				} else if (contentType ? !/^application\/json/.test(contentType) : true) {
					error = new Error("Invalid content-type.\n" +
						`Expected application/json but received ${contentType}`);
				}
				if (error) {
					console.error(error.message);
					// Consume response data to free up memory
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

						let latitude: number = parsedData.lat;
						let longitude: number = parsedData.lon;

						resolve([latitude, longitude]);
					} catch (e) {
						// caught
					}
				});
			});
		});

		return getLatLon.then((result: [number, number]) => {
			return result;
		});
	}
}
