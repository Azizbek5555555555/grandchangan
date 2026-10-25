---
name: "parallel-agents"
description: "Use in large projects (e.g. LevelX, GrandChangan) when a task is big enough to split across subagents or an agent team for speed and quality."
---

# Parallel agents: subagents and agent teams

The user has given standing permission to use subagents and agent teams when a task is heavy. Use them to raise quality and keep the main context clean, not by default. Every extra agent costs usage limit, so pick the lightest option that does the job.

## Decide first

1. Single session (no extra agents) when:
   - the change touches a few files or one feature
   - steps are sequential and depend on each other
   - most work is in the same files
2. Subagents when:
   - you need to search or read a large codebase and only the conclusion matters
   - you want an independent review or verification of your own work
   - there are 2-5 independent, well-defined subtasks that only report back
3. Agent team when ALL of these hold:
   - the work splits into independent parts with separate file ownership (e.g. frontend / API / tests, or several separate modules)
   - parts benefit from talking to each other or challenging each other (debugging with competing hypotheses, multi-angle review)
   - agent teams are enabled (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1). If not enabled, fall back to subagents and say so in one line.

Before spawning, state in one line which option you chose and why.

## Standard subagent uses

- Explore: "Map how X works: files, data flow, Prisma models involved. Return a short summary with file paths."
- Plan check: give the plan to a subagent and ask it to find gaps, edge cases, missing i18n keys, missing validation.
- Independent review after implementation: a fresh subagent that did not write the code reviews the diff for bugs, type errors, security issues (auth, input validation, secrets), uz/ru translation gaps, mobile layout.
- Verification: run npm run build, lint, type check, tests; report only failures with file and line.

## Agent team rules

- Team size: 2-4 teammates. More only if there are clearly more independent parts.
- Give each teammate a name, a clear goal, the files it owns, and the files it must not touch.
- No two teammates edit the same file. Shared files (schema.prisma, i18n message files, shared types, package.json) have exactly one owner; others send requests to that owner.
- Teammates do not see the lead's conversation. Each spawn prompt must include: project stack, the relevant part of the task, file ownership, conventions (complete files, zod validation, next-intl keys in all locales, no push to main), and the definition of done.
- Split work into self-contained tasks with a clear deliverable (a component, an API route, a test file). Aim for several tasks per teammate.
- The lead coordinates and waits; it does not start doing teammates' tasks itself.
- When all tasks are done: the lead integrates, runs the full build, and spawns one fresh reviewer (subagent or teammate) to review the combined diff.
- Shut teammates down when finished.

## Spawn prompt template

```
Role: <name> - <one-line role>
Project: <name>, Next.js App Router + TypeScript + Tailwind + Prisma, bilingual (uz + ru/en via next-intl)
Goal: <specific outcome>
You own: <files/folders>
Do not edit: <files/folders owned by others>; ask <owner> via message if you need a change there
Rules: complete files, zod-validate inputs, add i18n keys to all locales, no secrets in code, no push to main, no production deploy or DB migration
Done when: <checkable criteria>; npm run build passes for your part
Report: what you changed (file list), open issues, anything the lead must integrate
```

## Safety

- Never run production deploys, database migrations on production data, force pushes, or destructive deletes from any agent. Leave them for the user and list them in the final report.
- Do not paste .env values or secrets into spawn prompts.

## Final report (to the user)

- Which option was used (single / subagents / team) and why
- What each agent did, in one line each
- Files changed
- Review findings and how they were fixed
- What the user must do: env vars, migrations, deploy, manual checks