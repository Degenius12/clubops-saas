# Notion Setup Guide for Claude Code Projects

## Quick Setup (Give this to Claude Desktop)

```
I need you to help me set up a simple project management system in Notion for tracking my Claude Code projects (ClubFlow, Voltmine AI, etc.).

Please create:

1. **Projects Database** with properties:
   - Name (Title)
   - Status (Select): Planning, Active, On Hold, Completed
   - Tech Stack (Multi-select): Next.js, React, TypeScript, Prisma, PostgreSQL, etc.
   - GitHub Repo (URL)
   - Current Focus (Text)
   - Last Worked On (Date)
   - Priority (Select): High, Medium, Low

2. **Tasks Database** with properties:
   - Task Name (Title)
   - Project (Relation to Projects)
   - Status (Select): To Do, In Progress, Done
   - Priority (Select): High, Medium, Low
   - Due Date (Date)
   - Notes (Text)
   - Completed Date (Date)

3. **Session Log Database** with properties:
   - Date (Date)
   - Project (Relation to Projects)
   - Summary (Text)
   - Completed Tasks (Relation to Tasks)
   - Time Spent (Number)
   - Next Steps (Text)

4. **Dashboard Page** with:
   - "Today's Focus" section (tasks due today or in progress)
   - "Active Projects" section (projects with status = Active)
   - "Recent Sessions" (last 5 session log entries)
   - "This Week" section (tasks due this week)

5. Create initial entries:
   - Project: "ClubFlow" (Active, High priority)
   - Project: "Voltmine AI Website" (Planning, Medium priority)

Set up filters and views that make it easy to see what I should work on today.
```

---

## Manual Setup (If you prefer to do it yourself)

### Step 1: Create Projects Database

1. Create a new database (table view)
2. Name it "Claude Projects"
3. Add these properties:
   - **Status**: Select (Planning, Active, On Hold, Completed)
   - **Tech Stack**: Multi-select (add tags as needed)
   - **GitHub Repo**: URL
   - **Current Focus**: Text
   - **Last Worked On**: Date
   - **Priority**: Select (High, Medium, Low)

4. Add your first project:
   ```
   Name: ClubFlow
   Status: Active
   Tech Stack: Next.js, React, TypeScript, Prisma, PostgreSQL
   GitHub Repo: [your repo URL]
   Priority: High
   ```

### Step 2: Create Tasks Database

1. Create a new database
2. Name it "Project Tasks"
3. Add these properties:
   - **Project**: Relation → link to "Claude Projects" database
   - **Status**: Select (To Do, In Progress, Done)
   - **Priority**: Select (High, Medium, Low)
   - **Due Date**: Date
   - **Notes**: Text
   - **Completed Date**: Date

4. Create a view called "Today" with filter:
   - Due Date is Today OR Status is In Progress

5. Create a view called "By Project" grouped by Project

### Step 3: Create Session Log Database

1. Create a new database
2. Name it "Session Log"
3. Add properties:
   - **Date**: Date (default to today)
   - **Project**: Relation to Projects
   - **Summary**: Text
   - **Completed Tasks**: Relation to Tasks
   - **Time Spent**: Number
   - **Next Steps**: Text

### Step 4: Create Dashboard

1. Create a new page called "Claude Projects Dashboard"
2. Add these sections:

   **Today's Focus:**
   - Linked database → Tasks
   - Filter: Due Date is Today OR Status is In Progress
   - Show as list

   **Active Projects:**
   - Linked database → Projects
   - Filter: Status is Active
   - Show as gallery or table

   **Recent Sessions:**
   - Linked database → Session Log
   - Sort: Date (newest first)
   - Limit to 5 entries

   **This Week:**
   - Linked database → Tasks
   - Filter: Due Date is within 7 days
   - Group by: Priority

---

## Using the System

### At Session Start:
1. Open Dashboard
2. Check "Today's Focus"
3. Copy/paste task list to share with Claude Code:
   ```
   PROJECT: ClubFlow
   CURRENT TASKS:
   - [ ] Task from Notion
   - [ ] Another task
   ```

### During Session:
Work with Claude Code as normal

### At Session End:
1. Claude Code gives you formatted session summary
2. Go to Session Log database
3. Click "New"
4. Paste session summary into Summary field
5. Link to project
6. Set date (auto-fills to today)

4. Go to Tasks database:
   - Mark completed tasks as "Done"
   - Add new tasks identified
   - Update in-progress tasks

### For TickTick Planning:
1. Look at "Next Steps" in latest session log
2. Copy top 3-5 items
3. Add to TickTick for tomorrow

---

## Templates

### Session Log Entry Template

Create a template in Notion for session log entries:

```markdown
## ✅ Completed
-

## 🔄 In Progress
-

## 📝 New Tasks
-

## 💡 Key Decisions
-

## 📚 Files Changed
-

## 🎯 Next Priority
1.
2.
3.

## 🐛 Issues/Blockers
-
```

### Task Entry Template

For quick task creation:
```
**Context:** [Why this task exists]
**Acceptance Criteria:** [How to know it's done]
**Related:** [Link to session log or other tasks]
```

---

## Views to Create

### In Tasks Database:

1. **Today**
   - Filter: Due Date = Today OR Status = In Progress
   - Sort: Priority (High first)

2. **This Week**
   - Filter: Due Date is within 7 days
   - Group by: Project
   - Sort: Due Date

3. **By Status**
   - Group by: Status
   - Sort: Priority

4. **Completed**
   - Filter: Status = Done
   - Sort: Completed Date (newest first)
   - Good for weekly reviews

### In Projects Database:

1. **Active Projects**
   - Filter: Status = Active
   - Sort: Last Worked On (newest first)

2. **All Projects**
   - No filter
   - Sort: Priority, then Last Worked On

---

## Quick Reference: Syncing with Claude Code

**What to share at start:**
```
PROJECT: [name]
TASKS: [3-5 most important]
CONTEXT: [any blockers or decisions needed]
```

**What Claude provides at end:**
- Formatted session summary
- Updated task statuses
- New tasks discovered
- Next priorities
- Files changed

**What you update in Notion:**
- Mark done tasks as "Done" ✓
- Add new tasks with [ ] checkbox
- Create session log entry
- Update project "Last Worked On" date
- Pull next priorities into TickTick

---

## Tips for Success

✅ **Keep it simple** - Don't over-engineer the system
✅ **Update after each session** - Takes 2-3 minutes, keeps everything current
✅ **Review weekly** - Look at completed items, plan next week
✅ **Use priorities** - Not everything is high priority
✅ **Link things** - Connect tasks to projects, sessions to tasks
✅ **Add context** - Future you will thank you for notes

❌ **Don't** create tasks for every tiny thing
❌ **Don't** stress about perfect organization
❌ **Don't** let it become a burden - it should help, not hinder
