const tpm = 2000;

chrome.extension.sendMessage({ type: "requestData" }, function (result) {
  if (result.data) {
    storage = result.data;
    dataLoaded = true;
    let settings = result.data.settings;
    // console.log(result.data);
    const { profile } = result.data;
    fillCheckoutForm(profile);
  }
});

async function fillCheckoutForm(profile) {
  console.log('[storage]', storage);
  console.log("[profile]", profile);
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

  // chrome.storage.local.get(["supremeaco"], function (acoData) {
  //   if (acoData.supremeaco) {
  //     chrome.storage.local.get(["supremedelay"], function (delayData) {
  //       if (delayData.supremedelay == null) {
  //         console.log("Checking out...");
  //         setTimeout(function () {
  //           document.getElementsByName("commit")[0].click();
  //         }, 100);
  //       } else {
  //         setTimeout(function () {
  //           document.getElementsByName("commit")[0].click();
  //         }, parseInt(delayData.supremedelay));
  //       }
  //     });
  //   }
  // });
}

function getState(val) {
  const randIdx = myRand(0, US_STATES.length);
  const [state] = US_STATES.filter((st) => st.name.toLowerCase() == val.toLowerCase() || st.abbreviation.toLowerCase() == val.toLowerCase());
  return state ? state.abbreviation : US_STATES[randIdx].abbreviation;
}

async function intervalSleep(tpm) {
  // const rand = 1; // randommyRand(0.9, 1.1);
  // const ms = Math.floor( 60000 * rand / tpm); // miliseconds
  const delay = Number(storage.settings.delays.supreme_key || 20); 
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
