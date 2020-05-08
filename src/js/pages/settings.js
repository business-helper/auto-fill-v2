
docReady(function () {
    loadData();
    checkAuthAndExist(); // toggle auth

    document.getElementById('profile_names').addEventListener('change', function () {
        const value = this.value;
        chrome.storage.local.get(["data"], function (store) {
            if (!store || !store.data) return;
            let profile = {};
            for (let prf of store.data.profiles) {
                // console.log('[]', prf.name, value)
                if (prf.name == value) {
                    store.data.profile = prf;
                    chrome.storage.local.set({ data: store.data }, function () {
                        loadData();
                    })
                }
            }
        });
    });

    // profile settings
    document.getElementById('export-profile').addEventListener('click', function (e) {
        e.preventDefault();
        chrome.storage.local.get(["data"], function (result) {
            if (result && result.data.profiles) {
                const profiles = result.data.profiles;
                const exportData = {
                    profiles: result.data.profiles,
                    profile: result.data.profile,
                }
                let encrypted = encryptData(exportData);
                // console.log(encrypted);
                downloadFile(encrypted, 'profiles.RIp', 'text/plain');
            } else {

            }
        })
    });

    document.getElementById('import-profile').addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('import-file').click();
    })

    document.getElementById('import-file').addEventListener('change', function (e) {
        e.preventDefault();
        if (this.files.length > 0) {
            const reader = new FileReader();
            reader.onload = function (event) {
                try {
                    const strData = decryptData(event.target.result);
                    const data = JSON.parse(strData);
                    saveProfileImport(data);
                } catch (err) { showAlertModal('Sorry, but something went wrong!') }
            }
            reader.readAsText(this.files[0])
        }
    })

    document.getElementById('btn-save-profile').addEventListener('click', function (e) {
        e.preventDefault();
        if (validateForm() === false) {
            showAlertModal('Please fill all the fields!')
            return;
        }
        const formData = getFormData();
        saveProfile(formData);
    });

    document.getElementById('btn-remove-profile').addEventListener('click', function (e) {
        e.preventDefault();
        chrome.storage.local.get(['data'], function (store) {
            if (store && store.data && store.data.profiles) {
                const current_profile = document.getElementById('profile_names').value;
                let newProfiles = [];
                store.data.profiles.forEach(function (profile) {
                    if (profile.name != current_profile) {
                        newProfiles.push(profile);
                    }
                    store.data.profile = newProfiles.length && newProfiles.length > 0 ? newProfiles[0] : null;
                    store.data.profiles = newProfiles;
                    chrome.storage.local.set({ data: store.data }, function () {
                        showAlertModal('Data has been removed successfully!');
                        loadData();
                    })
                })
            }
        })
    })

    document.getElementById('btn-new-profile').addEventListener('click', function () {
        document.getElementById('profile_names').value = -1;
        const form = document.getElementById('profile_setting');
        form.querySelectorAll('input').forEach(function (input) {
            input.value = '';
        })
    })

    // add custom keywords
    document.getElementById('add-custom').addEventListener('click', function () {
        addCustomItem()
    })

    document.querySelectorAll('.remove-custom').forEach(function (removeBtn) {
        removeBtn.addEventListener('click', function () {
            console.log('wanna remove?');
            this.parentNode.remove();
        })
    })

    document.getElementById('save-customs').addEventListener('click', function () {
        saveCustomKeywords();
    })

    $('#domain-container').on('click', '.domain-wrapper .click-icon.plus', function() {
        addDomainClick();
    })
    $('#domain-container').on('click', '.domain-wrapper .click-icon.trash', function() {
        $(this).closest('.one-domain').remove();
    })
    $('#domain-container').on('click', '.one-click .click-icon.plus', function() {
        let template = `
        <div class="one-click">
            <input class="form-control" placeholder="Click"/>
            <img class="click-icon plus" src="../images/plus.png" />
            <img class="click-icon trash" src="../images/trash.png" />
        </div>`;
        $(this).closest('.click-array').append(template);
    })
    $('#domain-container').on('click', '.one-click .click-icon.trash', function() {
        $(this).closest('.one-click').remove();
    })
    $('#save-custom-clicks').on('click', function() {
        saveCustomClick();
    })
    $('#add-custom-click').on('click', function() {
        addDomainClick();
    })
})

function loadData() {
    $('input').each(function(i, input) {
        $(input).val('');
    })
    chrome.storage.local.get(["data"], function (result) {
        console.log('[loadData]', result);
        if (result && result.data) {
            if (result.data.profile) {
                fillProfileForm(result.data.profile);
                fillProfilesSelect(result.data);
            }
            if (result.data.activation) {
                fillActivationSection(result.data.activation);
            }
            if (result.data.customs) {
                result.data.customs.forEach(function (custom) {
                    addCustomItem(custom.keyword, custom.value);
                })
            }
            if (result.data.autoclicks) {
                updateAutoClickSection(result.data.autoclicks);
            }
        } else {
            fillProfilesSelect({profiles: []});
        }
        setToggleSection(result && result.data ? result.data.settings || {} : {});
    })
}

// save profile data to profiles[]
function saveProfile(profile) {
    chrome.storage.local.get(["data"], function (result) {
        let data = {};
        let profiles = [];

        if (result && result.data) {
            data = result.data;
        }
        if (data && data.profiles) {
            profiles = data.profiles;
        }

        // seek the existing profile with profile_name
        const position = checkSavedProfileWithSameName(profiles, profile);
        if (position > -1) {
            profiles[position] = profile;
        } else {
            profiles.push(profile);
        }
        data.profiles = filterProfile(profiles);
        data.profile = profile;

        chrome.storage.local.set({ data: data }, function () {
            showAlertModal('Data has been successfully saved!');
            loadData();
        });
    });
}

function validateForm() {
    requiredFields = document.querySelectorAll('input[required]');
    for (let required of requiredFields) {
        if (!required.value) return false;
    }
    return true;
}

function getFormData() {
    let data = {
        name: document.getElementById('profile-name').value.trim(),
        email: document.getElementById('email').value.trim(),
        first_name: document.getElementById('first-name').value.trim(),
        last_name: document.getElementById('last-name').value.trim(),
        address1: document.getElementById('address1').value.trim(),
        address2: document.getElementById('address2').value.trim(),
        city: document.getElementById('city').value.trim(),
        country: document.getElementById('country').value.trim(),
        state: document.getElementById('state').value.trim(),
        zip_code: document.getElementById('zipcode').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        card_number: document.getElementById('card-number').value.trim(),
        card_exp_mm: document.getElementById('month').value.trim(),
        card_exp_y4: document.getElementById('year').value.trim(),
        card_cvv: document.getElementById('cvv').value.trim(),
    };
    return data;
}

/**
 * @description check profile exists in profiles array
 */
function checkSavedProfileWithSameName(profiles, profile) {
    if (typeof profiles == 'object' && profiles.length > 0) {
        for (let i = 0; i < profiles.length; i++) {
            if (profiles[i].name === profile.name) return i;
        }
    }
    return -1;
}

function fillProfilesSelect(data) {
    let optionsHTML = '';
    for (let profile of data.profiles) {
        const selected = profile.name == data.profile.name ? 'selected' : '';
        optionsHTML += `<option value="${profile.name}" ${selected}>${profile.name}</option>`;
    }
    const select = document.getElementById('profile_names');
    if (data.profiles.length === 0) {
        optionsHTML = `<option value="-1">No profiles</option>`;
    } else {
        optionsHTML = `<option value="-1" disabled>Select profile...</option>` + optionsHTML;
    }
    select.innerHTML = optionsHTML;
}

/**
 * @description fill the profile form with the given data
 */
function fillProfileForm(profile) {
    document.getElementById('profile-name').value = profile.name;
    document.getElementById('email').value = profile.email;
    document.getElementById('first-name').value = profile.first_name;
    document.getElementById('last-name').value = profile.last_name;
    document.getElementById('address1').value = profile.address1;
    document.getElementById('address2').value = profile.address2;
    document.getElementById('city').value = profile.city;
    document.getElementById('country').value = profile.country;
    document.getElementById('state').value = profile.state;
    document.getElementById('zipcode').value = profile.zip_code;
    document.getElementById('phone').value = profile.phone;
    document.getElementById('card-number').value = profile.card_number;
    document.getElementById('month').value = profile.card_exp_mm;
    document.getElementById('year').value = profile.card_exp_y4;
    document.getElementById('cvv').value = profile.card_cvv;
}

// filter profile with new rule
function filterProfile(profiles) {
    if (typeof profiles == 'object') {
        let filtered = [];
        for (let profile of profiles) {
            filtered.push(profile);
        }
        return filtered;
    }
    return profiles;
}

/** Check if user already is authorized, if not, close self tab */
function checkAuthAndExist() {
    return true;
    chrome.storage.local.get(["data"], function (store) {
        if (store && store.data && store.data.activation) {
            // return true;
            const token = store.data.activation.activation_token;
            // check through API
            ajaxGet(authURL(`/activations/${token}`), { 'Content-Type': 'application/json' })
                .then(function (res) {
                    // console.log(res);
                    if (res.success && res.success === true) {
                        return true;
                    } else {
                        unauthorizeUser(store, closeSelf);
                    }
                })
                .catch(function (error) {
                    console.log(error)
                    unauthorizeUser(store, closeSelf);
                });
        } else {
            closeSelf();
        }
    });

}

// close self tab
function closeSelf() {
    chrome.tabs.getCurrent(function (tab) {
        chrome.tabs.remove([tab.id], function () {
            console.error('[Unauthorized!]');
        })
    })
}

// action for tab selection
function tabSelected(elem) {
    const targetId = elem.attributes['data-target'].value;
    document.querySelectorAll('.tabs .tab').forEach(function (tab) {
        tab.classList.remove('active');
    });
    elem.classList.add('active');
    // document.getElementById('header').innerText = elem.innerText;

    // tab panes
    document.querySelectorAll('.tab-pane').forEach(function (tabPane) {
        tabPane.style.display = 'none';
    })
    document.getElementById(`${targetId}`).style.display = 'block';
}

function fillActivationSection(activation) {
    document.getElementById('actv_key').value = activation.key
    document.getElementById('actv_hwid').value = activation.activation.hwid;
    document.getElementById('actv_device').value = activation.activation.device_name;
    document.getElementById('actv_token').value = activation.activation_token;
}

function addCustomItem(keyword = '', value = '') {
    const container = document.getElementById('custom-container');
    let item = document.createElement('div');
    item.classList.add('form-group')
    item.classList.add('flex');
    item.classList.add('custom-item');
    item.innerHTML = `
        <input class="form-control" placeholder="Keyword" />
        <input class="form-control" placeholder="Answer" />
        <button class="remove-custom" title="Remove">
            <svg width="14" aria-hidden="true" focusable="false" data-prefix="far" data-icon="trash-alt" class="svg-inline--fa fa-trash-alt fa-w-14" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M268 416h24a12 12 0 0 0 12-12V188a12 12 0 0 0-12-12h-24a12 12 0 0 0-12 12v216a12 12 0 0 0 12 12zM432 80h-82.41l-34-56.7A48 48 0 0 0 274.41 0H173.59a48 48 0 0 0-41.16 23.3L98.41 80H16A16 16 0 0 0 0 96v16a16 16 0 0 0 16 16h16v336a48 48 0 0 0 48 48h288a48 48 0 0 0 48-48V128h16a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16zM171.84 50.91A6 6 0 0 1 177 48h94a6 6 0 0 1 5.15 2.91L293.61 80H154.39zM368 464H80V128h288zm-212-48h24a12 12 0 0 0 12-12V188a12 12 0 0 0-12-12h-24a12 12 0 0 0-12 12v216a12 12 0 0 0 12 12z" fill="#fff"></path></svg>
        </button>
    `;
    if (!!keyword) {
        item.querySelectorAll('input')[0].value = keyword;
    }
    if (!!value) {
        item.querySelectorAll('input')[1].value = value;
    }
    item.querySelector('.remove-custom').addEventListener('click', function () {
        item.remove();
    })
    container.append(item);
}

function saveCustomKeywords() {
    let customs = [];
    const items = document.querySelectorAll('.custom-item');
    items.forEach(function (item) {
        const keyword = item.querySelectorAll('input')[0].value;
        const value = item.querySelectorAll('input')[1].value;
        if (keyword && value) {
            customs.push({ keyword: keyword, value: value });
        }
    })

    chrome.storage.local.get(['data'], function (store) {
        if (store && store.data) {
            store.data.customs = customs;
            chrome.storage.local.set({ data: store.data }, function () {
                showAlertModal('Data has been saved successfully!');
                updateCustomKeywords(customs);
            })
        }
    })
}

function updateCustomKeywords(customs) {
    $('#custom-container').html('');
    customs.forEach(function (custom) {
        addCustomItem(custom.keyword, custom.value);
    })
}

function setToggleSection(options) {
    $('#toggle-auto-checkout').RestockToggle({
        on: !!options.autoCheckout,
        onChange: function () {
            updateSettings('autoCheckout', $('#toggle-auto-checkout').RestockToggle('status'));
        },
        backgroundColor: "#1E2435",
        handleActiveColor: $('#toggle-auto-checkout').data('color')
    });
    $('#toggle-auto-fill').RestockToggle({
        on: !!options.autoFill,
        onChange: function () {
            updateSettings('autoFill', $('#toggle-auto-fill').RestockToggle('status'));
        },
        backgroundColor: "#1E2435",
        handleActiveColor: $('#toggle-auto-fill').data('color')
    });
}

function saveProfileImport({ profiles, profile }) {
    chrome.storage.local.get(["data"], function (result) {
        let data = {};
        if (result.data !== undefined) {
            data = result.data;
        }
        data.profile = profile;
        data.profiles = profiles;
        chrome.storage.local.set({ data: data }, function (res) {
            showAlertModal('Imported profiles successfully!');
            window.location.reload(true);
        })
    });
}

function updateSettings(key, value) {
    console.log(key, value);
    chrome.storage.local.get(['data'], function (res) {
        let data = {};
        if (res.data !== undefined) {
            data = res.data;
        }
        let settings = {};
        if (data.settings !== undefined) {
            settings = data.settings;
        }
        settings[key] = value;
        data.settings = settings;
        chrome.storage.local.set({ data: data }, function (res) {
            console.log('[SETTING] - updated success');
        })
    })
}

function addDomainClick() {
    let template = `
    <div class="one-domain">
        <div class="domain-wrapper">
            <input class="form-control" placeholder="Domain"/>
            <img class="click-icon plus" src="../images/plus.png" />
            <img class="click-icon trash" src="../images/trash.png" />
        </div>
        <div class="click-array">
            <div class="one-click">
                <input class="form-control" placeholder="Click"/>
                <img class="click-icon plus" src="../images/plus.png" />
                <img class="click-icon trash" src="../images/trash.png" />
            </div>
        </div>
    </div>
    `;
    $('#domain-container').append(template);
}

function saveCustomClick() {
    let custom_clicks = [];
    $('.one-domain').each(function(i, element) {
        // console.log(element);
        let domain_name = $(element).find('.domain-wrapper input').val();
        let clicks = [];
        let clickElements = $(element).find('.one-click').each(function(j, click) {
            let click_label = $(click).find('input').val();
            if (!!click_label) {
                clicks.push(click_label);
            }
        })
        if (!!domain_name && clicks.length > 0) {
            custom_clicks.push({
                domain: domain_name,
                clicks: clicks
            })
        }
    });
    console.log(custom_clicks);
    chrome.storage.local.get(['data'], function(result) {
        let data = {};
        if (result && result.data) {
            data = result.data;
        }
        data.autoclicks = custom_clicks;
        chrome.storage.local.set({data: data}, function() {
            showAlertModal('Data had been saved successfully');
            updateAutoClickSection(custom_clicks);
        })
    })
}

function updateAutoClickSection(domains) {
    $('#domain-container').html('');
    if (!!domains && domains.length > 0) {
        domains.forEach(function(domain) {
            let template = `
            <div class="one-domain">
                <div class="domain-wrapper">
                    <input class="form-control" placeholder="Domain" value="{{DOMAIN}}"/>
                    <img class="click-icon plus" src="../images/plus.png" />
                    <img class="click-icon trash" src="../images/trash.png" />
                </div>
                <div class="click-array">
                    {{CLICKS}}
                </div>
            </div>
            `;
            let clickElements = ``;
            domain.clicks.forEach(function(click) {
                clickElements += `
                <div class="one-click">
                    <input class="form-control" placeholder="Click" value="${click}"/>
                    <img class="click-icon plus" src="../images/plus.png" />
                    <img class="click-icon trash" src="../images/trash.png" />
                </div>
                `;
            })
            $("#domain-container").append(template.replace('{{DOMAIN}}', domain.domain).replace('{{CLICKS}}', clickElements));
        })
    }
}