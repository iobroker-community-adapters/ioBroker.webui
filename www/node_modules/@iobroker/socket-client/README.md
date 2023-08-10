# ioBroker/socket-client

## Description
This library encapsulates the API from ioBroker backend to frontend.

There are 2 connection types in it:
- `Connection` => for all Web Frontends;
- `AdminConnection` => for Admin UI Connections, these have access to more commands.

## Build
`npm run build` for one-time builds.
`npm run watch` for continuous builds.

## How to use in frontend
Include the socket library from Admin or Web adapter:
```html
<script src="../lib/js/socket.io.js"></script>
```

Instantiate the connection:
```js
const adminConnection = new AdminConnection({
	protocol: 'ws',
	host: '192.168.1.2',
	port: 8081,
	admin5only: false,
	autoSubscribes: [],
	// optional: other options
});

await adminConnection.startSocket();
await adminConnection.waitForFirstConnection();
// and use it
console.log(await adminConnection.getHosts());
```

<!--
	Placeholder for the next version (at the beginning of the line):
	### **WORK IN PROGRESS**
-->
## Changelog
### 2.3.4 (2023-08-10)
* (bluefox) Added `subscribeStateAsync` method for legacy compatibility

### 2.3.3 (2023-08-01)
* (bluefox) Added the subscribing on the specific instance messages

### 2.2.1 (2023-07-31)
* (bluefox) Update packages

### 2.2.0 (2023-07-07)
* (bluefox) added new method - `getObjectsById`

### 2.1.0 (2023-06-14)
* (rovo89) Typescript types tuning
* (bluefox) The path was removed from `socket.io` URL

### 2.0.7 (2023-03-24)
* (bluefox) better detection of chained certificates

### 2.0.6 (2023-03-22)
* (bluefox) packages updated

### 2.0.5 (2023-03-16)
* (bluefox) Added `rename` and `renameFile` methods

### 2.0.4 (2023-02-15)
* (bluefox) Made the fix for `material` and `echarts`

### 2.0.2 (2023-02-02)
* (bluefox) Caught errors on state/object changes
* (bluefox) Special changes for vis and "nothing_selected" ID

### 2.0.1 (2022-12-19)
* (bluefox) Added `log` command

### 2.0.0 (2022-11-30)
* (jogibear9988) Added getObjectViewSystem and getObjectViewCustom and deprecated getObjectView

### 1.1.14 (2022-09-12)
* (bluefox) Added support of authentication token

### 1.1.13 (2022-08-30)
* (bluefox) Working on cloud connection

### 1.1.12 (2022-08-18)
* (bluefox) Added method getCompactSystemRepositories

### 1.1.11 (2022-08-01)
* (bluefox) Added ack parameter to `setState` method.

### 1.1.10 (2022-07-05)
* (bluefox) Allowed call of getStates with pattern

### 1.1.9 (2022-07-04)
* (bluefox) Errors on connection are handled now

### 1.1.8 (2022-06-22)
* (bluefox) Added preparations for iobroker cloud

### 1.1.7 (2022-06-21)
* (bluefox) Added functions to reset cache

### 1.1.6 (2022-06-20)
* (bluefox) Allowed connections behind reverse proxy

### 1.1.4 (2022-06-19)
* (bluefox) Added functions to reset cache

### 1.1.2 (2022-06-17)
* (bluefox) Corrected cache problem by `getInstalled` and `getRepository` commands

### 1.1.1 (2022-06-09)
* (bluefox) Allowed connections behind reverse proxy

### 1.1.0 (2022-05-24)
* (bluefox) Added methods: subscribeFiles, unsubscribeFiles

### 1.0.12 (2022-05-09)
* (bluefox) Extended `getVersion` command with update

### 1.0.11 (2022-03-20)
* (AlCalzone) corrected: reload on websocket error instead of alert()-ing

### 1.0.10 (2022-01-29)
* (bluefox) Added `logout` command
* (bluefox) Move `getGroups` to web connection

### 1.0.9 (2021-12-21)
* (jogibear998) Fix connection with web adapter
* (jogibear998 & AlCalzone) Convert package to a CommonJS/ESM hybrid

### 1.0.8 (2021-10-30)
* (bluefox) Fixed `getInstalled` command

### 1.0.7 (2021-10-30)
* (bluefox) Improved the vendor support

### 1.0.6 (2021-10-20)
* (AlCalzone) setSystemConfig simplified

### 1.0.5 (2021-09-13)
* (AlCalzone) The package was completely rewritten to make proper use of TypeScript

### 1.0.4 (2021-07-12)
* (bluefox) Fix the renaming of groups

### 1.0.3 (2021-06-10)
* (jogibear9988) Test release

### 1.0.2 (2021-06-10)
* (bluefox) Update methods
* (UncleSamSwiss) Add release script and release workflow

### 1.0.0 (2021-06-08)
* (jogibear9988) Create the Repository from the Code in https://github.com/ioBroker/adapter-react

## License
The MIT License (MIT)

Copyright (c) 2021-2023 Jochen Kühner
