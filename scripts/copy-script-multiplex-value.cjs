#!/usr/bin/env node

const { copyFileSync, mkdirSync } = require("node:fs");
const { dirname } = require("node:path");

const source = "./node_modules/@node-projects/web-component-designer-visualization-addons/dist/interfaces/IScriptMultiplexValue.d.ts";
const target = "./src/frontend/interfaces/IScriptMultiplexValue.d.ts";

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
