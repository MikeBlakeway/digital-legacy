---
name: commit
description: Generate a conventional commit message from staged git changes
argument-hint: Optional guidance like "emphasize tests" or "keep it short"
---

Generate one conventional commit message for the currently staged changes.

Requirements:

- Inspect staged changes before writing anything.
- Use conventional commit format: <type>(<scope>): <subject>.
- Keep the subject imperative and concise.
- Include a short bullet body only when it adds meaningful clarity.
- Return the result as a single copy/paste fenced text block.
- If no files are staged, return: "No staged changes found. Stage files and run /commit again."
