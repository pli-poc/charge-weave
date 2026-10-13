export function selectFixture(example, validAt, knownAt) {
  const valid = Date.parse(validAt + "T00:00:00Z"), known = Date.parse(knownAt + "T00:00:00Z");
  const empty = { commit: null, slice: null, state: "Unavailable", price: null };
  if (!Number.isFinite(valid) || !Number.isFinite(known) || known > Date.parse(example.knownThrough)) return empty;
  const commit = example.commits.filter(c => Date.parse(c.recordedAt) <= known)
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))[0];
  if (!commit) return empty;
  const slice = commit.slices.find(s => Date.parse(s.validFrom) <= valid && (!s.validUntil || valid < Date.parse(s.validUntil)));
  return slice ? { commit, slice, state: slice.state, price: slice.price } : empty;
}
