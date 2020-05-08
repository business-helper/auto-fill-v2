const APP_SETTINGS = {
	auth_recheck: false,
	auth_endpoint: "https://www.restockintel.com/api/v1",
	auth_key: 'ak_VMwyTncV95jssx8DS-2C',
	ENC_KEY: 'RESTOCK$$!WITH*(TAI:)',
}

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
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}
