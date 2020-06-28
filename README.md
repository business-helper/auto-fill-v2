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
    "data": {
        "activation": true | false},
        "profile": {},
        "profiles": [PROFILE],
        "customs": [
            { "keyword": "keyword1", "value": "value1" }
        ],
        "autoclicks": [
            { 
                "domain": "domain.com",
                "clicks": ["Buy Now", "Pay Now"]
            }
        ],
        "settings": {
            "autoCheckout": true,
            "autoFill": true,
            "delay": 200
        }
    }
}
 ```