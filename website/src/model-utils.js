import model from "./generated/model.json";
export { model };
export const cardinality = { "!": "1", "?": "0..1", "+": "1..*", "*": "0..*" };
export const words = (value) =>
  value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replaceAll("-", " ");
export function ancestors(name) {
  const result = [];
  let current = model.classes[name]?.parent;
  while (current) {
    result.push(current);
    current = model.classes[current]?.parent;
  }
  return result;
}
export function fieldsFor(name) {
  return [name, ...ancestors(name)].flatMap((owner) =>
    model.classes[owner].fields.map((f) => ({
      ...f,
      owner,
      inherited: owner !== name,
    })),
  );
}
export function rulesFor(name) {
  return model.rules.filter((r) =>
    [name, ...ancestors(name)].includes(r.target),
  );
}
export function triplesFor(name, field, subjects) {
  const roots = new Set();
  if (field) {
    roots.add("cd:" + field.property);
    roots.add("cd:" + field.owner + "_" + field.property + "Shape");
    for (const [p, o] of subjects["cd:" + field.owner] || [])
      if (
        p === "rdfs:subClassOf" &&
        o.startsWith("_:") &&
        (subjects[o] || []).some(
          ([p2, o2]) =>
            p2 === "owl:onProperty" && o2 === "cd:" + field.property,
        )
      )
        roots.add(o);
  } else {
    for (const owner of [name, ...ancestors(name)]) {
      roots.add("cd:" + owner);
      roots.add("cd:" + owner + "Shape");
    }
    for (const f of fieldsFor(name)) {
      roots.add("cd:" + f.property);
      roots.add("cd:" + f.owner + "_" + f.property + "Shape");
    }
  }
  const queue = [...roots],
    seen = new Set(),
    triples = [];
  while (queue.length) {
    const s = queue.shift();
    if (seen.has(s)) continue;
    seen.add(s);
    for (const [p, o, source] of subjects[s] || []) {
      triples.push({ s, p, o, source });
      if (o.startsWith("_:")) queue.push(o);
    }
  }
  return triples.sort(
    (a, b) =>
      a.s.localeCompare(b.s) ||
      a.p.localeCompare(b.p) ||
      a.o.localeCompare(b.o),
  );
}
export function expandTerm(term) {
  if (term.startsWith("_:") || term.startsWith("<")) return term;
  if (term.startsWith('"'))
    return term.replace(/\^\^([\w]+):([^\s]+)$/, (m, p, v) =>
      model.prefixes[p] ? "^^<" + model.prefixes[p] + v + ">" : m,
    );
  const i = term.indexOf(":");
  const p = term.slice(0, i);
  return model.prefixes[p]
    ? "<" + model.prefixes[p] + term.slice(i + 1) + ">"
    : term;
}
export function downloadTriples(rows, name) {
  const body =
    rows
      .map((t) => [t.s, t.p, t.o].map(expandTerm).join(" ") + " .")
      .join("\n") + "\n";
  const url = URL.createObjectURL(
    new Blob([body], { type: "application/n-triples" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name + ".nt";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

let subjectsPromise;
export function loadSubjects() {
  if (!subjectsPromise)
    subjectsPromise = fetch(import.meta.env.BASE_URL + model.triplesFile)
      .then((response) => {
        if (!response.ok) throw new Error("Schema data could not be loaded.");
        return response.json();
      })
      .catch((error) => {
        subjectsPromise = undefined;
        throw error;
      });
  return subjectsPromise;
}
