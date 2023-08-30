# ioBroker.webui

webui for ioBroker

![image](https://user-images.githubusercontent.com/364896/147159584-e0e43d37-9e63-409d-867b-458c5dd8be4e.png)

## Description

This is a complete visualization system for ioBroker.

It includes features like:

  - own simple scripting language
  - binding to ioBroker objects including converters & javascript expressions
  - drag drop of external images
  - drag drop of ioBroker objects to automaticy create bindings
  - relative signal paths to ioBroker objects
  - split view edit of html code
  - global styling support
  - usage of npm packages containing webcomponents
  - screens inside of screens
  - icons from habpanel included

## Concepts

### Custom Controls in WebUI

You can create own reusable CustomControls in WebUI. This can have individual Javascript, Properties and a template.

You can use Double-Bracket Syntax and Double-Curly-Braket Syntax of "BaseCustomWebcomponent" to create bindings from the Template to the properties defined in the Designer. Curylbrackets create two way Bindings.
If you use the Bindings Dialog, you can Bind to a Property with ??Propertyname and to IoBroker Object in the Property via ?Propertyname.
In Scripts you can also write to Signals defined in Custom Properties, but there is no UI for it yet, but this come soon.

You could also include Javascript in your CustomControl Template. It needs to be in a Script Tag with the Attribute "type" set to "module". Also you could use export function "init(instance)" wich will be called when your CustomControl will be instanciated.

## Sponsoring

If you want to help the development, sponsor this project at https://github.com/sponsors/jogibear9988

## Developing
  * Install Repository as Adapter in IOBroker
  * Download the Repository to an extra "dev" directory, do not develop inside the ioBroker Node_modules directory.
  * Do the following steps inside of the "dev" dirctory.

  * Install dependencies 
```
  $ npm install
```

  * Compile Typescript after doing changes (or press Ctrl + Shift + B in VsCode and select "tsc watch")
```
  $ npm run tsc
```

  * Adjust 'config.js' to match you ip-adress and port for your iobroker
   (The config.js in the repository root will be replaced with the one in '/config' when running 'npm build')
```
    window.iobrokerHost = '192.168.1.2';
    window.iobrokerPort = '8082';
    window.iobrokerSocketScriptUrl = 'http://' + window.iobrokerHost + ':' + window.iobrokerPort + '/lib/js/socket.io.js';
```

  * Run the app in a local server
```
  $ npm start
```

  * Navigate Chrome to [localhost:8000]() to see the app.

### More about Development

  - Run 
```
  $ npm run reflection
``` 
   to recreate reflection files for Scripting wich are used for the property grid

  - Run 
```
  $ npm run build
``` 
   to copy compiled files and node_modules to www folder so adapter is installable via github

  - Run 
```
  $ npm run release
  $ npm publish
``` 
   to create correct release commit for iobroker, Be carefull this also pushes to git repo.
   Be sure to edit "CHANGELOG.md" before, the text in "## **WORK IN PROGRESS**" in README.Md will be used for version info

## Info about the Adapter.

The Adapter is based on the following Designer component:
https://github.com/node-projects/web-component-designer

You need to create a screen "start", this is the first one called when you open runtime.html, 
but you can change this via query parameter:
runtime.html?screenName=screen2

## Changelog
<!--
	Placeholder for next versions:
	### __WORK IN PROGRESS__
-->

### __WORK IN PROGRESS__
- remove uneeded files from upload
- remove icons into extra iobroker packages
- support icon adapters
- rename screens & controls

### 0.3.0 (2023-08-29)
- default value for custom properties
- open screens only once
- property bindings default one way

### 0.2.3 (2023-08-28)
- rework how custom controls are initalized

### 0.2.2 (2023-08-28)
- better support & fixes of custom elements
- enum properties in custom controls
- sample custom controls

### 0.2.1 (2023-08-28)
- null ref fix in bindings

### 0.2.0 (2023-08-28)
- Import/Export of Screens/Images/Controls
- Define your own Controls directly in webui
- Drag/Drop of Icons/Images to Properties
- Drag/Drop of objects to Bindings-Editor Signalname
- Basic functionality of CustomControls

### 0.1.0 (2023-08-27)
-   initial public release

## License
The MIT License (MIT)

Copyright (c) 2023 jogibear9988 <jochen.kuehner@gmx.de>
