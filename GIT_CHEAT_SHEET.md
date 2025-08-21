# Git Implementation Cheat Sheet

## Quick Reference for Multi-Agent Task Solver

### Essential Git Commands

#### Repository Setup
```bash
git init                    # Initialize new repository
git clone <url>            # Clone existing repository
git remote add origin <url> # Add remote origin
```

#### Basic Workflow
```bash
git status                 # Check current status
git add <file>            # Stage specific file
git add .                 # Stage all changes
git commit -m "message"   # Commit with message
git push origin <branch>  # Push to remote
git pull origin <branch>  # Pull from remote
```

#### Branching
```bash
git branch                # List local branches
git branch -a             # List all branches
git checkout -b <name>    # Create and switch to new branch
git checkout <name>       # Switch to existing branch
git branch -d <name>      # Delete local branch
```

#### Merging
```bash
git merge <branch>        # Merge branch into current
git merge --no-ff <branch> # Merge with commit history
git rebase <branch>       # Rebase current on branch
```

#### History & Inspection
```bash
git log                   # View commit history
git log --oneline         # Compact history
git log --graph           # Visual branch history
git show <commit>         # Show commit details
git diff                  # Show unstaged changes
git diff --staged         # Show staged changes
```

---

## Implementation Commands by Phase

### Phase 1: Foundation
```bash
mkdir multi-agent-solver
cd multi-agent-solver
git init
# Create project structure...
git add .
git commit -m "feat: Initialize project foundation with basic structure"
```

### Phase 2: Agent Interface
```bash
git checkout -b feature/agent-interface
# Implement agent classes...
git add src/agents/
git commit -m "feat: Implement core agent interface and base classes"
```

### Phase 3: Basic Agents
```bash
git checkout -b feature/basic-agents
# Implement three agents...
git add src/agents/
git commit -m "feat: Implement http_fetch, text_stats, and save_mysql agents"
```

### Phase 4: Graph Engine
```bash
git checkout -b feature/graph-engine
# Implement orchestration...
git add src/orchestration/
git commit -m "feat: Implement basic graph execution engine"
```

### Phase 5: Advanced Features
```bash
git checkout -b feature/advanced-graphs
# Add conditional/parallel execution...
git add src/orchestration/
git commit -m "feat: Add advanced graph features - conditional branching and parallel execution"
```

### Phase 6: Dynamic API
```bash
git checkout -b feature/dynamic-api
# Implement REST endpoints...
git add src/routes/
git commit -m "feat: Implement dynamic graph management API"
```

### Phase 7: Plugin System
```bash
git checkout -b feature/plugin-system
# Implement plugin architecture...
git add src/plugins/
git commit -m "feat: Implement plugin system with hot agent swapping"
```

### Phase 8: Testing
```bash
git checkout -b feature/integration
# Add comprehensive tests...
git add tests/
git commit -m "feat: Add comprehensive testing and integration features"
```

### Final Integration
```bash
git checkout main
git merge feature/integration --no-ff
git commit -m "feat: Finalize production-ready implementation with comprehensive documentation"
```

---

## Troubleshooting Commands

### Undo Changes
```bash
git reset --hard HEAD      # Discard all local changes
git reset --soft HEAD~1    # Undo last commit, keep changes
git checkout -- <file>     # Discard changes in specific file
```

### Fix Mistakes
```bash
git commit --amend         # Modify last commit message
git rebase -i HEAD~3       # Interactive rebase of last 3 commits
git cherry-pick <commit>   # Apply specific commit to current branch
```

### Clean Up
```bash
git clean -fd              # Remove untracked files and directories
git gc                     # Garbage collect and optimize
git prune                  # Remove unreferenced objects
```

---

## Best Practices

### Commit Messages
- Use conventional commit format: `type(scope): description`
- Keep first line under 50 characters
- Use imperative mood ("Add" not "Added")
- Include bullet points for key changes

### Branching Strategy
- `main` - Production-ready code only
- `feature/*` - New features in development
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### Workflow Tips
- Commit frequently with small, focused changes
- Use descriptive branch names
- Always pull before pushing
- Test before merging to main
- Use `--no-ff` for feature branch merges

---

## Quick Status Check
```bash
# Check current status
git status

# See what branch you're on
git branch

# View recent commits
git log --oneline -5

# Check remote status
git remote -v
```

This cheat sheet covers all the Git commands you'll need for the 24-hour implementation challenge!
