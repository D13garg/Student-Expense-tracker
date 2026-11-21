# Intentional Merge Conflict Guide

This guide explains how I will create and resolve the intentional merge conflict required for the assignment. I will run the commands myself in the terminal inside the `student-expense-tracker` folder.

The ZIP does not contain a Git repository or pre-created commits. The conflict will be produced by Git during the merge operation.

## 1. File used for the conflict

The conflict will be created in:

```text
js/dashboard.js
```

Find the function:

```javascript
function getDashboardTitle() {
    return "Student Expense Tracker";
}
```

This is the original version. Both feature branches must begin with this same version of the file.

## 2. Create the common starting point

Complete the initial Git setup and initial commit by following `GIT_WORKFLOW.md`.

Before creating the branches, check that `main` is the current branch and that the working tree is clean:

```bash
git switch main
git status
git log --oneline
```

If I used the optional remote-update exercise, the common starting point is the latest `main` commit after the pull. The important requirement is that both feature branches start from the same commit.

## 3. First independent change: budget branch

Create the first branch:

```bash
git switch -c feature/budget-system
```

In `js/dashboard.js`, change the function to:

```javascript
function getDashboardTitle() {
    return "Monthly Budget Dashboard";
}
```

Save the file and review the change:

```bash
git status
git diff
```

Stage and commit it:

```bash
git add js/dashboard.js
git commit -m "Change dashboard title for budget feature"
```

This commit belongs only to `feature/budget-system` at this point.

## 4. Second independent change: category branch

Switch back to the original `main` branch:

```bash
git switch main
```

Before creating the second branch, open `js/dashboard.js` and confirm that it again contains the original title:

```javascript
function getDashboardTitle() {
    return "Student Expense Tracker";
}
```

Now create the second branch:

```bash
git switch -c feature/expense-categories
```

Change the same function to:

```javascript
function getDashboardTitle() {
    return "Expense Categories Overview";
}
```

Save, inspect and commit:

```bash
git status
git diff
git add js/dashboard.js
git commit -m "Change dashboard title for expense categories"
```

The two branches have now changed the same line in different ways. They must remain independent until the merge steps below.

Check the branches and history:

```bash
git branch
git log --oneline --graph --all
```

The graph should show both feature commits connected to the same common starting commit.

## 5. Merge the budget branch first

Switch to `main`:

```bash
git switch main
```

Merge the budget branch:

```bash
git merge --no-ff feature/budget-system -m "Merge budget feature"
```

This merge should succeed because `main` has not yet received the category branch's change. The title on `main` should now be `Monthly Budget Dashboard`.

Check:

```bash
git status
```

## 6. Attempt to merge the category branch

Now run:

```bash
git merge feature/expense-categories
```

Git should report a content conflict in `js/dashboard.js`. The two branches changed the same line after their common starting point, and Git cannot choose which title should be kept.

The merge pauses so that I can resolve the file. This is the intentional conflict required by the assignment.

## 7. Understand the conflict markers

Open `js/dashboard.js`. The conflicting function should look similar to this:

```text
function getDashboardTitle() {
<<<<<<< HEAD
    return "Monthly Budget Dashboard";
=======
    return "Expense Categories Overview";
>>>>>>> feature/expense-categories
}
```

The markers have these meanings:

| Marker | Meaning |
|---|---|
| `<<<<<<< HEAD` | Starts the version from the branch currently checked out, which is `main` |
| `=======` | Separates the two versions |
| `>>>>>>> feature/expense-categories` | Ends the incoming branch's version |

The markers are added by Git to show the competing changes. They are not valid JavaScript and must be removed during resolution.

## 8. Inspect the conflict

Run:

```bash
git status
git diff
```

`git status` should show that `js/dashboard.js` is unmerged. `git diff` helps me inspect the changes that could not be combined automatically.

I should take a screenshot of the terminal output and, if useful, another screenshot of the file showing the conflict markers before editing it.

## 9. Resolve the conflict manually

I will keep a title that represents the overall application and both areas of work.

Replace the entire conflicted function with:

```javascript
function getDashboardTitle() {
    return "Student Expense & Budget Dashboard";
}
```

Save the file. Make sure all three conflict markers have been removed.

The budget and category functionality is implemented in the application modules. The title is being combined to describe the application; the resolution does not replace or remove those features.

## 10. Stage and complete the merge

Run:

```bash
git add js/dashboard.js
git status
```

Git should now show that the conflict has been resolved and that the merge is ready to be committed.

Complete the merge:

```bash
git commit -m "Resolve dashboard title merge conflict"
```

## 11. Verify the final result

Run:

```bash
git status
git log --oneline --graph --all
git grep -n "<<<<<<<"
```

Check that:

- `git status` reports a clean working tree.
- The history shows both feature branches and the merge commits.
- `git grep` does not find conflict markers in tracked files.
- The application opens and displays the final dashboard title.
- Existing budget and category features still work.

Push the completed branches to GitHub:

```bash
git push origin main
git push origin feature/budget-system
git push origin feature/expense-categories
```

## 12. Evidence to capture

Use screenshots taken during my own work. Suggested evidence:

1. `git branch` showing the two feature branches.
2. `git log --oneline --graph --all` before merging.
3. Terminal output from the successful first merge.
4. Terminal output showing the second merge conflict.
5. `js/dashboard.js` with the conflict markers.
6. The manually resolved function.
7. `git status` after staging the resolution.
8. Final commit history.
9. GitHub repository showing the branches and commits.

## 13. If something does not go as expected

- **No conflict appears:** Check that both branches were created from the same starting commit and that each changed the same return line differently. Do not create the second branch from the already-merged `main`.
- **Git says the working tree is not clean:** Check `git status` and commit or safely set aside unrelated changes before switching branches.
- **The merge is in progress and I need to cancel it:** `git merge --abort` returns the repository to the state before the current merge attempt. Use this only if I want to abandon that attempt and try again.
