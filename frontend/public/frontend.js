
function getRandomDistance() {
	let numberArrays = [
		0.3, 0.4, 0.6, 0.7, 0.8, 0.9,
		1.0, 1.2, 1.5, 1.6, 1.7, 1.9,
		2.1, 2.2, 2.3, 2.4, 2.5, 2.8,
		3.0, 3.2, 3.3];

	let randomIndex = Math.floor(Math.random() * 22);
	return numberArrays[randomIndex];
}

function fillTable(json) {
	// console.log("before");
	var table = document.getElementById("profTable");

	// console.log(json.result);
	// console.log(json.result[0]);

	// console.log("aaa" + json.result[0].avgFails);

	let counter = 1;
	for (let a of json.result) {

		let row = table.insertRow(counter);
		row.style.display = "block";

		let cell1 = row.insertCell(0);
		let cell2 = row.insertCell(1);
		let cell3 = row.insertCell(2);

		cell1.innerHTML = a["courses_instructor"].toString();
		cell2.innerHTML = a.overallAvg.toString();
		cell3.innerHTML = a.avgFails.toString();

		counter++;
	}

}

async function getProfessors() {
	let dept = document.getElementById("depName").value;
	let course = document.getElementById("courseNum").value;
	let query = {
		"WHERE": {
			"AND": [
				{
					"IS": {
						"courses_dept": dept
					}
				},
				{
					"IS": {
						"courses_id": course
					}
				}
			]
		},
		"OPTIONS": {
			"COLUMNS": [
				"courses_instructor",
				"overallAvg",
				"avgFails"
			],
			"ORDER": "courses_instructor"
		},
		"TRANSFORMATIONS": {
			"GROUP": ["courses_instructor"],
			"APPLY": [
				{
					"overallAvg": {
						"AVG": "courses_avg"
					}
				},
				{
					"avgFails": {
						"AVG": "courses_fail"
					}
				}
			]
		}
	};

	try {
		const response = await fetch("/query",
			{
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				method: "POST",
				body: JSON.stringify(query)
			});
		// const response = await fetch("/datasets",
		// 	{
		// 			method: "GET"
		// 	});
		let json = await response.json();
		fillTable(json);
	} catch (err) {
		console.log('Could not find any professors matching your search!!!' + `${err}`);
		// todo: display error on screen
	}

}

async function doesBuildingExist() {
	let buildingName = document.getElementById("buildingName").value;
	let isNum = !isNaN(buildingName);

	if (isNum) {
		buildingName = buildingName.toNumber();
	} else {
		buildingName = buildingName.toUpperCase();
	}

	let query = {
		"WHERE": {
			"IS": {
				"rooms_shortname": buildingName
			}
		},
		"OPTIONS": {
			"COLUMNS": ["rooms_shortname"]
		}
	};

	try {
		const response = await fetch("/query",
			{
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				method: "POST",
				body: JSON.stringify(query)
			});
		let json = await response.json();

		if (json.result) {
			if (json.result.length > 0) {
				let res = document.getElementById("building-result");
				let text = document.createTextNode("  " +getRandomDistance() + " km away");
				res.appendChild(text);
			}
		}
	} catch (err) {
		console.log('Could not find building!!! ' + `${err}`);
	}
}

