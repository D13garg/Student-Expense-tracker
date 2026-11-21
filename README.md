# SpendWise – Student Expense Tracker

## Project overview

SpendWise is a browser-based application for recording personal income and expenses. It is designed with students in mind, so that day-to-day spending and monthly budgets can be viewed in one place.

The project was developed using HTML, CSS and JavaScript. It does not require a server or a database. Transaction and preference data are saved in the browser using LocalStorage.

**GitHub repository:** Add your repository link here after creating it.

## Project objectives

The main objectives of this project are:

1. To develop a working expense-tracking application.
2. To practise organising a front-end project into separate files and modules.
3. To use charts to present financial information.
4. To practise Git operations such as committing, branching, pushing and merging.
5. To create and resolve an intentional merge conflict and document the process.

## Main features

- Dashboard showing balance, income, expenses and budget information.
- Add, edit and delete income or expense transactions.
- Search, filter and sort transaction records.
- Expense and income categories.
- Monthly and category budget limits.
- Charts for category distribution and spending over time.
- CSV export for transaction records.
- Light and dark themes.
- LocalStorage support so data remains after a page refresh.
- Sample data option for trying the dashboard.

## Technologies used

| Technology | Use in this project |
|---|---|
| HTML5 | Page structure |
| CSS3 | Layout, styling and responsive design |
| JavaScript (ES6+) | Application behaviour and calculations |
| Chart.js | Data visualisation |
| LocalStorage | Saving data in the browser |
| Git | Tracking changes and managing branches |
| GitHub | Hosting the remote repository |

Chart.js, Font Awesome and the web font are loaded from online CDNs. An internet connection is therefore needed for those external resources to load.

## Project structure

```text
student-expense-tracker/
├── index.html
├── README.md
├── .gitignore
├── GIT_WORKFLOW.md
├── MERGE_CONFLICT_GUIDE.md
├── TESTING.md
├── SUBMISSION_CHECKLIST.md
├── REFLECTION_REPORT.md
├── css/
│   ├── style.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── budget.js
│   ├── charts.js
│   ├── dashboard.js
│   ├── expenses.js
│   ├── sample-data.js
│   ├── storage.js
│   └── utils.js
├── assets/
│   └── images/
└── screenshots/
```

## How to run the project

1. Download or clone the repository.
2. Extract the ZIP if you downloaded the project as an archive.
3. Open the `student-expense-tracker` folder.
4. Open `index.html` in a modern browser.

A local server can also be used. On macOS or Linux, if Python 3 is installed, run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in the browser. On Windows, the command may be `py -m http.server 8000` or `python -m http.server 8000`, depending on the installation.

Use the sample-data option in Settings if you want to see the charts with example transactions. Do not use sample data as evidence of your own real spending.

## Screenshots

Add screenshots that you capture yourself to the `screenshots/` folder. Suggested screenshots:

- Main dashboard
- Transactions page
- Budget page
- Analytics page
- Dark theme
- Merge conflict in the terminal or editor
- Resolved file and final Git history

Use the actual filenames in the image links below after you have saved the screenshots.

<!-- Example:
![Dashboard](screenshots/dashboard.png)
-->

## Git workflow and merge conflict

The Git part of the assignment is performed separately from building the application. Start by creating a local repository and making an initial commit. Then connect the local repository to a new GitHub repository.

For the conflict demonstration, create two feature branches from the same `main` commit:

- `feature/budget-system`
- `feature/expense-categories`

Both branches will change the same return line in `js/dashboard.js`. Merge the budget branch into `main` first. Then merge the category branch. Git should report a content conflict because the same line was changed differently on the two branches.

Inspect the conflict with `git status` and `git diff`, edit the file to keep the chosen final title, stage the resolved file and complete the merge commit. Follow `MERGE_CONFLICT_GUIDE.md` for the exact steps.

## Learning outcomes

By completing this project, I expect to improve my understanding of:

- Building a small application with separate HTML, CSS and JavaScript files.
- Handling user input and validating form data.
- Saving and retrieving information with LocalStorage.
- Presenting data using charts.
- Tracking changes with Git commits.
- Creating branches and combining work with merges.
- Investigating and resolving a merge conflict.

## Project status

The source code is provided as a local project. The GitHub URL, screenshots, testing results and reflection should be completed by the student after running the application and performing the Git workflow.
