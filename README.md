# Upgrade Version AutoFill

## Features

 - authorize user using shrey Auth
 - fill the checkout form automatically
 - save billing information
 - auto-checkout
 - auto-clicker

 ## Data structure

 ```json
{
    "restil": {
        "activation": {
            "success": true | false,
            "key": "2343-...",
            "activation_token": "XCVd...",
            "activation": {
                "hwid": "sadf-...",
                "device_name": "LAPTOP-...",
                "activated_at": 1585872379,
                "active": true,
            },
            "user": {
                "id": 123123,
                "discord_username": "xxxx#1223",
                "discord_id": "23423422342xxx121",
                "avatar_url": "https://cdn.discordapp.com/avatars/asdfxxx.png"
            }
        },
        "profile": {

        },
        "profiles": [PROFILE],
        "customs": [
            { "keyword": "keyword1", "value": "value1" }
        ],
        "settings": {
            "authoCheckout": true,
        }
    }
}
 ```