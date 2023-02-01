"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterHelper = exports.Filter = exports.Room = exports.Section = void 0;
const QueryValidator_1 = require("./QueryValidator");
const HtmlParsingFunctions_1 = require("./HtmlParsingFunctions");
class Section {
    constructor(id = "undefined and never set", dept = "undefined and never set", avg = -1, instructor = "undefined and never set", title = "undefined and never set", pass = -1, fail = -1, audit = -1, uuid = "undefined and never set", year = -1) {
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
    static getSectionFromJSON(JSONSection) {
        let section = new Section();
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
    static createSectionsFromFile(file) {
        let validSections = [];
        if (file.result === null || file.result.length < 1) {
            return validSections;
        }
        for (let s of file.result) {
            let section = new Section();
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
            }
            else {
                section.year = parseInt(s.Year, 10);
            }
            if (section.hasAllFields()) {
                validSections.push(section);
            }
        }
        return validSections;
    }
    hasAllFields() {
        let fieldsNotDefaultValue = (this.id !== "undefined and never set" && this.dept !== "undefined and never set" &&
            this.avg !== -1 && this.instructor !== "undefined and never set" &&
            this.title !== "undefined and never set" && this.pass !== -1 && this.fail !== -1 &&
            this.audit !== -1 && this.uuid !== "undefined and never set" && this.year !== -1);
        return fieldsNotDefaultValue;
    }
    static getSectionValue(section, key) {
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
exports.Section = Section;
class Room {
    constructor(fullName = "undefined and never set", shortName = "undefined and never set", number = "undefined and never set", name = "undefined and never set", address = "undefined and never set", lat = -1, lon = -1, seats = -1, type = "undefined and never set", furniture = "undefined and never set", href = "undefined and never set") {
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
    static getRoomFromJSON(JSONRoom) {
        let room = new Room();
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
    static getRoomValue(room, key) {
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
    static async getValidRoomsFromBuilding(buildingFile, tag) {
        let h = new HtmlParsingFunctions_1.HtmlParsingFunctions();
        let validRooms = [];
        let fullNameHtmlClass = "views-field-title";
        let shortNameHtmlClass = "views-field-field-building-code";
        let numberHtmlClass = "views-field-field-room-number";
        let addressHtmlClass = "views-field-field-building-address";
        let seatsHtmlClass = "views-field-field-room-capacity";
        let typeHtmlClass = "views-field-field-room-type";
        let furnitureHtmlClass = "views-field-field-room-furniture";
        let allRooms = h.findSpecificHtmlNodes("tbody", buildingFile.childNodes)[0];
        if (allRooms === undefined) {
            return Promise.resolve(validRooms);
        }
        for await (const roomTag of h.findSpecificHtmlNodes("tr", allRooms.childNodes)) {
            try {
                let fullName = h.findFullNameOrNumber(fullNameHtmlClass, tag);
                let shortName = h.findSpecificRoomField(shortNameHtmlClass, tag);
                let number = h.findFullNameOrNumber(numberHtmlClass, roomTag);
                let address = h.findSpecificRoomField(addressHtmlClass, tag);
                let seatsString = h.findSpecificRoomField(seatsHtmlClass, roomTag);
                let seats;
                if (seatsString === "") {
                    seats = 0;
                }
                else {
                    seats = Number(seatsString);
                }
                let type = h.findSpecificRoomField(typeHtmlClass, roomTag);
                let furniture = h.findSpecificRoomField(furnitureHtmlClass, roomTag);
                let name = shortName + "_" + number;
                let href = h.findHref(roomTag);
                let [lat, lon] = await h.findLatAndLon(address);
                let room = new Room(fullName, shortName, number, name, address, lat, lon, seats, type, furniture, href);
                validRooms.push(room);
            }
            catch (e) {
            }
        }
        return Promise.resolve(validRooms);
    }
}
exports.Room = Room;
var Filter;
(function (Filter) {
    Filter[Filter["LogicComp"] = 0] = "LogicComp";
    Filter[Filter["MComp"] = 1] = "MComp";
    Filter[Filter["SComp"] = 2] = "SComp";
    Filter[Filter["Negation"] = 3] = "Negation";
    Filter[Filter["Invalid"] = 4] = "Invalid";
})(Filter = exports.Filter || (exports.Filter = {}));
class FilterHelper {
    constructor() {
    }
    static getFirstKey(obj) {
        let keys = Object.keys(obj);
        if (!keys[0]) {
            return QueryValidator_1.QueryValidator.invalidStr;
        }
        return keys[0];
    }
    static filterType(filterObj) {
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
    static mCompType(filter) {
        if (typeof filter.EQ !== "undefined") {
            return "EQ";
        }
        if (typeof filter.LT !== "undefined") {
            return "LT";
        }
        if (typeof filter.GT !== "undefined") {
            return "GT";
        }
        return QueryValidator_1.QueryValidator.invalidStr;
    }
}
exports.FilterHelper = FilterHelper;
//# sourceMappingURL=Types.js.map