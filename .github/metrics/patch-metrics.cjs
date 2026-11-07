const fs = require("fs");

function patch(path, changes) {
  let source = fs.readFileSync(path, "utf8");
  for (const [original, replacement] of changes) {
    if (source.split(original).length !== 2) {
      throw new Error(`Metrics patch no longer matches ${path}`);
    }
    source = source.replace(original, replacement);
  }
  fs.writeFileSync(path, source);
}

patch("/metrics/source/plugins/habits/index.mjs", [
  [".flatMap(({payload}) => payload.commits)", ".flatMap(({payload}) => payload.commits ?? [])"],
  ["if (patches.length) {", "if (patches.length && limit) {"],
]);

patch("/metrics/source/plugins/lines/index.mjs", [
  ["${contributor.author.login}", "${contributor.author?.login ?? 'unknown'}"],
]);

patch("/metrics/source/app/metrics/index.mjs", [
  [
    'throw new Error("An error occurred during rendering, dying")',
    'throw new Error(`Metrics plugin failed: ${errors.map(({name}) => name ?? "base").join(", ")}`)',
  ],
]);

patch("/metrics/source/app/action/index.mjs", [
  [
    'for (const log of [info.break(), "An error occurred, logging debug message :", ...debugged])\n        console.log(log)',
    'console.log("Detailed debug output is disabled to protect private repository information.")',
  ],
]);
