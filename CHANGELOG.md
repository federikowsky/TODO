# Change Log

## [0.1.0] - 2023-07-15

### Added
- Initial release of TD Todo extension
- Custom `.td` file format with dedicated syntax highlighting
- Task management with four priority levels:
  - `[ ]` - Normal priority tasks
  - `[~]` - Medium priority tasks (displayed in orange)
  - `[!]` - High priority tasks (displayed in red)
  - `[X]` - Completed tasks
- Commands for task manipulation:
  - Toggle checkbox state (`Ctrl+Shift+Enter`)
  - Toggle priority levels (`Ctrl+Shift+.`)
  - Priority-specific shortcuts (`Ctrl+Shift+N/M/H` for none/medium/high)
  - Auto-completion for task names
  - Auto-assignment of priority levels based on defaults prio (`Ctrl+Shift+S`)
- Task organization features:
  - Section-based hierarchical structure with `#`, `##`, `###` headings
  - Indentation-based subtasks with proper validation
  - Multi-line notes using `>` prefix syntax
- Metadata and tag support:
  - `@defaults:` inheritance system for applying metadata to all tasks in a section
  - Tag syntax with `@tag` and `@tag(param)` formats
  - Special tags like `@prio`, `@file`, `@due` with parameter validation
- Diagnostics and error detection:
  - Real-time syntax validation
  - Detailed error messages for invalid syntax
  - Warning system for structural issues
- Comment support with `//` and `--` prefixes

### Technical Implementation
- Incremental document parsing for performance with large files
- Robust AST (Abstract Syntax Tree) representation of documents
- Efficient diagnostic reporting system