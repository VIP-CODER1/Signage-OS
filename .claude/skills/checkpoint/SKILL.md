---
name: checkpoint
description: Create, list, or restore named git-stash snapshots of the working tree — a safety net for reverting bad edits without losing the whole session. Use this whenever the user says "create a checkpoint", "snapshot this", "save my work", "roll back", "undo the last 10 minutes", "restore the checkpoint from before X", or "list checkpoints".
---

# Checkpoint

Manual counterpart to the `create-checkpoint` Stop hook. Use it at arbitrary points when you want a named restore point.

## Commands

### Create a checkpoint
`/checkpoint:create [name]`

- Stashes the current working tree (including untracked) with message `claude-checkpoint: <name> @ <timestamp>`
- Immediately re-applies so the working tree is unchanged
- If name is omitted, uses a timestamp-only label

### List checkpoints
`/checkpoint:list`

Show all stash entries matching `claude-checkpoint:` with their timestamp and optional name.

Runs:
```bash
git stash list | grep 'claude-checkpoint:'
```

### Restore a checkpoint
`/checkpoint:restore [name-or-index]`

- Matches on name or on stash index (`stash@{N}`)
- If ambiguous, list matches and ask
- Before restore: if the working tree has changes, **create an auto-checkpoint first** with name `auto-before-restore-<ts>`, so the restore is itself reversible

## Procedure

### Create
1. Confirm we're in a git repo (`git rev-parse --git-dir`).
2. If the tree is clean, tell the user nothing to checkpoint and exit.
3. `git stash push -u -m "claude-checkpoint: <name> @ <ts>"`
4. `git stash apply stash@{0}` to restore the tree state.
5. Tell the user: "Checkpoint created: `<name>`. Restore with `/checkpoint:restore <name>`."

### List
1. Run `git stash list | grep 'claude-checkpoint:'`.
2. Parse and format:
   ```
   [0] 2026-04-23T09:12Z  before-auth-refactor
   [1] 2026-04-23T08:45Z  (no name)
   [2] 2026-04-23T08:30Z  stop-hook-auto
   ```

### Restore
1. Find the stash matching the name or index.
2. If the working tree is dirty, auto-checkpoint first (name: `auto-before-restore-<ts>`).
3. `git stash apply stash@{N}` (apply, not pop — we keep the checkpoint around).
4. Confirm: "Restored `<name>`. Your pre-restore state is saved as `auto-before-restore-<ts>`."

## Rules

- **Never `git stash pop`** — we use apply to keep the checkpoint. Pop can lose work on conflicts.
- **Never delete stashes** — they're cheap. If the user wants pruning, offer a separate explicit command.
- **Before any destructive restore**, auto-checkpoint the current state.
- If restore has conflicts, stop and tell the user. Don't try to auto-resolve — that's `/debug` territory.

## Limits

Stashes are local-only. They don't travel with the branch. For multi-machine work, the user needs to commit (even to a WIP branch) — mention this if they ask about sharing checkpoints.

Stashes build up. If `/checkpoint:list` shows > 50 entries, suggest the user prune the old ones with `git stash drop stash@{N}` (manually, not auto).
