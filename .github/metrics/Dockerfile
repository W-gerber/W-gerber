FROM ghcr.io/lowlighter/metrics@sha256:257392f90340f916cb8b815026f259399f6b246d3eb7de38b58bfe7a07bd5b65

# GitHub PushEvent payloads may omit commits; honor a zero recent-language limit.
RUN node -e 'const fs = require("fs"); const file = "/metrics/source/plugins/habits/index.mjs"; let source = fs.readFileSync(file, "utf8"); for (const [original, updated] of [[".flatMap(({payload}) => payload.commits)", ".flatMap(({payload}) => payload.commits ?? [])"], ["if (patches.length) {", "if (patches.length && limit) {"]]) { if (!source.includes(original)) throw new Error("Metrics habits patch no longer matches"); source = source.replace(original, updated); } fs.writeFileSync(file, source);'
