# System update

Run `node update-system.mjs check` and report an available version only when the remote is newer. Before applying, show the user-layer/system-layer boundary and require a clean working tree. `node update-system.mjs apply` must create a backup, use a fast-forward-only update, reinstall dependencies, and preserve user-owned files. On failure, retain the backup and report the recovery path. Use `node update-system.mjs rollback` only when the user requests rollback.
