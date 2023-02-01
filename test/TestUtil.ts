import * as fs from "fs-extra";

const persistDir = "./data";

function getContentFromArchives(name: string): string {
	return fs.readFileSync("test/resources/archives/" + name).toString("base64");
}

function getContentFromCourseZipFiles(name: string): string {
	return fs.readFileSync("test/resources/addDatasetTests/CoursesZipFiles/" + name).toString("base64");
}

function clearDisk(): void {
	fs.removeSync(persistDir);
}

function addDisk(): void {
	fs.mkdirsSync(persistDir);
}

export {getContentFromArchives, getContentFromCourseZipFiles, persistDir, clearDisk, addDisk};
