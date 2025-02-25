# Git Workflow Guide

This document outlines the standard workflow for making changes, updating your branch with the latest changes from `main`, and creating pull requests.

## Step-by-Step Workflow

### 1. Verify Your Working Branch

First, ensure you're on your feature branch before making changes:

```bash
git branch
```

You should see something like:
```
  main
* your-branch
```

The asterisk (*) indicates your current branch. Make sure it's pointing to your feature branch.

### 2. Make Your Changes and Commit

After making your changes, commit them to your branch:

```bash
git add .
git commit -m "Your descriptive commit message"
```

### 3. Update Your Branch with Latest Changes from Main

To prevent merge conflicts in your PR, first update your branch with the latest changes from `main`:

```bash
# Switch to main
git checkout main

# Get the latest changes
git fetch origin main && git pull

# Switch back to your branch
git checkout your-branch

# Merge main into your branch
git merge main
```

### 4. Resolve Any Merge Conflicts

If there are merge conflicts, they will be shown in your terminal. Open the conflicted files in your editor and resolve the conflicts. 

Conflicts appear like this:
```
<<<<<<< HEAD
Your changes
=======
Changes from main
>>>>>>> main
```

Edit the files to keep the code you want, then save.

### 5. Push Your Changes

After resolving conflicts, push your changes to the remote repository:

```bash
git push
```

If this is the first time pushing your branch, you may need to set the upstream branch:
```bash
git push -u origin your-branch
```

### 6. Create a Pull Request

Go to GitHub and create a pull request from your branch to `main`.

## Example Workflow

```bash
# Check current branch (should show you're on your branch)
git branch
  main
* ayush

# Stage and commit your changes
git add .
git commit -m "Add new feature"

# Update with the latest from main
git checkout main
git fetch origin main
git pull

# Return to your branch and merge
git checkout ayush
git merge main

# Resolve any merge conflicts in your editor

# Push your changes
git push

# Open a PR from your branch on GitHub
```
