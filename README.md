# Annotech Project Tracker

Internal tool for tracking projects and their tasks for the organizations Annotech
works with. Each organization has its own users, projects and tasks. A user signs in
with a bearer token and sees only their own organization's data.

## Layout

```
db/            PostgreSQL schema and migrations
be/node        Express API
be/go          Go (net/http) API
be/csharp      ASP.NET Core API
ui/angular     Angular frontend
ui/react       React frontend
ui/vue         Vue frontend
```

The three backends expose the same API and the three frontends consume it. Only one
backend and one frontend are deployed per environment; the others exist so teams can
work in the stack they already know.

## API

```
GET /api/projects        projects belonging to the caller's organization
GET /api/projects/:id    a single project
```

All `/api` routes require `Authorization: Bearer <token>`. The token is resolved to a
user, and the user's organization scopes every query.

## Current usage

Production currently has around 40 organizations, 8,000 projects and 400,000 tasks.
The largest single organization has about 2,100 projects.

## Local development

Apply `db/schema.sql` to an empty PostgreSQL database, then run the local seed script.
It creates 3 organizations with 12 projects each and a few tasks per project, plus one
user and session token per organization.

Set `DATABASE_URL` (backends) and the API base URL (frontends, see each `config` file)
before starting.
