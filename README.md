# web-component-designer-demo

Demonstration Project using https://github.com/node-projects/web-component-designer

## url of demo project

https://node-projects.github.io/web-component-designer-demo/index.html

## Developing

  * Install dependencies
```
  $ npm install
```

  * Install dependencies of designer component and build it (as long is not yet a npm package)
```
  $ cd node_modules/@node-projects/web-component-designer
  $ npm install
  $ ./node_modules/.bin/tsc
```

  * Compile Typescript after doing changes
```
  $ npm run build
```

  * Run the app in a local server
```
  $ polymer serve --port 8000 --open
```

  * Navigate Chrome to [localhost:8000]() to see the app.
