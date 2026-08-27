CREATE TABLE organizations (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id              serial PRIMARY KEY,
  organization_id integer NOT NULL REFERENCES organizations(id),
  email           text NOT NULL UNIQUE,
  role            text NOT NULL DEFAULT 'member',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id          serial PRIMARY KEY,
  user_id     integer NOT NULL REFERENCES users(id),
  token       text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id              serial PRIMARY KEY,
  organization_id integer NOT NULL REFERENCES organizations(id),
  name            text NOT NULL,
  description     text NOT NULL DEFAULT '',
  status          text NOT NULL DEFAULT 'active', -- active | paused | archived
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id          serial PRIMARY KEY,
  project_id  integer NOT NULL REFERENCES projects(id),
  title       text NOT NULL,
  done        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX projects_organization_id_idx ON projects (organization_id);
CREATE INDEX tasks_project_id_idx ON tasks (project_id);
