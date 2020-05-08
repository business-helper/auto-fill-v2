const RST_MARKER = 'af-restock';
const RST_MARKER_START = 'RST-0';
const RST_MARKER_END = 'RST-1';

const RST_PATTERNS = {
    email: new RegExp("e.?mail|google\\s+account|gmail", "i"),
    first_name: new RegExp("first.*name|initials|fname|first$|given.*name", "i"),
    last_name: new RegExp("last.*name|lname|surname|last$|secondname|family.*name", "i"),
    full_name: new RegExp("^name|full.?name|your.?name|customer.?name|bill.?name|ship.?name" + "|name.*first.*last|firstandlastname", "i"),
    phone: new RegExp("phone|mobile|contact.?number|tel", "i"),
    address1: new RegExp("^address$|address[_-]?line(one)?|address1|addr1|street", "i"),
    address2: new RegExp("address[_-]?line(2|two)|address.?2|addr2|street.?(?:#|no|num|nr)|suite|unit", "i"),
    city: new RegExp("city|town", "i"),
    state: new RegExp("(?<!(united|hist|history).?)state|county|region|province", "i"),
    country: new RegExp("country|countries", "i"),
    zip_code: new RegExp("zip|postal|post.*code|pcode", "i"),
    card_name: new RegExp("card.?(?:holder|owner)|name.*(\\b)?on(\\b)?.*card", "i"),
    card_number: new RegExp("(add)?(?:card|cc|acct).?(?:number|#|no|num|field)|carn|credit.*?card.*?cnb|number", "i"),
    card_cvv: new RegExp(
        "verification|card.?identification|security.?code|card.?code"
        + "|security.?value"
        + "|security.?number|card.?pin|c-v-v"
        + "|(cvn|cvv|cvc|csc|cvd|cid|ccv|vval)(field)?"
        + "|\\bcid\\b", "i"),
    card_exp: new RegExp("expir|exp.*date|^expfield$", "i"),
    card_exp_mm: new RegExp("^\\s*MM\\s*$", "i"),
    card_exp_mmyy: new RegExp("^\\s*MM\\s*/\\s*YY\\s*$", "i"),
    card_exp_y2: new RegExp("^\\s*YY\\s*$", "i"),
    card_exp_y4: new RegExp("^\\s*YYYY\\s*$", "i"),
    card_exp_month: new RegExp("exp.*mo|ccmonth|card.?month|addmonth", "i"),
    card_exp_year: new RegExp("(?:exp|payment|card).*(?:year|yr)", "i"),
    // card_type: new RegExp("(credit)?card.*type", "i"),
    checkbox: new RegExp("(order)?.*?terms|(?:agree|consent).*?(checkbox)?", "i"),
    checkout: new RegExp("continue.*?shipping|continue.*?button|pay.*?|donat.*?|complete.*?order|continue.*?payment", "i"),
}

docReady(function () {

    document.addEventListener('scroll', function () {
        setTimeout(function() {
            try {
                chrome.extension.sendMessage({type: 'requestData'}, function(result) {
                    // console.log(result)
                    if (result.data) {
                        scanEelements(result.data);
                        setTimeout(processCheckout, 10);
                    }
                });
            } catch (e) { 

            }
        }, 400);
    });
    document.dispatchEvent(new CustomEvent('scroll'));
    // setTimeout(function () {
    //     // console.log(isDocumentLoadingComplete());
    //     scanEelements();
    //     setTimeout(function () {scanEelements();}, 1000);
    // }, 1500);
})

function isDocumentLoadingComplete() {
    return document.readyState === "interactive" || document.readyState === "complete";
}

function scanEelements(data) {
    // const data = {
    //     profile: {
    //         name: "Profile 1",
    //         address1: "address1",
    //         address2: "address2",
    //         email: "martinstevanovic000@gmail.com",
    //         phone: "13123",
    //         first_name: "first name",
    //         last_name: "last name",
    //         city: "city",
    //         country: "country",
    //         state: "state",
    //         zip_code: "115035",
    //         card_number: "4242424242424242",
    //         card_exp_mm: "10",
    //         card_exp_y4: "2023",
    //         card_cvv: "123",
    //     },
    //     customs: [
    //         { key: 'activation Token', value: "TOKEN 1" },
    //         { key: 'Discord Username', value: "Tai#0002" }
    //     ],
    //     settings: {
    //         autoFill: true,
    //         autoCheckout: true,
    //     }
    // }
    // input
    let inputs = document.getElementsByTagName('input');
    for (let input of inputs) {
        let instance = new AutoFillElement(input, data);
        instance.startAutoFill();
    }
    // textarea
    let textareas = document.getElementsByTagName('textarea');

    // select
    let selectboxes = document.getElementsByTagName('select');
    for (let input of selectboxes) {
        let instance = new AutoFillElement(input, result);
        instance.startAutoFill();
    }
}

class AutoFillElement {
    element;    // target element
    info;       // data source to autofill forms
    constructor(elem, info) {
        this.element = elem;
        this.info = info;
    }

    startAutoFill = function () {
        
        // check attribute
        if (!this.element) return false;
        const marker = this.element.getAttribute(RST_MARKER); //console.log(!!marker);
        if (!!marker && marker == RST_MARKER_END) { return false; } // already done

        this.element.setAttribute(RST_MARKER, RST_MARKER_START); // mark as initialized
        let autofilled = this.checkDefaultPattern();
        if (autofilled === false) {
            this.checkCustomMatches();
        }
    }

    checkDefaultPattern = function () {
        // priority: id, name, placeholder, label
        for (let str of this.getComparableStrings()) {
            for (let key in RST_PATTERNS) {
                if (!!str.match(RST_PATTERNS[key])) {
                    // if (key == 'card_exp_mmyy') {
                    //     console.log('[MATCH]', str, key, !!str.match(RST_PATTERNS[key]));
                    //     console.log(this.getProfileValue(key));
                    // }
                    return this.updateElementValue(this.getProfileValue(key));
                }
            }
        }
        return false;
    }

    checkCustomMatches = function () {
        for (let str of this.getComparableStrings()) {
            for (let custom of this.info.customs) {
                if (this.matchKeyword(str, custom.keyword)) {
                    console.log('[Custom match]', str, custom);
                    this.updateElementValue(custom.value);
                }
            }
        }
        return false;
    }

    getComparableStrings = function () {
        // id, name, placehodler, label
        let strArray = [];
        if (!!this.element.id) {
            strArray.push(this.element.id);
            const elementLabel = document.querySelector(`label[for="${this.element.id}"]`);
            if (!!elementLabel) {
                strArray.push(this.filterString(elementLabel.innerText));
            }
        }
        if (!!this.element.name) { strArray.push(this.element.name); }
        if (!!this.element.placeholder) { strArray.push(this.element.placeholder); }
        return strArray;
    }

    filterString = function (val) {
        const filterElementId = 'RST-AF-FILTER';
        let filterElement = document.getElementById(filterElementId);
        if (!filterElement) {
            filterElement = document.createElement('textarea');
            filterElement.style.position = 'fixed';
            filterElement.style.top = '-100%';
            filterElement.style.right = '-100%';
            filterElement.id = filterElementId;
            document.body.append(filterElement);
        }
        filterElement.innerHTML = val;
        return filterElement.value;
    }

    getProfileValue = function (key) {
        switch (key) {
            case "address1": case "address2": case "email": case "first_name": case "last_name":
            case "city": case "state": case "country": case "zip_code": case "card_number":
            case "card_exp_mm": case "card_exp_y4": case "card_cvv": case "phone":
                return this.info.profile[key];
            case "full_name":
                return `${this.info.profile['first_name']} ${this.info.profile['last_name']}`;
            case "card_exp_month": return this.info.profile['card_exp_mm'];
            case "card_exp_year": return this.info.profile['card_exp_y4'];
            case "card_exp": case "card_exp_mmyy": return this.info.profile['card_exp_mm'] + '/' + this.info.profile['card_exp_y4'].slice(2, 4);
            
            default:
                return "";
        }
    }

    matchKeyword = function (target, keyword) {
        try {
            target = target.toLowerCase();
            keyword = keyword.toLowerCase();
            if (target) {
                return target.includes(keyword);
            }
            return false;
        } catch (e) {
            console.log('[keyword] error', keyword)
        }

    }

    updateElementValue = function (val) {
        // console.log(val, this.element.tagName)
        if (!!val) {
            this.element.focus();
            this.element.value = val;
            this.element.blur();
            if (this.element.value == val) {
                this.element.setAttribute(RST_MARKER, RST_MARKER_END);
                return true;
            }
            return false;
        }
        return false;
    }
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

function processCheckout() {
	if (!isDocumentLoadingComplete()) return false;
	for (let button of document.querySelectorAll('button')) {
		attemptCheckout(button);
	}
	for (let submit of document.querySelectorAll('input[type="submit"]')) {
		attemptCheckout(submit);
	}
}

function attemptCheckout(elem) {
	// id, text, value
	const strId = elem.attributes['id'] ? elem.attributes['id'].value : '';
	const strText = elem.innerText || '';
	const strValue = elem.value || '';

	let regx = RST_PATTERNS.checkout;
	if (!validElement(elem)) return;

	if (!!strId && strId.match(regx)) {
		// dispatchClickEvent(elem);
		clickAutoPayButton(elem);
	} else if (!!strText && strText.match(regx)) {
		// dispatchClickEvent(elem);
		clickAutoPayButton(elem);
	} else if (!!strValue && strValue.match(regx)) {
		// dispatchClickEvent(elem);
		clickAutoPayButton(elem);
	}
}

function clickAutoPayButton(elem) {
    elem.click();
	// // check if button has form
	// if (elem.form && !elem.form.checkValidity()) return false;
	// if (elem && (!elem.attributes['af-clicked'] || window.getComputedStyle(elem.form).getPropertyValue("opacity") > 0)) {
	// 	elem.attributes['af-clicked'] = 'true';
	// 	elem.click();
	// }
}

function validElement() {
    return true;
}