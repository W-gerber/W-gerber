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
  [
    `    const patches = [
      ...await Promise.allSettled(
        commits
          .flatMap(({payload}) => payload.commits)
          .filter(({author}) => data.shared["commits.authoring"].filter(authoring => author?.login?.toLocaleLowerCase().includes(authoring) || author?.email?.toLocaleLowerCase().includes(authoring) || author?.name?.toLocaleLowerCase().includes(authoring)).length)
          .map(async commit => (await rest.request(commit)).data.files),
      ),
    ]
      .filter(({status}) => status === "fulfilled")
      .map(({value}) => value)
      .flatMap(files => files.map(file => ({name: imports.paths.basename(file.filename), patch: file.patch ?? ""})))
      .map(({name, patch}) => ({name, patch: patch.split("\\n").filter(line => /^[+]/.test(line)).map(line => line.substring(1)).join("\\n")}))`,
    `    const isAuthor = author => data.shared["commits.authoring"].some(authoring =>
      [author?.login, author?.email, author?.name].some(value => value?.toLocaleLowerCase().includes(authoring.toLocaleLowerCase())))
    const requests = commits.slice(0, 25).flatMap(({payload, repo}) => {
      if (Array.isArray(payload.commits))
        return payload.commits.filter(({author}) => isAuthor(author)).map(async commit => (await rest.request(commit)).data.files ?? [])
      if (!payload.head)
        return []
      const [owner, name] = repo.name.split("/")
      return [(async () => {
        const {data: commit} = await rest.repos.getCommit({owner, repo: name, ref: payload.head})
        const author = {...commit.commit?.author, login: commit.author?.login}
        return isAuthor(author) ? commit.files ?? [] : []
      })()]
    })
    const results = await Promise.allSettled(requests)
    const failed = results.filter(({status}) => status === "rejected").length
    if (failed)
      console.warn(\`Could not load \${failed} recent commit details; coding-style facts may be incomplete.\`)
    const patches = results
      .filter(({status}) => status === "fulfilled")
      .flatMap(({value}) => value.map(file => ({name: imports.paths.basename(file.filename), patch: file.patch ?? ""})))
      .map(({name, patch}) => ({name, patch: patch.split("\\n").filter(line => /^[+]/.test(line)).map(line => line.substring(1)).join("\\n")}))`,
  ],
  [
    `      patches
        .map(({patch}) => patch.match(/((?:\\t)|(?:[ ]{2})) /gm) ?? [])
        .forEach(indent => habits.indents[/^\\t/.test(indent) ? "tabs" : "spaces"]++)`,
    `      for (const {patch} of patches) {
        for (const line of patch.split("\\n")) {
          if (/^\\t+\\S/.test(line))
            habits.indents.tabs++
          else if (/^ {2,}\\S/.test(line))
            habits.indents.spaces++
        }
      }`,
  ],
  ["if (patches.length) {", "if (patches.length && limit) {"],
]);

patch("/metrics/source/plugins/base/queries/repositories.graphql", [
  ["languages(first: 8)", "languages(first: 100)"],
]);

patch("/metrics/source/plugins/community/fortune/index.mjs", [
  [
    "    const x = Math.random()",
    `    const seed = process.env.PROFILE_FORTUNE_SEED
    if (!seed)
      throw new Error("PROFILE_FORTUNE_SEED is required")
    let hash = 2166136261
    for (const char of seed)
      hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
    const x = (hash >>> 0) / 2 ** 32`,
  ],
  [
    `      if (x <= r) {
        fortune = fortunes[i]
        break
      }
      r += fortunes[i].chance`,
    `      r += fortunes[i].chance
      if (x < r) {
        fortune = fortunes[i]
        break
      }`,
  ],
]);

patch("/metrics/source/plugins/languages/index.mjs", [
  [
    "    //Results\n    return languages",
    `    //Use bundled icons where available; unknown languages keep their names.
    const icons = {
      "TypeScript": "typescript", "HTML": "html5", "CSS": "css3",
      "Lua": "lua", "JavaScript": "javascript", "Astro": "astro",
      "C++": "cplusplus", "C#": "csharp", "Python": "python",
      "CMake": "cmake", "Dockerfile": "docker", "PowerShell": "powershell",
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
    '<% if (plugins.languages) { %>\n  <section>',
    '<% if (plugins.languages) { %>\n  <section class="languages-heading">',
  ],
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
