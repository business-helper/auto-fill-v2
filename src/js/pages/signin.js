
docReady(function () {
    document.getElementById('try-again').addEventListener('click', function (e) {
        e.preventDefault();
        triggerDiscordAuth();
    });

    showLoadingMsg();
    triggerDiscordAuth();
})

function activateUser(e) {
    console.log('[activate User]');
    e.preventDefault();
    const uuid = `${new Date().getTime()}${Math.floor(Math.random() * 1000)}`;
    const hwid = `RESTOCK-INTEL-HWID-${uuid}`;
    const device_name = `RESTOCK-INTEL-DEVICE-${uuid}`;
    const data = {
        key: document.getElementById('act_key').value,
        activation: {
            hwid: hwid,
            device_name: device_name
        }
    };
    if (true) {
        document.querySelector('#btn-activate img').style.display = 'inherit';
        document.getElementById('btn-activate').attributes.disabled = 'true';
        ajaxPost(authURL(`/activations`), data, { 'Content-Type': 'application/json' })
            .then(function (res) {
                console.log(res);
                if (res.success && res.success === true) {
                    document.querySelector('#btn-activate img').style.display = 'none';
                    document.getElementById('btn-activate').attributes.disabled = 'false';
                    storeActivationInfo(res, function () {
                        chrome.tabs.create({ url: 'src/pages/settings.html' })
                    });
                }
            })
            .catch(function (error) {
                console.log(error)
                document.querySelector('#btn-activate img').style.display = 'none';
                document.getElementById('btn-activate').attributes.disabled = 'false';
            });
    }
}

function authorizeUser(e) {
    console.log('[authorize user]');
    e.preventDefault();
    // chrome.tabs.create({url: 'src/settings.html'})
    const token = document.getElementById('act_token').value;
    if (token) {
        document.querySelector('#btn-authorize img').style.display = 'inherit';
        document.getElementById('btn-authorize').attributes.disabled = 'true';
        ajaxGet(authURL(`/activations/${token}`), { 'Content-Type': 'application/json' })
            .then(function (res) {
                // console.log(res);
                if (res.success && res.success === true) {
                    document.querySelector('#btn-authorize img').style.display = 'none';
                    document.getElementById('btn-authorize').attributes.disabled = 'false';
                    storeActivationInfo(res, function () {
                        chrome.tabs.create({ url: 'src/pages/settings.html' })
                    });
                } else {
                    unauthorizeUser();
                }
            })
            .catch(function (error) {
                console.log(error)
                unauthorizeUser()
            });
    }
}

// show authorization form, and hide activation form
function showAuthorizeForm() {
    document.querySelector('#btn-authorize img').style.display = 'none';
    document.getElementById('btn-authorize').attributes.disabled = 'false';
    document.getElementById('authorize_form').style.display = 'block';
    document.getElementById('activate_form').style.display = 'none';
}

// show activation form, and hide authorization form
function showActivateForm() {
    document.querySelector('#btn-activate img').style.display = 'none';
    document.getElementById('btn-activate').attributes.disabled = 'false';
    document.getElementById('activate_form').style.display = 'block';
    document.getElementById('authorize_form').style.display = 'none';
}

// check if user already authorized. if yes, open settings.html
function checkActivation() {
    return chrome.tabs.create({ url: 'src/pages/settings.html' });
    chrome.storage.local.get(["data"], function (store) {
        console.log(store);
        if (store && store.data && store.data.activation) {
            return chrome.tabs.create({ url: 'src/pages/settings.html' });
        } else {
            showActivateForm();
        }
        // toggle auth
        // return chrome.tabs.create({url: 'src/settings.html'});  
    })
}

function triggerDiscordAuth() {//return;
    const scopes = ['identity', 'guilds'];
    chrome.identity.launchWebAuthFlow(
        { url: 'https://discord.com/api/oauth2/authorize?client_id=695192092061859850&redirect_uri=https%3A%2F%2Fnblohhdbodncnkkdjbcobogjhaefmimd.chromiumapp.org%2Fprovider_cb&response_type=code&scope=identify%20guilds', 'interactive': true },
        function (url) {
            const urlObj = new URL(url);
            let code = urlObj.searchParams.get('code');
            const data = {
                client_id: APP_SETTINGS.DiSCORD_CLIENT_ID,
                client_secret: APP_SETTINGS.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: 'https://nblohhdbodncnkkdjbcobogjhaefmimd.chromiumapp.org/provider_cb',
                scope: scopes.join(' '),
            };

            axios({
                method: 'post',
                url: 'https://discordapp.com/api/v6/oauth2/token',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data: Qs.stringify(data),
            })
                .then(res => {
                    console.log('[token]', res)
                    let token = res.data.access_token;

                    axios({
                        method: 'GET',
                        // url: 'https://discordapp.com/api/v6/channels/695356483545858178/messages',
                        url: 'https://discordapp.com/api/v6/users/@me/guilds',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        }
                    })
                        .then(res => {
                            const guilds = res.data;
                            for (let guild of guilds) {
                                if (guild.id === APP_SETTINGS.DISCORD_SERVER_ID) {
                                    setActive(true);
                                    return;
                                }
                            }
                            setActive(false);
                        })
                        .catch(err => {
                            console.error(err);
                            showFailtureMsg();
                        })
                })
                .catch(err => {
                    console.error(err);
                    showFailtureMsg();
                })
        }
    );
}

function setActive(active = false) {
    console.log('[active]', active);
    chrome.storage.local.get(['data'], function (res) {
        let data = {
            activation: false,
            profile: {},
            profiles: [],
            customs: [],
            autoclicks: [
            ],
            settings: {
                autoCheckout: false,
                autoFill: true,
                delay: 200
            }
        }
        if (res.data !== undefined) {
            data = res.data;
        }

        data.activation = active;

        chrome.storage.local.set({ data: data }, function (res) {
            console.log('[SETTING] - updated success');
            if (active === true) {
                return chrome.tabs.create({ url: 'src/pages/settings.html' });
            }
        })
    })
}

function showFailtureMsg() {
    document.getElementById('failed-con').classList.remove('hide');
    document.getElementById('loading-con').classList.add('hide');
}

function showLoadingMsg() {
    document.getElementById('failed-con').classList.add('hide');
    document.getElementById('loading-con').classList.remove('hide'); 
}

