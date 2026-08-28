How to get started
Please read this document to learn about the open platform, integration process (TTock App integration, TTHotel App integration),SDK，API, frequently asked questions,etc.

Devices added via the TTLock App (integrating with the TTLock App) ,please refer to Sections 1（Open Platform） and 2（TTLock App Integration）.

Device added via the TTHotel App (integrating with the TTHotel App or the card encoder), Please skip Sections 1 and 2 and proceed directly to Section 3: TTHotel Integration.

Develop your own platform based on our SDKs, which is free. Please refer to: APP Integration Development Guide

Please note: We don't provide test accounts or sandbox environments for integration. Please refer directly to the corresponding integration process for detailed instructions.

1.Open Platform
1.1、Register a developer account
The developer account is only used for application submissions and is not used for any other purpose. This account is different from TTLock App account and theses 2 accounts are unrelated to each other.

For questions related to the open platform, please refer to the documentation.：Open Platform Q&A

1.2、Create an application in the developer account and apply for it. If the application is approved, you will see the client_id and client_secret in the Application.
After creating an app, it will be in the "Under Review" status by default. It will be manually reviewed by the backend within business days. Developers will be notified by email upon successful review.

Developers can see the client_id and client_secret on the approved app details page. Please keep these details secure.

If you have multiple projects, a single developer account can create multiple apps.

2.TTLock App Integration
2.1、Add locks in TTlock App
Search for "TTLock" in the stores, download and install the APP, register a user account, and add locks.

TTLock Tutorial：App、Web





2.2、Get TTlock Account‘s Access Token
Use the TTLock App account and password registered in 2.1 & the client_id and client_secret (applied in 1.2 ) to call the cloud API to obtain the access token of the added lock account. Note that the accessToken will expire after the time indicated by expires_in. After expiration, you need to obtain it again or refresh

2.3、After obtaining the accessToken, you can use it to call other APIs
Please refer to the link for detailed steps：How to integrate with TTlock App

3.TTHotel Integration
To integrate with TTHotel, you do not need to register a developer account or apply for an application on the open platform. You can directly go to the TTHotel computer client - Settings - Integration - Get the integration information. The integration information includes client_id, client_secret, username and password. You can use the integration information to call the APIs. For details, please refer to the document:How to integrate with TThote & Card encoder

TTHotel Tutorial：introduction | TTHotel help center

4.API
Provides lock, password, electronic key, IC card, fingerprint, gateway and other related interfaces. For specific interface documents, please refer to the open platform Cloud API v3 section

The open platform includes more than just the APIs described below; you can explore other APIs by referring to the Cloud API v3 section of the open platform documentation.

Password unlocking: Supports multiple password types including time-limited passwords, single-use passwords, and custom passwords (custom passwords require the device to be online, i.e., the lock is connected to a gateway or is a WiFi lock);

Bluetooth unlocking: Also known as an electronic key (eKey), users who receive an electronic key can unlock the lock using their mobile phone via Bluetooth. An app download is generally required;

Remote unlocking: Requires the device to be connected to a network (the lock is connected to a gateway or is a WiFi lock). Remote unlocking/locking can be performed by calling a cloud API;

IC card unlocking: IC cards can be enrolled via Bluetooth or remotely issued via API. Unlocking is then performed using the IC card;

Fingerprint unlocking: Unlocking is performed by enrolling a fingerprint;

Face recognition: Unlocking is performed by enrolling a face or sending a face photo;

Unlocking records: Upload and retrieve unlocking records, or callback notifications;

5.SDK
IOS：IOS SDK & Demo

Android：Android SDK & Demo

Flutter ：Flutter SDK & Demo

6.On-premise(Fee required)
If you want to store all data on your own server, you can perform local deployment. Please refer to the document for details: on-premise







Unlock via network (Gateway)
TTLock bluetooth lock can't connect to the Internet by itself. If you want to manage the lock remotely via network, you need a gateway from TTLock, it's a gadget which can communicate with the lock and also can be connected to the network.

The gateway will automatically search locks nearby it, and notify the gateway server about the locks it found, the gateway server will create a many-to-many relationship between the gateways and locks if the lock and gateway belong to the same administrator account. The gateway server will choose the gateway with the best RSSI to communication with the lock when user want to operate the lock remotely. A gateway can connect to many locks and there is no limits on the lock number.



1、Initialization of gateway
You can add the gateway with TTLock APP，please refer to ：G2 gateway manual.

You may also develop your own APP base on our APP SDK to initialize the gateway，refer to: APP SDK gateway inerfaces for the details. Parameter uid is needed to identify which user account the gateway belongs to when initializing gateway, it will be returned when requesting for Access Token，you may also obtain the uid by Get user id API, following are the steps:

（1）Initialize the gateway with APP SDK, the gateway will automatically connect to the gateway server and registered itself to the cloud if it's successfully configured.

（2）Request cloud API Query the init status of the gateway to confirm gateway is successfully registered in the cloud，gatewayId will be returned if it's success.

（3）Request cloud API Upload detail info of gateway to upload gateway detail information to the cloud, you'll need these information for gateway firmware update.

You can query the gateway by cloud API Get the gateway list of an account.

2、Relation of gateway and lock
The gateway will automatically search nearby locks, and if they belong to the same administrator they will connect each other, no need for manually bind from the end user. So if the gateway can't find the lock nearby, please make sure the lock and gateway is added by the same user account.

You can query the relationships of gateway and lock through these two cloud APIs: Get the lock list of a gateway and Get the gateway list of a lock, they will also return the RSSI between the gateway and lock.

The gateway server will choose the gateway with the best RSSI to communication with the lock when user want to operate the lock remotely.

3、What you can do when the lock is connected to gatways?
You can send commands to the lock via gateway remotely, all the following operations can be done remotely: unlock the lock、lock the lock，query the lock state of the lock，manage(add, delete, update) passcodes，manage(add, delete, update) cards，manage(add, delete, update) fingerprints，query battery of the lock、query and calibrate the lock time.

And lock records will be automatically uploaded to cloud，administrator of the lock will receive unlocking notifications in the TTLock APP，developers can receive lock records notification by setting Callback URL in the application's detail page of open platform, refer to: Lock records notify for the detail.

4、Why operation failed?
The gateway communicate with the lock through bluetooth connection, it may take several seconds for the gateway to establish a bluetooth connection with the lock. So a remote operation will take longer time or even fail when the RSSI between the lock and gateway is too weak. Break of bluetooth connection(for example: touch the lock keypad) will also cause the failure of remote operation.

Remote operation may take a long time, our timeout for requests of remote operation is 30 seconds, if you set your request to timed out in shorter time (for example, you set your request to timed out in 10s) then you may not receive the response.

Gateway and lock can only establish a unique bluetooth connection at the same time, so remote operation should be requested one by one, if a remote operation is requested when the earlier operation is not finished, it is destined to fail.

 Unlock
https://euapi.ttlock.com/v3/lock/unlock

Unlock via gateway or WiFi lock, if get -4043(The function is not supported for this lock) error message, please switch the "remote unlock" on in TTLock APP's lock setting page.

If you are integrating with TTHotel and you have power savers, this API can be used to manage power saver as well. Simply use power saver ID as the lockId. Calling this API will turn on the power.

1 Request example
POST, ContentType:application/x-www-form-urlencoded

curl --location -g --request POST 'https://euapi.ttlock.com/v3/lock/unlock' \
--data-urlencode 'clientId=4773aa036f7f49c68d876bb4be85c80c' \
--data-urlencode 'accessToken=dfd5489d0cee31f0bdfaf59d0d42d71f' \
--data-urlencode 'lockId=163377' \
--data-urlencode 'date=1625025703000'
2 Request parameters
Name	Type	Required	Description
clientId	String	Y	client_id from Create application
accessToken	String	Y	Access token，refer to: Get access token
lockId	Int	Y	Lock ID, generated by Lock init
date	Long	Y	Current time (timestamp in millisecond)
3 Response and example
Parameter	Type	Description
errcode	Int	Error code
errmsg	String	Error message
{
    "errcode": 0, 
    "errmsg": "none error message"
}
 






 Get access token
https://euapi.ttlock.com/oauth2/token

Cloud APIs grant access by OAuth 2.0 's Resource Owner Password grant type，you have to request with username and password，all the cloud apis should be requested with access token.

Note: The username and password here are the account of the TTLock app. You need to download the TTLock app and register. please do not use your open platform's developer account.

Note：access token returned will expire in seconds of expires_in（Default validity of 90 days），request with expired access token will get 10004 error code，you should get a new token with this API, or Refresh the access token.

1 Request example
POST, ContentType:application/x-www-form-urlencoded

 
1
curl --location -g --request POST 'https://euapi.ttlock.com/oauth2/token' \
2
--header 'Content-Type: application/x-www-form-urlencoded' \
3
--data-urlencode 'clientId=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' \
4
--data-urlencode 'clientSecret=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' \
5
--data-urlencode 'username=+8618966498228' \
6
--data-urlencode 'password=e10adc3949ba59abbe56e057f20f883e'    
2 Request parameters
Name	Type	Required	Description
clientId	String	Y	clientId from Create application
clientSecret	String	Y	clientSecret from Create application
username	String	Y	username you used to login TTLock APP，or The prefixed username return by cloud api: User register. Notice：please do not use your open platform's developer account.
password	String	Y	Password(32 chars, low case, md5 encrypted)
3 Response and example
Name	Type	Request parameters
access_token	String	Access token
uid	Int	User id
expires_in	Int	Expire time of access token, default validity of 90 days, in second.
refresh_token	String	Refresh token
 
1
{
2
    "access_token": "39caac89b0b51c980aa61ad4264b693b", 
3
    "uid": 2340,
4
    "refresh_token": "1bd2a21a7df889630f444364813738d7",
5
    "expires_in": 7776000,
6
}







Get the gateway list of a lock
https://euapi.ttlock.com/v3/gateway/listByLock

The gateway automatically search locks nearby it, and notify the gateway server about the locks it found, the gateway server will create a many-to-many relationship between the gateways and locks if the lock and gateway belong to the same administrator account, the relationship will be cached for 30 minutes, that is if a gateway have notified the gateway server about the lock in 30 minutes, this API will return the gateway. 

This API will return all the gateways related to a lock.

The gateway server will choose the gateway with the best RSSI to communication with the lock when user  want to operate the lock remotely. 

1 Request example
curl --location --request GET 'https://euapi.ttlock.com/v3/gateway/listByLock?clientId=4773aa036f7f49c68d876bb4be85c80c&accessToken=dfd5489d0cee31f0bdfaf59d0d42d71f&lockId=163377&date=1626674054000'
2 Request parameters
Name	Type	Required	Description
clientId	String	Y	client_id from Create application
accessToken	String	Y	Access token，refer to: Get access token
lockId	Int	Y	Lock ID, generated by Lock init
date	Long	Y	Current time (timestamp in millisecond)
3 Response and example
Parameter	Type	Description
list	JSONArray	list of records
The objects in the list：

Parameter	Type	Description
gatewayId	Int	Gateway ID
gatewayMac	String	Gateway MAC
gatewayName	String	Gateway name
rssi	Int	The signal intensity between gateway and lock. reference: >-75 is strong, -85<i<-75 is medium, <-85 is weak
rssiUpdateDate	Long	The time when the signal intensity updated (timestamp in millisecond)
{
    "list": [
        {
            "gatewayId": 78979,
            "gatewayMac": "C5:40:E0:9C:8C:C1",
            "gatewayName": "Gateway for 1-101",
            "rssi": -65,
            "rssiUpdateDate": 1626674053000
        }
    ]
}
 






 Get the lock list of a gateway
https://euapi.ttlock.com/v3/gateway/listLock

The gateway automatically search locks nearby it, and notify the gateway server about the locks it found, the gateway server will create a many-to-many relationship between the gateways and locks if the lock and gateway belong to the same administrator account, the relationship will be cached for 30 minutes, that is, if the gateway have notified the gateway server about a lock in 30 minutes, this API will return the lock. 

This API will return all the locks  related to a gateway.

1 Request example
curl --location --request GET 'https://euapi.ttlock.com/v3/gateway/listLock?clientId=4773aa036f7f49c68d876bb4be85c80c&accessToken=dfd5489d0cee31f0bdfaf59d0d42d71f&gatewayId=78979&date=1626674054000'
2 Request parameters
Name	Type	Required	Description
clientId	String	Y	client_id from Create application
accessToken	String	Y	Access token，refer to: Get access token
gatewayId	Int	Y	Gateway ID
date	Long	Y	Current time (timestamp in millisecond)
3 Response and example
Parameter	Type	Description
list	JSONArray	list of records
The objects in the list：

Parameter	Type	Description
lockId	Int	Lock ID
lockMac	String	Lock MAC
lockName	String	Lock name
lockAlias	String	Lock alias
rssi	Int	The signal intensity between gateway and lock. reference: >-75 is strong, -85<i<-75 is medium, <-85 is weak
updateDate	Long	The time when the signal intensity updated (timestamp in millisecond)
{
    "list": [
        {
            "lockId": 532323,
            "lockName":"YS1003_c18c9c",
            "lockAlias":"Front door lock",
            "lockMac": "C5:40:E0:9C:8C:C1",
            "rssi":-65,
            "updateDate": 1626674053000
        }
    ]
}
 




 Get the open state of a lock
https://euapi.ttlock.com/v3/lock/queryOpenState

Get the open state of a lock via gateway or WiFi lock. If the lock is also bound to a door sensor, this API also returns the door sensor status

1 Request example
curl --location --request GET 'https://euapi.ttlock.com/v3/lock/queryOpenState?clientId=4773aa036f7f49c68d876bb4be85c80c&accessToken=dfd5489d0cee31f0bdfaf59d0d42d71f&lockId=163377&date=1626674054000'
2 Request parameters
Name	Type	Required	Description
clientId	String	Y	client_id from Create application
accessToken	String	Y	Access token，refer to: Get access token
lockId	Int	Y	Lock ID, generated by Lock init
date	Long	Y	Current time (timestamp in millisecond)
3 Response and example
Parameter	Type	Description
state	Int	Open state of lock:0-locked,1-unlocked,2-unknown
{
    "state": 1
}







Lock the lock
https://euapi.ttlock.com/v3/lock/lock

Lock the lock remotely via gateway or WiFi lock.

If you are integrating with TTHotel and you have power savers, this API can be used to manage power saver as well. Simply use power saver ID as the lockId. Calling this API will turn off the power.

1 Request example
POST, ContentType:application/x-www-form-urlencoded

curl --location -g --request POST 'https://euapi.ttlock.com/v3/lock/lock' \
--data-urlencode 'clientId=4773aa036f7f49c68d876bb4be85c80c' \
--data-urlencode 'accessToken=dfd5489d0cee31f0bdfaf59d0d42d71f' \
--data-urlencode 'lockId=163377' \
--data-urlencode 'date=1625025703000'
2 Request parameters
Name	Type	Required	Description
clientId	String	Y	client_id from Create application
accessToken	String	Y	Access token，refer to: Get access token
lockId	Int	Y	Lock ID, generated by Lock init
date	Long	Y	Current time (timestamp in millisecond)
3 Response and example
Parameter	Type	Description
errcode	Int	Error code
errmsg	String	Error message
{
    "errcode": 0, 
    "errmsg": "none error message"
}



Get lock battery
https://euapi.ttlock.com/v3/lock/queryElectricQuantity

Get the lock battery of a lock remotely via gateway or WiFi lock.

1 Request example
curl --location -g --request GET 'https://euapi.ttlock.com/v3/lock/queryElectricQuantity?clientId=fd2ff35ee3d8424c8665c07b7b9a7f45&accessToken=f6ee29dda68d962243fb91b047d319d3&lockId=163377&date=1548141056000'
2 Request parameters
Name	Type	Required	Description
clientId	String	Y	client_id from Create application
accessToken	String	Y	Access token，refer to: Get access token
lockId	Int	Y	Lock ID, generated by Lock init
date	Long	Y	Current time (timestamp in millisecond)
3 Response and example
Parameter	Type	Description
electricQuantity	Int	Lock battery
{
    "electricQuantity": 85
}
 


 heres stuff i could add, lmk what i should, - User Guide**

- How to get started
- Unlock with APP (eKey)
- Unlock with Passcode
- Issuing Hotel Card
- Unlock via network (Gateway)
- Unlock via network (WiFi lock)
- Unlocking records
- On Premise
- Third-party device integration
- TTLock n8nGateway APIs**

- Unlock
- Lock
- Get the open state of a lock
- Get lock time
- Adjust lock time
- Query lock battery
- Get the gateway list of an account
- Delete gateway
- Rename gateway
- Transfer Gateway
- Get the gateway list of a lock
- Get the lock list of a gateway
- Get the device list of a gateway
- Get gateway detail
- Query the init status of the gateway
- Upload detail info of gateway
- Gateway upgrade check
- Set gateway into upgrade mod


e