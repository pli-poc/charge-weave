// Cursors are database-wide and may have legitimate gaps from other workspaces.
// Each event therefore names its predecessor within its own workspace.
export function classifyEvent(event, cursor) {
  if (!event || !Number.isSafeInteger(event.sequence) || !Number.isSafeInteger(event.previousSequence) || event.sequence < 1 || event.previousSequence < 0 || event.previousSequence >= event.sequence) return 'recover';
  if (event.sequence <= cursor) return 'duplicate';
  return event.previousSequence === cursor ? 'next' : 'recover';
}
