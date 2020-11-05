const RST_MARKER = 'af-restock';
const RST_MARKER_START = 'RST-0';
const RST_MARKER_END = 'RST-1';
let storage = {};
let dataLoaded = false;
let customClickAttempts = 0;
let intervalInstance;
let operateCount = 0;

const RST_PATTERNS = {
    email: new RegExp("e.?mail|google\\s+account|gmail", "i"),
    first_name: new RegExp("first.*name|initials|fname|first$|given.*name", "i"),
    last_name: new RegExp("last.*name|lname|surname|last$|secondname|family.*name", "i"),
    full_name: new RegExp("^name|full.?name|your.?name|customer.?name|bill.*name|ship.?name" + "|name.*first.*last|firstandlastname", "i"),
    phone: new RegExp("phone|mobile|contact.?number|tel", "i"),
    city: new RegExp("city|town", "i"),
    zip_code: new RegExp("zip|postal|post.*code|pcode", "i"),
    country: new RegExp("country|countries", "i"),
    company: new RegExp("company", "i"),
    address1: new RegExp("^address$|address[_-]?line(one)?|address1|addr1|street", "i"),
    address2: new RegExp("address[_-]?line(2|two)|address.?2|addr2|street.?(?:#|no|num|nr)|suite|unit", "i"),
    address: new RegExp("bill.*addr", "i"),
    state: new RegExp("(?<!(united|hist|history).?)state|county|region|province|shipping.*state", "i"),
    card_name: new RegExp("card.?(?:holder|owner)|name.*(\\b)?on(\\b)?.*card", "i"),
    card_number: new RegExp("(add)?(?:card|cc|acct).?(?:number|#|no|num|field)|carn|credit.*?card.*?cnb|number", "i"),
    card_cvv: new RegExp(
        "verification|card.?identification|security.?code|card.?code"
        + "|security.?value"
        + "|security.?number|card.?pin|c-v-v"
        + "|(cvn|cvv|cvc|csc|cvd|cid|ccv|vval)(field)?"
        + "|\\bcid\\b", "i"),
    card_exp_mm: new RegExp("^\\s*MM\\s*$", "i"),
    card_exp_mmyy: new RegExp("^\\s*MM\\s*/\\s*YY\\s*$", "i"),
    card_exp_y2: new RegExp("^\\s*YY\\s*$", "i"),
    card_exp_y4: new RegExp("^\\s*YYYY\\s*$", "i"),
    card_exp_month: new RegExp("exp.*mo|ccmonth|card.?month|addmonth", "i"),
    card_exp_year: new RegExp("(?:exp|payment|card).*(?:year|yr)", "i"),
    card_exp: new RegExp("expir|exp.*date|^expfield$", "i"),
    checkbox: new RegExp("(order)?.*?terms|(?:agree|consent).*?(checkbox)?", "i"),
    checkout: new RegExp("continue.*?shipping|continue.*?button|pay.*?|donat.*?|complete.*?order|continue.*?payment", "i"),
}

const RSTEXTRA_PATTERNS = {
    checkbox: new RegExp("(order)?.*?terms|(?:agree|consent).*?(checkbox)?", "i"),
    checkout: new RegExp("continue.*?shipping|continue.*?button|pay.*?|donat.*?|complete.*?order|continue.*?payment", "i"),
    terms: new RegExp("agree.*?terms|agree.*?privacy|order.*terms", "i")
};

class AutoFillElement {
    // element = undefined;    
    // info = undefined;       
    constructor(elem, info) {
        this.element = elem;
        this.info = info;
    }

    startAutoFill() {
        // check attribute
        if (!this.element) return false;
        const marker = this.element.getAttribute(RST_MARKER); //console.log(!!marker);
        // if (!!marker && marker == RST_MARKER_END) { return false; } // already done

        // this.element.setAttribute(RST_MARKER, RST_MARKER_START); // mark as initialized
        let autofilled = this.checkDefaultPattern(); // console.log(autofilled);

        if (!autofilled) {
            return this.checkMath() || this.checkCustomMatches();
        }
    }

    checkDefaultPattern() {
        // priority: id, name, placeholder, label
        for (let str of this.getComparableStrings()) {
            for (let key in RST_PATTERNS) {
                if (!!str.match(RST_PATTERNS[key])) {
                    // if (key == "state") {
                    //     console.log('[firstName]', this.getComparableStrings(), this.element);
                    // }
                    // console.log('[default]', `key: ${key}, val: ${this.getProfileValue(key)}`);
                    this.element.setAttribute('af-key', key);
                    return this.updateElementValue(this.getProfileValue(key), key);
                }
            }
        }
        return false;
    }

    checkCustomMatches() {
        // console.log('[tagname]', this.element.tagName.toLowerCase());
        // if (this.element.tagName.toLowerCase() == 'select') {
        //     console.log('[SELECT can]', this.getComparableStrings(), this.element);
        // }
        if (this.info.customs !== undefined && typeof this.info.customs == 'object' && this.info.customs.length !== undefined && this.info.customs.length > 0) {
            for (let str of this.getComparableStrings()) {
                for (let custom of this.info.customs) {
                    if (custom.type === 'selector') continue;
                    if (custom.keyword == '(calculator)' && custom.value == '(calculator)' && !!str.replace(/[^-x()\d/*+.]/g, '')) {
                        const regX = /[^-x()\d/*+.]/g;
                        try {
                            let mathVal = eval(str
                                .replace(regX, '')
                                .replace(/[x]/g, '*'));
                            this.updateElementValue(mathVal, 'math');
                        } catch (e) {
                            // console.log('[calc error]', e);
                        }
                    } else if (this.matchKeyword(str, custom.keyword)) {
                        // console.log('[Custom match]', str, custom);
                        this.updateElementValue(custom.value, 'custom');
                    }
                }
            }
        }
        // for (let str of this.getComparableStrings()) {
        //     for (let custom of this.info.customs) {
        //         if (this.matchKeyword(str, custom.keyword)) {
        //             // console.log('[Custom match]', str, custom);
        //             this.updateElementValue(custom.value);
        //         }
        //     }
        // }
        return false;
    }

    getComparableStrings() {
        // id, name, placehodler, label
        // console.log('[here]');
        let strArray = [];
        if (!!this.element.placeholder) { strArray.push(this.element.placeholder); }
        if (!!this.element.id) {
            strArray.push(this.element.id);
            const elementLabel = document.querySelector(`label[for="${this.element.id}"]`);
            if (!!elementLabel) {
                strArray.push(this.filterString(elementLabel.innerText));
            }
        }
        if (!!this.element.name) { strArray.push(this.element.name); }
        try {
            // let labels = this.element.parentNode.getElementsByTagName('label'); //console.log(labels);
            // if (labels.length > 0) {
            //     strArray.push(labels[0].innerText)
            // }
            let all_children = this.element.parentNode.children;
            if (!!all_children && all_children.length > 0) {
                for (let element of all_children) {
                    if (element.tagName === 'LABEL') {
                        strArray.push(element.innerText);
                        break;
                    }
                }
            }
        } catch (e) {
            console.error('[get label]', e);
        }
        // if (this.element.tagName === 'SELECT') console.log(strArray);
        return strArray;
    }

    filterString(val) {
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

    getProfileValue(key) {
        switch (key) {
            case "address1": case "address2": case "email": case "first_name": case "last_name":
            case "city": case "state": case "country": case "zip_code": case "card_number":
            case "card_exp_mm": case "card_exp_y4": case "card_cvv": case "phone":
                return this.info && this.info.profile && !!this.info.profile[key] ? this.info.profile[key] : '';
            case "full_name":
                return `${this.info.profile['first_name']} ${this.info.profile['last_name']}`;
            case "address":
                return `${this.info.profile['address1']} ${this.info.profile['address2']}`.trim();
            case "card_exp_month": return this.info.profile['card_exp_mm'];
            case "card_exp_year": return this.info.profile['card_exp_y4'];
            case "card_exp": case "card_exp_mmyy": return this.info.profile['card_exp_mm'] + '/' + this.info.profile['card_exp_y4'].slice(2, 4);

            default:
                return "";
        }
    }

    matchKeyword(target, keyword) {
        try {
            target = target.toLowerCase();
            keyword = keyword.toLowerCase();
            if (target) {
                return target.includes(keyword);
            }
            return false;
        } catch (e) {
            console.log('[keyword] error', keyword)
            return false;
        }
    }

    updateElementValue(val, key = '') {
        if (!!val) {
            const marker = this.element.getAttribute(RST_MARKER);
            if (val.toLowerCase() === (this.element.value || "").toLowerCase()) {
                return true;
            }

            if (this.element.tagName !== undefined && this.element.tagName.toLowerCase() == 'select') {
                // if (key == 'state')  console.log(val, this.element);//this.element
                // console.log('[select]', val, key, this.element);
                // if (this.element.id == 'ShippingStateID') return;
                if (!!marker && marker == RST_MARKER_END && this.element.selectedIndex > 0) { return false; } // already done
                this.element.setAttribute(RST_MARKER, RST_MARKER_START); // mark as initialized
                try {
                    // this.element.click();
                    for (let option of this.element.options) {
                        if (
                            (option.value.toLowerCase() === val.toLowerCase()) || (option.text.toLowerCase() === val.toLowerCase()) ||
                            (key == 'state' && (option.value.toLowerCase() === getAbbreviationOfUSAState(val).toLocaleLowerCase()) || (option.text.toLowerCase() == getAbbreviationOfUSAState(val).toLowerCase()))
                        ) {
                            option.selected = true;
                            // console.log(option.value, option.text);
                            // this.element.value = option.value;
                            // option.click();
                            // option.dispatchEvent(new Event('click', {bubbles: true}))
                            this.element.dispatchEvent(new Event('change', { bubbles: true }));
                            this.element.dispatchEvent(new Event('blur', { bubbles: true }));
                            // await sleep(100);
                        }
                    }
                    // if (compareSelectValue(this.element.querySelector('option[selected]'), val) === true) {
                    if (compareSelectValue(this.element.options[this.element.selectedIndex], val, key) === true) {
                        this.element.setAttribute(RST_MARKER, RST_MARKER_END);
                        return true;
                    }
                    // this.element.blur();
                } catch (e) {
                    console.error('[update select value]', e);
                }
            } else if (this.element.type == 'checkbox') {
                if (!!marker && marker == RST_MARKER_END) { return false; } // already done
                this.element.setAttribute(RST_MARKER, RST_MARKER_START); // mark as initialized
                this.element.checked = true;
                this.element.dispatchEvent(new Event('change', { bubbles: true }));
                this.element.dispatchEvent(new Event('blur', { bubbles: true }))
                if (this.element.checked === true) {
                    this.element.setAttribute(RST_MARKER, RST_MARKER_END);
                    return true;
                }
            } else {
                if (!!marker && marker == RST_MARKER_END) { return false; } // already done
                this.element.setAttribute(RST_MARKER, RST_MARKER_START); // mark as initialized

                // fix address 2
                const afKey = this.element.getAttribute('af-key');
                if (!!afKey && afKey != key) return false;

                // console.log('[update input]', `key: ${key}, val: ${val}`);
                // this.element.focus();
                this.element.value = val;
                // this.element.dispatchEvent(new Event('change'));
                this.element.dispatchEvent(new Event('input', { bubbles: true }));
                this.element.dispatchEvent(new Event('blur', { bubbles: true }));
                // this.element.blur();
                if (this.element.value.toLowerCase() == val.toLowerCase()) {
                    this.element.setAttribute(RST_MARKER, RST_MARKER_END);
                    return true;
                }
            }
            return false;
        }
        return false;
    }

    checkMath() {
        const labels = this.getComparableStrings();
        // console.log(labels);
        // const regx = new RegExp('')
        const regMath = /math(\s)*[(]+.*[)]+/gi;
        let autofilled = false;
        for (let label of labels) {
            if (label.match(regMath)) {
                const regRemove = /math|(\s)+|[()]+/gi;
                const equation = label.replace(regRemove, '');
                const solver = new EqSolver(equation);
                const answer = solver.getAnswer();
                if (this.updateElementValue(answer.toString())) {
                    autofilled = true;
                }
            }
        }
        return autofilled;
    }
}

class EqSolver {
    constructor(eq_str) {
        this.str_equation = eq_str;
    }

    getAnswer() {
        if (this.str_equation.includes(',')) {
            return this.solveMultipleEq(this.str_equation);
        } else {
            return this.sovleSingleEq(this.str_equation);
        }
    }

    solveMultipleEq(str_src) {
        const eqArray = str_src.replace(/(\s)*/gi, '').split(',');
        let variables = {};
        let strFinalEq = "";
        for (let strEq of eqArray) {
            const res = this.checkUnitEq(strEq);
            if (res.final === true) {
                strFinalEq = strEq;
            } else if (res.key !== undefined && res.value !== undefined) {
                variables[res.key] = res.value;
            }
        }
        return this.calcFinalValue(strFinalEq, variables);
    }

    solveSingleEq(str_eq) {
        const regNoneEq = /[^-x()\d/*+.]/gi;
        try {
            let mathVal = eval(str_eq
                .replace(regNoneEq, '')
                .replace(/x/gi, '*'));

            return mathVal;
        } catch (e) {
            return 0;
        }
    }

    checkUnitEq(str) {
        if (str.includes('?')) {
            return { final: true };
        } else {
            if (!str.includes('=')) { return { final: false, error: 'no equal sign' }; }
            const strArray1 = str.split('=');
            try {
                const operator = strArray1[0].match(/[*+x]/gi)[0];
                const operands = strArray1[0].split(operator);

                if (operator == '+') {
                    return { final: false, key: operands[0], value: Number(strArray1[1]) / 2 };
                } else if (operator.match(/[*x]/gi)) {
                    return { final: false, key: operands[0], value: Math.sqrt(strArray1[1]) };
                }
            } catch (e) {
                return { final: false, error: e.message };
            }
        }
        return { final: false, error: 'defaut' };
    }

    calcFinalValue(str, variables) {
        // console.log('[calcFinalValue]', str, variables);
        for (let key in variables) {
            str = this.replaceAll(str, key, variables[key]);
        }
        return this.solveSingleEq(str);
    }

    replaceAll(str, search, value) {
        while (str.includes(search)) {
            str = str.replace(search, value);
        }
        return str;
    }
}

docReady(function () {
    // startMode1();
    // startMode2();
    // startMode3();
    chrome.extension.sendMessage({ type: 'requestData' }, function (result) {
        if (result.data) {
            storage = result.data;
            dataLoaded = true;
            // startWorkflowBatch(result.data);
            let settings = result.data.settings;
            if (settings.infiniteLoop !== undefined && settings.infiniteLoop === true) {
                startMode1();
            } else {
                startInfiniteMode();
            }            
        }
    });
})

function startMode1() {
    // console.log('[Hey Restock INtel]');
    console.log('[Mode] 1');
    setTimeout(function () {
        document.addEventListener('scroll', function () {
            console.log('scrolled', operateCount);
            setTimeout(function () {
                try {
                    customClickAttempts = 0;
                    chrome.extension.sendMessage({ type: 'requestData' }, function (result) {
                        if (result.data) {
                            // console.log(result.data);
                            storage = result.data;
                            startWorkflowBatch(result.data);
                        }
                    });
                } catch (e) {
                    // console.error(e);
                }
            }, 10);
        });
        intervalInstance = setInterval(() => {
            operateCount++;
            if (operateCount > 50) {
                clearInterval(intervalInstance);
                // operateCount = 0;
                return;
            }
            document.dispatchEvent(new CustomEvent('scroll'));
        }, 30)
        // document.dispatchEvent(new CustomEvent('scroll'));
    }, storage.settings.delay || 200);
}

function startMode2() {
    setTimeout(function () {
        document.addEventListener('scroll', function () {
            for (let i = 0; i < 20; i++) {
                chrome.extension.sendMessage({ type: 'requestData' }, function (result) {
                    if (result.data) {
                        storage = result.data;
                        startWorkflowBatch(result.data);
                    }
                })
            }
        });
        document.dispatchEvent(new CustomEvent('scroll'));
    }, 200);
}

function startMode3() {
    chrome.extension.sendMessage({ type: 'requestData' }, function (result) {
        if (result.data) {
            storage = result.data;
            startWorkflowBatch(result.data);
            if (checkAllFilled() === true) {
                console.log('[recursion] filled all!');
            } else {
                startMode3();
            }
            // startMode3();
        }
    })
}

function startInfiniteMode() {
    console.log('[infinite mode]');
    setTimeout(function () {
        document.addEventListener('scroll', function () {
            console.log('scrolled', operateCount);
            setTimeout(function () {
                try {
                    customClickAttempts = 0;
                    chrome.extension.sendMessage({ type: 'requestData' }, function (result) {
                        if (result.data) {

                            storage = result.data;
                            startWorkflowBatch(result.data);
                        }
                    });
                } catch (e) {
                    console.error(e);
                }
            }, 10);
        });
        document.dispatchEvent(new CustomEvent('scroll'));
        // document.dispatchEvent(new CustomEvent('scroll'));
    }, storage.settings.delay || 200);
}

function startWorkflowBatch(data) {
    // console.log('[startWorkflowBatch]', data);
    // scan element, custom, 
    // custom click, autocheckout
    if (!data || !data.activation) {
        return false;
    }
    // console.log(!!data && !!data.settings && data.settings.autoFill !== undefined && data.settings.autoFill === true)
    if (!!data && !!data.settings && data.settings.autoFill !== undefined && data.settings.autoFill === true) {
        scanElements(data);  //!
    }

    // start custom-autofill by selector
    if (storage.customs && storage.customs.length) {
        for (let custom of storage.customs) {
            if (custom.type === 'keyword') continue;
            // console.log('[selector custom]', custom);
            try {
                const element = document.querySelectorAll(custom.keyword)[0]; //console.log('[selector element]', element);
                if (element.tagName.toLowerCase() === 'select') {
                    autofillSelect(element, custom.value);
                } else {
                    autofill(element, custom.value);
                }
            }catch (e) {}
        }
    }

    AgreeTerms();
    // setTimeout(function () {
    // custom clicks
    if (!!data && !!data.autoclicks && data.autoclicks.length > 0) {
        processCustomClicks(data.autoclicks);
    }
    // autocheckout
    if (!!data && !!data.settings && data.settings.autoCheckout !== undefined && data.settings.autoCheckout === true) {
        // setTimeout(processCheckout, 100);
        processCheckout();
    }
    // }, 500);
}

async function processCustomClicks(autoclicks) {
    // if (customClickAttempts > 10) return;
    customClickAttempts++;
    autoclicks.forEach(async function (ac) {
        if (window.location.href.includes(ac.domain)) {
            // console.log(ac);
            ac.clicks.forEach(async function (click) {
                if (click.type === 'keyword') {
                    for (let button of document.querySelectorAll('button')) {
                        searchButtonAndClick(button, click.keyword);
                    }
                    for (let submit of document.querySelectorAll('input[type="submit"]')) {
                        searchButtonAndClick(submit, click.keyword);
                    }
                    for (let submit of document.querySelectorAll('a')) {
                        searchButtonAndClick(submit, click.keyword);
                    }
                } else if (click.type === 'selector') {
                    try {
                        const element = document.querySelectorAll(click.keyword)[0];
                        const elementMarker = element.getAttribute(RST_MARKER) || "";
                        if (element.getAttribute(RST_MARKER) !== RST_MARKER_END) {
                            element.click();
                            element.setAttribute(RST_MARKER, RST_MARKER_START);
                        }
                    } catch (e) {}
                } else if (click.type === 'refresh') {
                    console.log('[sleep]', click.keyword);
                    await sleep(Number(click.keyword) || 100);
                } else {}
            });
        }
    });
}

function isDocumentLoadingComplete() {
    return document.readyState === "interactive" || document.readyState === "complete";
}

function scanElements(data) {
    // input
    let inputs = document.getElementsByTagName('input'); //console.log(inputs.length);
    for (let element of inputs) {
        // if (!validElement(element)) continue;
        let instance = new AutoFillElement(element, data);
        instance.startAutoFill();
    }
    // textarea
    let textareas = document.getElementsByTagName('textarea');
    for (let element of textareas) {
        // if (!validElement(element)) continue;
        let instance = new AutoFillElement(element, data);
        instance.startAutoFill();
    }
    // select
    let selectboxes = document.getElementsByTagName('select'); //console.log('[select box]', selectboxes);
    for (let element of selectboxes) {
        // if (!validElement(element)) continue;
        let instance = new AutoFillElement(element, data);
        instance.startAutoFill();
    }
    // window.scrollTo(0, 0);
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

// auto click
function searchButtonAndClick(elem, text) {

    // id, text, value
    const strText = elem.innerText || '';
    const strValue = elem.value || '';

    // console.log(strText, strValue || 'val', text, validElement(elem));
    // if (!validElement(elem)) return;
    // check background-color and color are different
    color = window.getComputedStyle(elem).getPropertyValue("color");
    bkColor = window.getComputedStyle(elem).getPropertyValue("background-color");
    if (color == bkColor) return;

    if (!!strText && strText.toLowerCase().includes(text.toLowerCase())) {
        clickAutoPayButton(elem);
        // setTimeout(() => processCustomClicks(storage.autoclicks), 300);
    } else if (!!strValue && strValue.toLowerCase().includes(text.toLowerCase())) {
        clickAutoPayButton(elem);
        // setTimeout(() => processCustomClicks(storage.autoclicks), 300);
    }
}

function processCheckout() {
    // console.log('[processCheckout]');
    if (!isDocumentLoadingComplete()) return false;
    // console.log('[processCheckout1]');
    for (let button of document.querySelectorAll('button')) {
        attemptCheckout(button);
    }
    for (let submit of document.querySelectorAll('input[type="submit"]')) {
        attemptCheckout(submit);
    }
    // window.scrollTo(0, 0);
}

function attemptCheckout(elem) {
    // console.log(elem);
    // id, text, value
    const strId = elem.attributes['id'] ? elem.attributes['id'].value : '';
    const strText = elem.innerText || '';
    const strValue = elem.value || '';

    let regx = RST_PATTERNS.checkout;

    if (!!strId && strId.match(regx)) {
        // dispatchClickEvent(elem);
        clickAutoPayButton(elem);
    } else if (!!strText && strText.match(regx)) {
        console.log('text matched!');
        // dispatchClickEvent(elem);
        clickAutoPayButton(elem);
    } else if (!!strValue && strValue.match(regx)) {
        // dispatchClickEvent(elem);
        clickAutoPayButton(elem);
    }
}

function clickAutoPayButton(elem) {
    if (!validElement(elem)) {
        // console.log('[checkout] return - invalid');
        setTimeout(function() {
            clickAutoPayButton(elem);
        }, 100);
        return;
    } 
    if (elem.getAttribute(RST_MARKER) === RST_MARKER_END) return;

    if (elem.form && !elem.form.checkValidity()) return false;
    elem.setAttribute(RST_MARKER, RST_MARKER_START);
    elem.click();
    console.log('[auto-checkout]', elem);
    if (!validElement(elem)) {
        elem.setAttribute(RST_MARKER, RST_MARKER_END);
    }
}

function validElement(elem) {
    // console.log('[autocheckout]', elem);
    // console.log(elem, {
    //     elem: !!elem,
    //     visible: isVisible(elem),
    //     viewport: elementInViewport(elem),
    //     enable: !isDisabled(elem),
    //     isParentFormTransparent: !isParentFormTransparent(elem)
    // });
    return elem && isVisible(elem) && elementInViewport(elem) && !isDisabled(elem) && !isParentFormTransparent(elem);//
}

function isVisible(elem) {
    return elem.offsetWidth > 0 && elem.offsetHeight > 0;
}

function elementInViewport(el) {
    //https://stackoverflow.com/questions/123999/how-can-i-tell-if-a-dom-element-is-visible-in-the-current-viewport
    var top = el.offsetTop;
    var left = el.offsetLeft;
    var width = el.offsetWidth;
    var height = el.offsetHeight;

    while (el.offsetParent) {
        el = el.offsetParent;
        top += el.offsetTop;
        left += el.offsetLeft;
    }

    return (
        top >= window.pageYOffset &&
        left >= window.pageXOffset &&
        (top + height) <= (window.pageYOffset + window.innerHeight) &&
        (left + width) <= (window.pageXOffset + window.innerWidth)
    );
}

function isDisabled(elem) {
    return elem.disabled;
}

function isParentFormTransparent(elem) {
    if (elem.form) {
        const parent_opacity = window.getComputedStyle(elem.form).getPropertyValue("opacity");
        return Number(parent_opacity) === 0 ? true : false;
    }
    return false;
}

async function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true)
        }, time);
    })
}

function compareSelectValue(option, val = '', key = '') {
    if (!option) return false;
    if (
        option.value.toLowerCase() == val.toLowerCase() ||
        option.text.toLowerCase() == val.toLowerCase() ||
        (key == 'state' && (option.value.toLowerCase() == getAbbreviationOfUSAState(val).toString().toLowerCase()) || (option.text.toLowerCase() == getAbbreviationOfUSAState(val).toString().toLowerCase()))
    ) {
        return true;
    }
    return false;
}

function checkAllFilled() {
    const matchInputs = document.querySelectorAll(`input[${RST_MARKER}]`).length;
    const matchInputsFilled = document.querySelectorAll(`input[${RST_MARKER}="${RST_MARKER_END}"]`).length;

    const matchSelects = document.querySelectorAll(`select[${RST_MARKER}]`).length;
    const matchSelectsFilled = document.querySelectorAll(`select[${RST_MARKER}="${RST_MARKER_END}"]`).length;
    console.log(matchInputs, matchSelectsFilled, matchSelects, matchSelectsFilled);
    return (matchInputs > 0 || matchSelects > 0) && (matchInputs === matchInputsFilled) && (matchSelects === matchSelectsFilled);
}

function calculateMath(strFormula) {
    var str = strFormula.replace(/[^-()\d/*+.]/g, '');
    return eval(str);
}

function AgreeTerms() {
    let labels = document.getElementsByTagName('label');
    for (let label of labels) {
        if (label.getAttribute(RST_MARKER) == RST_MARKER_END) continue;
        if (!!label.textContent.match(RSTEXTRA_PATTERNS.terms)) {
            label.click();
            label.setAttribute(RST_MARKER, RST_MARKER_END);
        }
    }
    let checkboxes = document.querySelectorAll(`input[type="checkbox"]`);
    for (let checkbox of checkboxes) {
        const id = checkbox.id;
        const name = checkbox.name;

        if (RSTEXTRA_PATTERNS.terms.test(id) || RSTEXTRA_PATTERNS.terms.test(name)) {
            if (!checkbox.checked) checkbox.click();
        }
    }
}

function autofill(element, val) {
    persistentAutofill2(element, val); return;
    let evt = document.createEvent("HTMLEvents");
    evt.initEvent("change", true, false);
    element.focus();
    element.value = val;
    element.dispatchEvent(evt);
    element.blur();
}

function autofillSelect(select, val) {
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].text.toLowerCase() == val.toLowerCase() || select.options[i].value.toLowerCase() == val.toLowerCase()) {
            select.selectedIndex = i;
            return true;
        }
    }
    return false;
}

// @checked
async function persistentAutofill2(element, val) {
    if (element != null) {
        element.click();
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", true, false);
        element.focus();
        element.value = val;
        element.dispatchEvent(evt);
        element.blur();
        var evt = new Event("input", { bubbles: true, cancelable: true });
        element.dispatchEvent(evt);
    } else {
        var interval = setInterval(function () {

            if (element != null) {
                element.click();
                var evt = document.createEvent("HTMLEvents");
                evt.initEvent("change", true, false);
                element.focus();
                element.value = val;
                element.dispatchEvent(evt);
                element.blur();
                var evt = new Event("input", { bubbles: true, cancelable: true });
                element.dispatchEvent(evt);
                clearInterval(interval);
            }

        }, 10);
    }
}
