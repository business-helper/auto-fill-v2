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
       "activation": true | false,
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
   },
   "supreme": {
     "category": "",
     "keyword": "",
     "auto_refresh": true | false,
     "style": "",
     "random_style": true | false,
     "size": "",
     "random_size": true | false,
     "key_delay": 0
   }
}
```

- Profile Object

```json
{
  "address1": "",
  "address2": "",
  "card_cvv": "",
  "card_exp_mm": "",
  "card_number": "",
  "city": "",
  "country": "",
  "email": "",
  "first_name": "",
  "last_name": "",
  "name": "",
  "phone": "",
  "state": "",
  "zip_code": ""
}
```

### Supreme Configration
