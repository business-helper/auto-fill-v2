const APP_SETTINGS = {
	auth_recheck: false,
	auth_endpoint: "https://www.bladznetwork.com/api/v1",
	auth_key: 'ak_VMwyTncV95jssx8DS-2C',
	ENC_KEY: 'RESTOCK$$!WITH*(TAI:)',
	DiSCORD_CLIENT_ID: '695192092061859850',
	DISCORD_CLIENT_SECRET: '7OgYcu5BNNdgi0XWytudFe2XXM909-pC',
	DISCORD_SERVER_ID: '695356483545858178',
	// DISCORD_SERVER_ID: '726966148603576326'
}

const US_STATES = [
	{
		"name": "Alabama",
		"abbreviation": "AL"
	},
	{
		"name": "Alaska",
		"abbreviation": "AK"
	},
	{
		"name": "American Samoa",
		"abbreviation": "AS"
	},
	{
		"name": "Arizona",
		"abbreviation": "AZ"
	},
	{
		"name": "Arkansas",
		"abbreviation": "AR"
	},
	{
		"name": "California",
		"abbreviation": "CA"
	},
	{
		"name": "Colorado",
		"abbreviation": "CO"
	},
	{
		"name": "Connecticut",
		"abbreviation": "CT"
	},
	{
		"name": "Delaware",
		"abbreviation": "DE"
	},
	{
		"name": "District Of Columbia",
		"abbreviation": "DC"
	},
	{
		"name": "Federated States Of Micronesia",
		"abbreviation": "FM"
	},
	{
		"name": "Florida",
		"abbreviation": "FL"
	},
	{
		"name": "Georgia",
		"abbreviation": "GA"
	},
	{
		"name": "Guam",
		"abbreviation": "GU"
	},
	{
		"name": "Hawaii",
		"abbreviation": "HI"
	},
	{
		"name": "Idaho",
		"abbreviation": "ID"
	},
	{
		"name": "Illinois",
		"abbreviation": "IL"
	},
	{
		"name": "Indiana",
		"abbreviation": "IN"
	},
	{
		"name": "Iowa",
		"abbreviation": "IA"
	},
	{
		"name": "Kansas",
		"abbreviation": "KS"
	},
	{
		"name": "Kentucky",
		"abbreviation": "KY"
	},
	{
		"name": "Louisiana",
		"abbreviation": "LA"
	},
	{
		"name": "Maine",
		"abbreviation": "ME"
	},
	{
		"name": "Marshall Islands",
		"abbreviation": "MH"
	},
	{
		"name": "Maryland",
		"abbreviation": "MD"
	},
	{
		"name": "Massachusetts",
		"abbreviation": "MA"
	},
	{
		"name": "Michigan",
		"abbreviation": "MI"
	},
	{
		"name": "Minnesota",
		"abbreviation": "MN"
	},
	{
		"name": "Mississippi",
		"abbreviation": "MS"
	},
	{
		"name": "Missouri",
		"abbreviation": "MO"
	},
	{
		"name": "Montana",
		"abbreviation": "MT"
	},
	{
		"name": "Nebraska",
		"abbreviation": "NE"
	},
	{
		"name": "Nevada",
		"abbreviation": "NV"
	},
	{
		"name": "New Hampshire",
		"abbreviation": "NH"
	},
	{
		"name": "New Jersey",
		"abbreviation": "NJ"
	},
	{
		"name": "New Mexico",
		"abbreviation": "NM"
	},
	{
		"name": "New York",
		"abbreviation": "NY"
	},
	{
		"name": "North Carolina",
		"abbreviation": "NC"
	},
	{
		"name": "North Dakota",
		"abbreviation": "ND"
	},
	{
		"name": "Northern Mariana Islands",
		"abbreviation": "MP"
	},
	{
		"name": "Ohio",
		"abbreviation": "OH"
	},
	{
		"name": "Oklahoma",
		"abbreviation": "OK"
	},
	{
		"name": "Oregon",
		"abbreviation": "OR"
	},
	{
		"name": "Palau",
		"abbreviation": "PW"
	},
	{
		"name": "Pennsylvania",
		"abbreviation": "PA"
	},
	{
		"name": "Puerto Rico",
		"abbreviation": "PR"
	},
	{
		"name": "Rhode Island",
		"abbreviation": "RI"
	},
	{
		"name": "South Carolina",
		"abbreviation": "SC"
	},
	{
		"name": "South Dakota",
		"abbreviation": "SD"
	},
	{
		"name": "Tennessee",
		"abbreviation": "TN"
	},
	{
		"name": "Texas",
		"abbreviation": "TX"
	},
	{
		"name": "Utah",
		"abbreviation": "UT"
	},
	{
		"name": "Vermont",
		"abbreviation": "VT"
	},
	{
		"name": "Virgin Islands",
		"abbreviation": "VI"
	},
	{
		"name": "Virginia",
		"abbreviation": "VA"
	},
	{
		"name": "Washington",
		"abbreviation": "WA"
	},
	{
		"name": "West Virginia",
		"abbreviation": "WV"
	},
	{
		"name": "Wisconsin",
		"abbreviation": "WI"
	},
	{
		"name": "Wyoming",
		"abbreviation": "WY"
	}
];

function docReady(fn) {
	// see if DOM is already available
	if (document.readyState === "complete" || document.readyState === "interactive") {
		// call on next available tick
		setTimeout(fn, 1);
	} else {
		document.addEventListener("DOMContentLoaded", fn);
	}
}

function ajaxPost(url, data, headers) {
	var xhttp = new XMLHttpRequest();
	return new Promise((resolve, reject) => {
		xhttp.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				console.log(xhttp.responseText);
				resolve(JSON.parse(xhttp.responseText));
			} else if (this.status == 404) {
				reject(404);
			} else if (this.status >= 400) {
				reject(400);
			}
		};
		xhttp.open("POST", url, true);
		for (let key in headers) {
			xhttp.setRequestHeader(key, headers[key]);
		}
		xhttp.setRequestHeader('Authorization', `Bearer ${APP_SETTINGS.auth_key}`);
		xhttp.send(JSON.stringify(data));
	})
}

function ajaxGet(url, headers) {
	var xhttp = new XMLHttpRequest();
	return new Promise((resolve, reject) => {
		xhttp.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				// console.log(xhttp.responseText);
				resolve(JSON.parse(xhttp.responseText));
			} else if (this.status == 404) {
				reject(404);
			} else if (this.status >= 400) {
				reject(400);
			}
		};
		xhttp.open("GET", url, true);
		for (let key in headers) {
			xhttp.setRequestHeader(key, headers[key]);
		}
		xhttp.setRequestHeader('Authorization', `Bearer ${APP_SETTINGS.auth_key}`);
		xhttp.send();
	})
}

function authURL(url) {
	return APP_SETTINGS.auth_endpoint + url;
}

function storeActivationInfo(info, callback = null) {
	chrome.storage.local.get(["data"], function (store) {
		console.log('[Activation] loaded', store);
		let data = {};
		if (store && store.data) {
			data = store.data;
		}
		data.activation = info;
		chrome.storage.local.set({ data: data }, function () {
			console.log('[Activation] saved', store);
			if (callback && typeof callback === 'function') callback();
		});
	})
}

function unauthorizeUser(callback = null) {
	chrome.storage.local.get(['data'], function (store) {
		if (store && store.data) {
			store.data.activation = null;
			chrome.storage.local.set({ data: store.data }), function () {
				console.log('Unauthorized!');
				if (callback && typeof callback === 'function') {
					callback();
				}
			}
		}
	});
}

function showAlertModal(content, title, showOk = true, showCancel = false) {
	if (!!title) {
		document.querySelector('.modal .modal-header').classList.remove('hidden');
		document.querySelector('.modal .modal-header').innerText = title;
	} else {
		document.querySelector('.modal .modal-header').classList.add('hidden');
	}

	document.querySelector('.modal .modal-body').innerText = content;

	if (showOk) {
		document.querySelector('.modal .modal-ok').classList.remove('hidden');
	} else {
		document.querySelector('.modal .modal-ok').classList.add('hidden');
	}

	if (showCancel) {
		document.querySelector('.modal .modal-cancel').classList.remove('hidden');
	} else {
		document.querySelector('.modal .modal-cancel').classList.add('hidden');
	}
	showModal();
}

function encryptData(srcData) {
	let src = '';
	if (typeof srcData === "object") {
		src = JSON.stringify(srcData);
	} else {
		src = srcData;
	}
	return CryptoJS.AES.encrypt(src, APP_SETTINGS.ENC_KEY).toString();
}

function decryptData(strSrc) {
	const decryptedBytes = CryptoJS.AES.decrypt(strSrc, APP_SETTINGS.ENC_KEY);
	return decryptedBytes.toString(CryptoJS.enc.Utf8);
}

function downloadFile(data, filename, type) {
	var file = new Blob([data], { type: type });
	if (window.navigator.msSaveOrOpenBlob) // IE10+
		window.navigator.msSaveOrOpenBlob(file, filename);
	else { // Others
		var a = document.createElement("a"),
			url = URL.createObjectURL(file);
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		setTimeout(function () {
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
		}, 0);
	}
}

function getAbbreviationOfUSAState(name) {
	for (let state of US_STATES) {
		if (state.name.toLowerCase() === name.toLowerCase()) {
			return state.abbreviation;
		}
	}
	return '';
}