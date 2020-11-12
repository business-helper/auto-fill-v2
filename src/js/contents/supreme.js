let _product, storage;

const ptn_category = new RegExp('supremenewyork.com/shop/all/[a-z0-9_-]+', 'i');
const ptn_product = new RegExp('supremenewyork.com/shop/[a-z0-9_-]+/[a-z0-9]+', 'i');
const ptn_checkout = new RegExp('supremenewyork.com/checkout', 'i');
const productCategories = [
  { name: "jackets", token: "all/jackets" },
  { name: "shirts", token: "all/shirts" },
  { name: "tops/sweaters", token: "all/tops_sweaters" },
  { name: "sweatshirts", token: "all/sweatshirts" },
  { name: "pants", token: "all/pants" },
  { name: "shorts", token: "all/shorts" },
  { name: "hats", token: "all/hats" },
  { name: "bags", token: "all/bags" },
  { name: "accessories", token: "all/accessories" },
  { name: "shoes", token: "all/shoes" },
  { name: "skate", token: "all/skate" },
];

const tpm = 2000;
console.log('[Supreme scripts] loaded');

chrome.storage.local.get(["supreme", "data"], function (data) {
  console.log(data);
  storage = data.data || null;
  _product = data.supreme || null;
  startAction();
});

chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
  console.log('action', msg.action);
  if (window.location.href.includes('supremenewyork.com') && msg.action === 'URL_CHANGED') {
    startAction();
  } else if (ptn_product.test(window.location.href) && msg.action === "SUPREME_ATC") {
    // click check out
    console.log('[Now okay to checkout]'); // dev only
    try {
      document.querySelector('.button.checkout').click();
    } catch (e) {}
  }
});

// chrome.extension.sendMessage({ type: "requestData" }, function (result) {
//   if (result.data) {
//     storage = result.data;
//     dataLoaded = true;
//     let settings = result.data.settings;
//     // console.log(result.data);
//     const { profile } = result.data;
//     // fillCheckoutForm(profile);
//   }
// });


async function startAction() {
  console.log('[New Action]'); // dev only
  const current_location = window.location.href;
  if (ptn_category.test(current_location)) {
    selectProduct();
  } else if (ptn_product.test(current_location)) {
    processOneProduct();
  } else if (ptn_checkout.test(current_location)) {
    fillCheckoutForm(storage.profile);
  }
}

async function selectProduct() {
  console.log("[Let's select proudct!]"); // dev only
  const containerElem = document.getElementById('container');
  const productElems = containerElem.querySelectorAll('li');
  console.log(`[Found] ${productElems.length} products`); // dev only

  let products = [];

  // check the exact match
  for (let productElem of productElems) {
    const soldout = productElem.querySelector('.sold_out_tag');
    if (soldout) continue;
    const prodName = productElem.querySelector('.product-name .name-link').innerText;
    const prodStyle = productElem.querySelector('.product-style .name-link').innerText;
    const nameMatch = checkMatchWithKeywords(prodName, _product.keyword);
    const styleMatch = checkMatchWithKeywords(prodStyle, _product.style);

    if (nameMatch && styleMatch) {
      productElem.querySelector('.name-link').click(); return;
    }

    products.push({
      name: prodName,
      style: prodStyle,
      match: {
        name: nameMatch,
        style: styleMatch
      },
      element: productElem
    });
  }
  
  // check random match
  const nameMatches = products.filter(product => product.match.name); 
  if (nameMatches.length > 0 && _product.random_style) {
    console.log('[Found random match]', nameMatches[0].name, nameMatches[0].element);
    const randIdx = myRand(0, nameMatches.length);
    nameMatches[randIdx].element.querySelector('.name-link').click(); return;
  } else {
    console.log('[will refresh]'); // return; // dev only
    const [category] = productCategories.filter(cate => cate.name === _product.category);
    setTimeout(function() {
      window.location.href = `https://www.supremenewyork.com/shop/${category.token}`;
    }, 1000);    
  }
}

async function processOneProduct() {
  console.log("[Process and add to cart!]"); // dev only
  sendBGMessage('remember.supreme.atc', {});
  // check if item is sold out
  const stylesElem = document.querySelector('.styles');
  const selectedItem = stylesElem.querySelector('button.selected')
  const soldout = selectedItem.getAttribute('data-sold-out');
  if (soldout === 'true') {
    const availables = document.querySelectorAll('.styles li button:not(.selected)[data-sold-out="false"]');
    if (availables.length === 0) {
      alert('All sold out in this product!');
    } else {
      const randIdx = myRand(0, availables.length);
      availables[randIdx].click();
    }
  }

  if (document.querySelectorAll('.button.in-cart').length > 0) {
    document.querySelector('.button.checkout').click();
  }

  // select size;
  const sizeElem = document.getElementById('s');
  const selected = autofillSelect(sizeElem, _product.size);
  if (!selected) {
    sizeElem.selectedIndex = 0;
  }

  // click add to cart
  document.querySelector('input[value="add to cart"]').click();
}

async function fillCheckoutForm(profile) {
  // console.log('[storage]', storage);
  // console.log("[profile]", profile);
  var elements = document.getElementsByTagName("input");
  for (var i = 0; i < elements.length; i++) {
    if (elements[i].getAttribute("placeholder") != null) {
      if (elements[i].getAttribute("placeholder").trim().toLowerCase() == "name") {
        await typefill(elements[i], profile.first_name + " " + profile.last_name);
      } else if (elements[i].getAttribute("placeholder").trim().toLowerCase() == "full name") {
        await typefill(elements[i], profile.first_name + " " + profile.last_name);
      } else if (elements[i].getAttribute("placeholder").trim().toLowerCase() == "email") {
        await typefill(elements[i], profile.email);
      } else if (elements[i].getAttribute("placeholder").trim().toLowerCase() == "address") {
        await typefill(elements[i], profile.address1);
      } else if (elements[i].getAttribute("placeholder").trim().toLowerCase() == "address 2") {
        await typefill(elements[i], profile.address2);
      } else if (elements[i].getAttribute("placeholder").trim().toLowerCase() == "tel") {
        await typefill(elements[i], profile.phone);
      } else if (elements[i].getAttribute("placeholder").trim().toLowerCase() =="apt, unit, etc") {
        await typefill(elements[i], profile.address2);
      } else if (elements[i].getAttribute("placeholder").trim().toLowerCase() == "city") {
        await typefill(elements[i], profile.city);
      } else if (elements[i].getAttribute("placeholder").trim().toLowerCase() == "zip") {
        await typefill(elements[i], profile.zip_code);
      } else if (elements[i].getAttribute("placeholder").trim().toLowerCase() == "postcode") {
        await typefill(elements[i], profile.zip_code);
      } else if (elements[i].getAttribute("placeholder").trim().toLowerCase() == "number") {
        await typefill(elements[i], profile.card_number);
      } else if (elements[i].getAttribute("placeholder").trim().toLowerCase() == "cvv") {
        await typefill(elements[i], profile.card_cvv);
      } else if (elements[i].getAttribute("type").trim().toLowerCase() == "checkbox") {
        elements[i].checked = true;
      }
    }
  }

  if (profile.country == "United States") {
    autofill(document.querySelector("#order_billing_country"), "USA");
    document.querySelector("#order_billing_state").value = getState(profile.state);
  } else if (profile.country == "Canada") {
    autofill(document.querySelector("#order_billing_country"), "CANADA");
    document.querySelector("#order_billing_state").value = abbrRegion(
      profile.state,
      "abbr"
    );
  } else if (profile.country == "United Kingdom") {
    console.log("Owo");
    autofillSelect(document.querySelector("#order_billing_country"), "UK");
    var evt = new Event("change", { bubbles: true, cancelable: false });
    document.querySelector("#order_billing_country").dispatchEvent(evt);
  } else {
    autofillSelect(
      document.querySelector("#order_billing_country"),
      profile.country
    );
    var evt = new Event("change", { bubbles: true, cancelable: false });
    document.querySelector("#order_billing_country").dispatchEvent(evt);
  }

  document.querySelector("#credit_card_month").value = profile.card_exp_mm;
  document.querySelector("#credit_card_year").value = profile.card_exp_y4;

  $(".icheckbox_minimal").addClass("checked");
  $('input[name$="order[terms]"]').val("1");
  $('input[name$="store_address"]').val("1");

  const btnPayment = document.querySelector('input[value="process payment"]');
  if (btnPayment) { btnPayment.click(); }
}

function getState(val) {
  const randIdx = myRand(0, US_STATES.length);
  const [state] = US_STATES.filter((st) => st.name.toLowerCase() == val.toLowerCase() || st.abbreviation.toLowerCase() == val.toLowerCase());
  return state ? state.abbreviation : US_STATES[randIdx].abbreviation;
}

async function intervalSleep(tpm) {
  // const rand = 1; // randommyRand(0.9, 1.1);
  // const ms = Math.floor( 60000 * rand / tpm); // miliseconds
  const delay = Number(_product.key_delay || 20); 
  return sleep(delay);
}

function myRand(from, to) {
  const delta = to - from;
  return from + delta * Math.random();
}

async function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
}

async function typefill(element, val) {
    const arr = Array((val || "").length);
    const length = (val || "").length;
    for (let i = 0; i < length; i ++) {
      autofill(element, val.substr(0, i + 1));
      await intervalSleep(tpm);
    }
}

function autofill(element, val) {
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

function sendBGMessage(type, data = {}) {
  chrome.extension.sendMessage({ ...data, type }, function (result) {
    console.log('[Msg from bg]', result); // dev only
  });
}

function parseKeyword(str_keyword) {  
  if (str_keyword.length > 0 && (str_keyword.charAt(0) !== '+' && str_keyword.charAt(0) !== '-')) {
    str_keyword = '+' + str_keyword;
  }
  if (str_keyword) {
    str_keyword = str_keyword.toLowerCase();
  }

  // get plus keywords
  let keywords = { plus: [], minus: [] };
  let plus_array = str_keyword.split('+');
  for (let chunk of plus_array) {
    let chunk_array = chunk.split('-');
    if (chunk_array.length > 0 && !!chunk_array[0]) {
      keywords.plus.push(chunk_array[0]);
    }
  }

  let minus_array = str_keyword.split('-');
  for (let chunk of minus_array) {
    let chunk_array = chunk.split('+');
    if (chunk_array.length > 0 && !!chunk_array[0]) {
      keywords.minus.push(chunk_array[0]);
    }
  }
  return keywords;
}

function checkMatchWithKeywords(content, str_keyword) {
  content = content.toLowerCase();
  
  if (!str_keyword || str_keyword.trim().length === 0) return true;
  let keywords = parseKeyword(str_keyword.toLowerCase());

  if (keywords.length === 0) return true;

  // check negative keyword
  if (keywords.minus.length > 0) {
    for (let kwd of keywords.minus) {
      if (content.includes(kwd)) {
        return false;
      }
    }
  }

  // check positive keyword
  if (keywords.plus.length > 0) {
    for (let kwd of keywords.plus) {
      if (content.includes(kwd)) {
        return true;
      }
    }
  }

  return false;
}

function myRand(min, max) {
  return Math.floor(min + (max - min) * Math.random());
}
