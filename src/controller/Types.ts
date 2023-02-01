import {InsightDataset} from "./IInsightFacade";
import {Element, Document} from "parse5";
import {QueryValidator} from "./QueryValidator";
import {HtmlParsingFunctions} from "./HtmlParsingFunctions";

export class Section {
	public id: string;
	public dept: string;
	public avg: number;
	public instructor: string;
	public title: string;
	public pass: number;
	public fail: number;
	public audit: number;
	public uuid: string;
	public year: number;

	constructor(
		id = "undefined and never set", dept = "undefined and never set",
		avg = -1, instructor = "undefined and never set",
		title = "undefined and never set", pass = -1, fail = -1,
		audit = -1, uuid = "undefined and never set", year = -1) {
		this.id = id;
		this.dept = dept;
		this.avg = avg;
		this.instructor = instructor;
		this.title = title;
		this.pass = pass;
		this.fail = fail;
		this.audit = audit;
		this.uuid = uuid;
		this.year = year;
	}

	public static getSectionFromJSON(JSONSection: any): Section {
		let section: Section = new Section();
		section.id = JSONSection.id;
		section.dept = JSONSection.dept;
		section.avg = JSONSection.avg;
		section.instructor = JSONSection.instructor;
		section.title = JSONSection.title;
		section.pass = JSONSection.pass;
		section.fail = JSONSection.fail;
		section.audit = JSONSection.audit;
		section.uuid = JSONSection.uuid;
		section.year = JSONSection.year;

		return section;
	}

	public static createSectionsFromFile(file: any): Section[] {
		let validSections: Section[] = [];

		if (file.result === null || file.result.length < 1) {
			// No sections in file
			return validSections;
		}

		for (let s of file.result) {
			let section: Section = new Section();
			section.id = s.Course;
			section.dept = s.Subject;
			section.avg = s.Avg;
			section.instructor = s.Professor;
			section.title = s.Title;
			section.pass = s.Pass;
			section.fail = s.Fail;
			section.audit = s.Audit;
			section.uuid = s.id.toString();

			let isSectionOverall = s.Section === "overall";
			if (isSectionOverall) {
				section.year = 1900;
			} else {
				section.year = parseInt(s.Year, 10);
			}

			// if section is valid, we can add it to the sections array we are returning
			if (section.hasAllFields()) {
				validSections.push(section);
			}
		}
		return validSections;
	}

	private hasAllFields(): boolean {
		let fieldsNotDefaultValue: boolean = (
			this.id !== "undefined and never set" && this.dept !== "undefined and never set" &&
			this.avg !== -1 && this.instructor !== "undefined and never set" &&
			this.title !== "undefined and never set" && this.pass !== -1 && this.fail !== -1 &&
			this.audit !== -1 && this.uuid !== "undefined and never set" && this.year !== -1
		);
		return fieldsNotDefaultValue;
	}

	// given a section and a key, get the value from section.key
	// REQUIRES: key is a field on Section (i.e., it's one of: dept, id, avg, instructor, title, pass, fail,
	//			 audit, uuid, year)
	public static getSectionValue(section: Section, key: string): string | number {
		switch (key) {
			case "dept": return section.dept;
			case "id": return section.id;
			case "avg": return section.avg;
			case "instructor": return section.instructor;
			case "title": return section.title;
			case "pass": return section.pass;
			case "fail": return section.fail;
			case "audit": return section.audit;
			case "uuid": return section.uuid;
			case "year": return section.year;
		}
		return -1;
	}
}

export class Room {
	public fullName: string;
	public shortName: string;
	public number: string;
	public name: string;
	public address: string;
	public lat: number;
	public lon: number;
	public seats: number;
	public type: string;
	public furniture: string;
	public href: string;

	constructor(
		fullName = "undefined and never set", shortName = "undefined and never set",
		number = "undefined and never set", name = "undefined and never set",
		address = "undefined and never set", lat = -1, lon = -1,
		seats = -1, type = "undefined and never set",
		furniture = "undefined and never set", href = "undefined and never set") {
		this.fullName = fullName;
		this.shortName = shortName;
		this.number = number;
		this.name = name;
		this.address = address;
		this.lat = lat;
		this.lon = lon;
		this.seats = seats;
		this.type = type;
		this.furniture = furniture;
		this.href = href;
	}

	public static getRoomFromJSON(JSONRoom: any): Room {
		let room: Room = new Room();
		room.fullName = JSONRoom.fullName;
		room.shortName = JSONRoom.shortName;
		room.number = JSONRoom.number;
		room.name = JSONRoom.name;
		room.address = JSONRoom.address;
		room.lat = JSONRoom.lat;
		room.lon = JSONRoom.lon;
		room.seats = JSONRoom.seats;
		room.type = JSONRoom.type;
		room.furniture = JSONRoom.furniture;
		room.href = JSONRoom.href;

		return room;
	}

	// given a room and a key, get the value from room.key
	// REQUIRES: key is a field on Room (i.e., it's one of: fullName, shortName, number, name, address,
	// 			 lat, lon, seats, type, furniture, href)
	public static getRoomValue(room: Room, key: string): string | number {
		switch (key) {
			case "fullname":
				return room.fullName;
			case "shortname":
				return room.shortName;
			case "number":
				return room.number;
			case "name":
				return room.name;
			case "address":
				return room.address;
			case "lat":
				return room.lat;
			case "lon":
				return room.lon;
			case "seats":
				return room.seats;
			case "type":
				return room.type;
			case "furniture":
				return room.furniture;
			case "href":
				return room.href;
		}
		return -1;
	}

	public static async getValidRoomsFromBuilding(buildingFile: Document, tag: Element): Promise<Room[]> {
		let h: HtmlParsingFunctions = new HtmlParsingFunctions();
		let validRooms: Room[] = [];

		// html class names for each field
		let fullNameHtmlClass: string = "views-field-title";
		let shortNameHtmlClass: string = "views-field-field-building-code";
		let numberHtmlClass: string = "views-field-field-room-number";
		let addressHtmlClass: string = "views-field-field-building-address";
		let seatsHtmlClass: string = "views-field-field-room-capacity";
		let typeHtmlClass: string = "views-field-field-room-type";
		let furnitureHtmlClass: string = "views-field-field-room-furniture";

		// gets all of the rooms in the building file
		let allRooms = h.findSpecificHtmlNodes("tbody", buildingFile.childNodes)[0];
		if (allRooms === undefined) {
			return Promise.resolve(validRooms);
		}

		// creates Room object for each room
		for await (const roomTag of h.findSpecificHtmlNodes("tr", (allRooms as Element).childNodes)) {
			try {
				let fullName = h.findFullNameOrNumber(fullNameHtmlClass, tag as Element);
				let shortName = h.findSpecificRoomField(shortNameHtmlClass, tag as Element);
				let number = h.findFullNameOrNumber(numberHtmlClass, roomTag as Element);
				let address = h.findSpecificRoomField(addressHtmlClass, tag as Element);
				let seatsString = h.findSpecificRoomField(seatsHtmlClass, roomTag as Element);
				let seats;
				if (seatsString === "") {
					seats = 0;
				} else {
					seats = Number(seatsString);
				}
				let type = h.findSpecificRoomField(typeHtmlClass, roomTag as Element);
				let furniture = h.findSpecificRoomField(furnitureHtmlClass, roomTag as Element);
				let name = shortName + "_" + number;
				let href = h.findHref(roomTag as Element); // let lat = 0; // let lon = 0;
				let [lat, lon] = await h.findLatAndLon(address);
				let room: Room =
					new Room(fullName, shortName, number, name, address, lat, lon, seats, type, furniture, href);
				validRooms.push(room);
			} catch (e) {
				// skip room
			}
		}
		return Promise.resolve(validRooms);
	}
}

export interface Dataset extends InsightDataset {
	sections?: Section[],
	rooms?: Room[]
}

export enum Filter {
	LogicComp, MComp, SComp, Negation, Invalid
}

export class FilterHelper {
	constructor() {
		// do nothing
	}

	// returns "invalid" if no keys exist (i.e., object is empty)
	public static getFirstKey(obj: any): string {
		let keys = Object.keys(obj);
		if (!keys[0]) {
			return QueryValidator.invalidStr;
		}
		return keys[0];
	}

	public static filterType(filterObj: any): Filter {
		let key = FilterHelper.getFirstKey(filterObj);
		if (key === "LT" || key === "GT" || key === "EQ") {
			return Filter.MComp;
		}
		if (key === "IS") {
			return Filter.SComp;
		}
		if (key === "AND" || key === "OR") {
			return Filter.LogicComp;
		}
		if (key === "NOT") {
			return Filter.Negation;
		}
		return Filter.Invalid;
	}

	// return value is one of: "EQ", "LT", "GT"
	public static mCompType(filter: any): string {
		if (typeof filter.EQ !== "undefined") {
			return "EQ";
		}
		if (typeof filter.LT !== "undefined") {
			return "LT";
		}
		if (typeof filter.GT !== "undefined") {
			return "GT";
		}
		return QueryValidator.invalidStr;
	}
}
