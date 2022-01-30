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

Copyright (c) 2014-2022 bluefox <dogafox@gmail.com>,
