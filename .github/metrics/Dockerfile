FROM ghcr.io/lowlighter/metrics@sha256:257392f90340f916cb8b815026f259399f6b246d3eb7de38b58bfe7a07bd5b65

# GitHub PushEvent payloads may no longer include a commits array.
RUN node -e 'const fs = require("fs"); const file = "/metrics/source/plugins/habits/index.mjs"; const original = ".flatMap(({payload}) => payload.commits)"; const updated = ".flatMap(({payload}) => payload.commits ?? [])"; const source = fs.readFileSync(file, "utf8"); if (!source.includes(original)) throw new Error("Metrics habits patch no longer matches"); fs.writeFileSync(file, source.replace(original, updated));'
