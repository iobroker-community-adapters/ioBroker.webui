# ioBroker.webui

webui for ioBroker

## Developing

  * Install dependencies
```
  $ npm install
```

  * Compile Typescript after doing changes
```
  $ npm run build
```

  * Run the app in a local server
```
  $ npm start --prefix www
```

  * Navigate Chrome to [localhost:8000]() to see the app.

## Info about the Adapter.

It's only an early beta. At the moment it communicates with "Admin" on Port "8081", but this will be fixed.

You need to create a screen "start", this is the first one called when you open runtime.html, but you can change this via query parameter:
runtime.html?screenName=screen2
