# Branching Strategy - Git Flow

## Main Branches

- **`main`** → Production-ready code
- **`dev`** → Active development branch (features merge here before `main`).

## Feature Development Flow

- Each issue gets its **own branch** to avoid conflicts.
- Feature branches are **created from `dev`** and merged back into `dev`.
- **Branch Naming Convention**:
  ```md
  {issue #}-{short description}
  ```
  **Example:**
  ```md
  12345-fix-expense-calculation
  ```

### Other updates (eg. Documentation Updates, Workflow updates)

Documentation - `{Initials}/docs/{short-description}`

Workflows - `{Initials}/workflow/{short-description}`

---

# Commit Message Guidelines

To maintain **clarity and consistency**, all commit messages should follow this format:

```md
[Short, clear description of what the commit does]

Issue: #<issue-number>
```

### **Example Commit Message**

```md
Fix incorrect calculation of student marks in COMP 4350

Issue: #31
```

### **Commit Message Rules**

1. **Keep it concise** (50-70 characters for the first line).
2. **Describe what the commit does, not how** (avoid "Changed X"—instead, say "Refactored X to improve Y").
3. **Reference issues using "Issue: #<issue-number>"** for easier tracking.
4. **Use present tense & imperative form**:
   - [CORRECT] `"Fix bug in expense calculation"`
   - [CORRECT] `"Add feature to split expenses"`
   - [WRONG] `"Fixed bug in expense calculation"`
   - [WRONG] `"Added feature to split expenses"`
5. **Break large changes into multiple commits** whenever possible.

---

# Pull Request (PR) Guidelines

## 1. PR Titles Must Start with the Issue Number:

```md
#<issue-number> - <Short PR title>
```

### **Example PR Titles**

```md
#27 - Fix rounding issue in expense calculation
#42 - Implement trip invitation system
```

## 2. PR Descriptions Must Include:

- **What was changed?**
- **Why was it needed?**
- **Any special considerations?**
- **Auto-link issues** using:
  ```md
  Closes #<issue-number>
  Fixes #<issue-number>
  Resolves #<issue-number>
  ```
