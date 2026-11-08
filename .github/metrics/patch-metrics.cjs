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

patch("/metrics/source/plugins/languages/index.mjs", [
  [
    "    //Results\n    return languages",
    `    //Use bundled icons where available; unknown languages keep their names.
    const icons = {
      "TypeScript": "typescript", "HTML": "html5", "CSS": "css3",
      "Lua": "lua", "JavaScript": "javascript", "Astro": "astro",
      "C++": "cplusplus", "C#": "csharp", "Python": "python",
    }
    for (const language of [...languages.favorites, ...languages.recent]) {
      const icon = icons[language.name]
      if (icon) {
        const svg = await imports.fs.readFile(\`\${imports.__module(import.meta.url)}/icons/\${icon}.svg\`)
        language.icon = \`data:image/svg+xml;base64,\${svg.toString("base64")}\`
      }
    }

    //Results
    return languages`,
  ],
]);

patch("/metrics/source/templates/classic/partials/languages.ejs", [
  [
    `          <div class="field center horizontal-wrap fill-width">
            <% for (const {name, value, color} of languages) { %>
              <div class="field center no-wrap language">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path fill="<%= color %>" fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8z"></path></svg>
                <%= name %>
              </div>
            <% } %>
          </div>`,
    `          <div class="language-icons">
            <% for (const {name, icon} of languages) { %>
              <% if (icon) { %>
                <img src="<%= icon %>" width="32" height="32" alt="<%= name %>" title="<%= name %>"/>
              <% } else { %>
                <span><%= name %></span>
              <% } %>
            <% } %>
          </div>`,
  ],
]);

patch("/metrics/source/templates/classic/partials/habits.ejs", [
  [
    '(computed from last <%= plugins.habits.commits.fetched %> commit<%= s(plugins.habits.commits.fetched) %>)',
    '(based on <%= plugins.habits.commits.fetched %> recent push event<%= s(plugins.habits.commits.fetched) %>)',
  ],
  [
    '        <ul class="facts">\n',
    `        <ul class="facts">
          <% if (!plugins.habits.commits.fetched) { %>
            <li>No recent push activity found</li>
          <% } %>
`,
  ],
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
