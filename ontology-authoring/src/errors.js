// Only classify failures whose meaning is explicit; ambiguous errors stay generic.
const cases = [
  [/^Saved view revision conflict$/, 'VIEW_REVISION_CONFLICT', 'The saved view changed.', 'Reload the shared view before saving again.'],
  [/^(?:Revision conflict|Stale revision|Undo requires the latest revision|Stale view suggestion)$/, 'REVISION_CONFLICT', 'The workspace changed.', 'Read the current revision and diff before reapplying the edit.'],
  [/^Operation ID reused with different request$/, 'IDEMPOTENCY_CONFLICT', 'This operation ID was already used for different content.', 'Inspect the original result and use a new operation ID for a new action.'],
  [/^Stale validation input$/, 'CHECKS_STALE', 'The validation input is no longer current.', 'Reload the workspace and rerun the check for its current revision.'],
  [/^Workspace not authorized$/, 'SCOPE_DENIED', 'This credential cannot access the requested workspace.', 'Connect using a credential authorized for that workspace.'],
  [/^Class not found$/, 'UNKNOWN_TERM', 'The requested class was not found.', 'Search the current workspace for an existing concept.'],
  [/precondition does not match/i, 'PRECONDITION_CONFLICT', 'The expected source value no longer matches.', 'Inspect the current source and explicitly replan the edit.'],
  [/^Duplicate responsibility binding$/, 'DUPLICATE_BINDING', 'That responsibility mapping already exists.', 'Inspect the existing mapping before adding another.'],
  [/^Binding must reference an existing declared object relationship$/, 'UNKNOWN_RELATIONSHIP', 'The mapping does not match a declared object relationship.', 'Select an existing declared relationship and its target.'],
  [/^Push outcome is unknown; reconcile the remote branch before retrying$/, 'PUSH_OUTCOME_UNKNOWN', 'The remote push outcome is unknown.', 'Reconcile the publication branch before retrying.'],
  [/^Pull-request outcome is unknown; reconcile before retrying$/, 'PR_OUTCOME_UNKNOWN', 'The pull-request outcome is unknown.', 'Reconcile the pull request before retrying.'],
  [/^Target branch changed; revalidate before/, 'TARGET_CHANGED', 'The target branch changed.', 'Inspect the new target and revalidate before publication.'],
  [/^Current accepted review and (?:passing checks|staged preview) are required$/, 'REVIEW_REQUIRED', 'Current review and validation evidence are required.', 'Open review readiness and complete the missing checks and review.'],
  [/^A validation job is already active for this workspace$/, 'JOB_IN_PROGRESS', 'A validation job is already active.', 'Wait for it to finish or request cancellation.'],
  [/^Responsibility mapping source is unavailable in this workspace$/, 'SOURCE_UNAVAILABLE', 'This workspace does not contain an editable responsibility mapping source.', 'Create a new workspace from a baseline containing the mapping source.'],
  [/^Command group cannot be undone$/, 'UNDO_CONFLICT', 'The command group cannot be safely undone.', 'Inspect current history and use an eligible latest command group.'],
  [/^Invalid (?:class\.add|class\.describe|property\.add|property\.update|saved view|responsibility|workspace|search)/i, 'INVALID_COMMAND', 'The requested values are invalid or unsupported.', 'Review the supplied identifiers, source preconditions and supported contract.'],
];

export function applicationError(problem) {
  const message = typeof problem?.message === 'string' ? problem.message : '';
  const match = cases.find(([pattern]) => pattern.test(message));
  const [, code, summary, recovery] = match ?? [null, 'OPERATION_FAILED', 'The operation could not be completed.', 'Inspect the current workspace and supplied values before retrying.'];
  return { code, message: summary, recovery };
}
