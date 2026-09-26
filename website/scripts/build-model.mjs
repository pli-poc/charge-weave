import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { Parser } from "n3";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const classes = JSON.parse(read("model/catalog.json"));
const rules = JSON.parse(read("model/rules.json"));
const sources = [
  "ontology/charge-domain-complete.ttl",
  "validation/structure.shacl.ttl",
  "validation/vocabulary.shacl.ttl",
];
const prefixes = {
  cd: "https://example.org/charge-domain#",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  owl: "http://www.w3.org/2002/07/owl#",
  sh: "http://www.w3.org/ns/shacl#",
  xsd: "http://www.w3.org/2001/XMLSchema#",
  skos: "http://www.w3.org/2004/02/skos/core#",
  dct: "http://purl.org/dc/terms/",
};
const compact = (term) => {
  if (term.termType === "BlankNode") return "_:" + term.value;
  if (term.termType === "Literal")
    return (
      JSON.stringify(term.value) +
      (term.language
        ? "@" + term.language
        : term.datatype.value === prefixes.xsd + "string"
          ? ""
          : "^^" + compact(term.datatype))
    );
  for (const [p, iri] of Object.entries(prefixes))
    if (term.value.startsWith(iri))
      return p + ":" + term.value.slice(iri.length);
  return "<" + term.value + ">";
};
const subjects = {};
for (const [i, source] of sources.entries()) {
  const quads = new Parser({
    format: "text/turtle",
    blankNodePrefix: "g" + i + "_",
  }).parse(read(source));
  for (const q of quads) {
    const s = compact(q.subject),
      row = [compact(q.predicate), compact(q.object), source];
    (subjects[s] ||= []).push(row);
  }
}
for (const rows of Object.values(subjects))
  rows.sort((a, b) => a.join("\0").localeCompare(b.join("\0")));
const namespace = prefixes.cd;
const version =
  (subjects["<https://example.org/charge-domain>"] || [])
    .find((x) => x[0] === "owl:versionInfo")?.[1]
    .replaceAll('"', "") || "repository snapshot";
const sourceHash = createHash("sha256")
  .update(read("model/domain.schema"))
  .digest("hex");
const modules = [
  ...new Set(Object.values(classes).map((c) => c.module)),
].sort();
const relations = [];
for (const [name, c] of Object.entries(classes))
  for (const f of c.fields)
    if (f.type === "object") {
      if (!classes[f.range])
        throw new Error(`Unknown range: ${name}.${f.property}`);
      relations.push({
        from: name,
        to: f.range,
        property: f.property,
        cardinality: f.cardinality,
      });
    }
// Refuse to publish a viewer whose contracts no longer agree with the RDF sources.
for (const [name, info] of Object.entries(classes)) {
  if (
    !(subjects["cd:" + name] || []).some(
      ([p, o]) => p === "rdf:type" && o === "owl:Class",
    )
  )
    throw new Error("Missing OWL class: " + name);
  for (const f of info.fields)
    if (
      !(subjects["cd:" + name + "_" + f.property + "Shape"] || []).some(
        ([p, o]) => p === "sh:path" && o === "cd:" + f.property,
      )
    )
      throw new Error(
        "Missing SHACL field contract: " + name + "." + f.property,
      );
}
for (const rule of rules)
  if (!fs.existsSync(path.join(root, "queries", rule.id + ".rq")))
    throw new Error("Missing source rule: " + rule.id);
const triplesJson = JSON.stringify(subjects);
const triplesFile =
  "model-triples-" +
  createHash("sha256").update(triplesJson).digest("hex").slice(0, 12) +
  ".json";
for (const file of fs.readdirSync(path.join(root, "website/public"))) {
  if (/^model-triples(?:-[a-f0-9]{12})?\.json$/.test(file))
    fs.unlinkSync(path.join(root, "website/public", file));
}
const data = {
  triplesFile,
  version,
  namespace,
  sourceHash,
  modules,
  classes,
  rules,
  relations,
  prefixes,
  temporalPolicy: JSON.parse(read("model/temporal-policy.json")),
  temporalExample: JSON.parse(read("model/temporal-example.json")),
};
fs.mkdirSync(path.join(root, "website/src/generated"), { recursive: true });
fs.writeFileSync(path.join(root, "website/public", triplesFile), triplesJson);
fs.writeFileSync(
  path.join(root, "website/src/generated/model.json"),
  JSON.stringify(data),
);
fs.writeFileSync(
  path.join(root, "website/src/generated/summary.json"),
  JSON.stringify({
    version,
    classes: Object.keys(classes).length,
    modules: modules.length,
    rules: rules.length,
  }),
);
console.log(
  `Explorer: ${Object.keys(classes).length} classes, ${modules.length} modules, ${relations.length} declared relations, ${rules.length} rules; model ${version}.`,
);
