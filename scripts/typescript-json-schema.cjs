#!/usr/bin/env node

const { exec, getDefaultArgs } = require("typescript-json-schema");

const rawArgs = process.argv.slice(2);
const positional = [];
const args = getDefaultArgs();

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];

  if (!arg.startsWith("--")) {
    positional.push(arg);
    continue;
  }

  const option = arg.slice(2);

  switch (option) {
    case "ignoreErrors":
      args.ignoreErrors = true;
      break;
    case "strictNullChecks":
      args.strictNullChecks = true;
      break;
    case "propOrder":
      args.propOrder = true;
      break;
    case "out":
      args.out = rawArgs[++i];
      break;
    default:
      throw new Error(`Unsupported typescript-json-schema option: ${arg}`);
  }
}

if (positional.length < 2) {
  throw new Error("Usage: typescript-json-schema.cjs <path-to-typescript-files-or-tsconfig> <type>");
}

exec(positional[0], positional[1], args).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
