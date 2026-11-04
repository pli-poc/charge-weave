// The pull-request head is checked out explicitly; GITHUB_SHA may be a merge commit.
export function verifiedCommit(env, checkedOutCommit) {
  const commit = env.EXACT_COMMIT_SHA;
  if (env.CI !== 'true' || !env.GITHUB_REPOSITORY || !/^[a-f0-9]{40}$/.test(commit ?? '') || commit !== checkedOutCommit) {
    throw new Error('Commit verification requires the exact checked-out CI commit');
  }
  return commit;
}
