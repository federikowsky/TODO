# TD Todo - Task Management for VS Code

A Visual Studio Code extension for simple yet powerful task management using the custom `.td` file format.

## Features

### Task Management with Priority Levels
- `[ ]` - Normal priority tasks
- `[~]` - Medium priority tasks (displayed in orange)
- `[!]` - High priority tasks (displayed in red)
- `[X]` - Completed tasks

### Hierarchical Organization
- Use Markdown-style headings (`#`, `##`, `###`) to create sections
- Organize tasks hierarchically with indentation
- Group related tasks visually

### Metadata and Tags
- Apply default metadata to entire sections with `@defaults:`
- Tag tasks with `@tag` and `@tag(param)` syntax
- Special tags like `@prio(high)`, `@file(path:line)`, `@due(date)`

### Notes and Comments
- Add multi-line notes to tasks with the `>` prefix
- Use comments with `//` or `--` prefixes

## Commands and Shortcuts

| Command | Shortcut | Description |
|---------|----------|-------------|
| Toggle Checkbox | `Ctrl+Shift+Enter` | Toggle task completion state |
| Toggle Priority | `Ctrl+Shift+.` | Cycle through priority levels |
| Set Normal Priority | `Ctrl+Shift+N` | Set task to normal priority |
| Set Medium Priority | `Ctrl+Shift+M` | Set task to medium priority |
| Set High Priority | `Ctrl+Shift+H` | Set task to high priority |
| Auto-Assign Priority | `Ctrl+Shift+S` | Assign priority based on defaults |

## Example

```td
# Project Tasks

@defaults: @prio(medium), @project(myapp)
- [ ] Implement login screen
  > Should support both email and social logins
  > Add "forgot password" link
- [!] Fix critical security bug @due(01-31-2023)
- [~] Refactor database queries
  - [ ] Optimize user queries
  - [ ] Add caching layer
- [X] Set up CI pipeline

## Documentation
- [ ] Update API docs

// This is a comment that won't appear in the task list
```


## Release Notes

See the [CHANGELOG.md](CHANGELOG.md) for detailed release notes.