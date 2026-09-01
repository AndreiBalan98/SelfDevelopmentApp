-- Life Tracker — failed login attempts
--
-- Run this after 0001. It exists for one reason: a 6-digit PIN is only a million
-- possibilities, and Vercel will happily run hundreds of copies of the app at once
-- for someone guessing. Slow hashing alone doesn't stop that.
--
-- Only FAILURES are recorded, and only the time. No PIN, no attempted PIN, no IP
-- address — none of it would make the lockout work any better, and all of it would
-- be something else worth stealing.
--
-- Five failures inside fifteen minutes and login refuses until the oldest of those
-- five ages out. A successful login clears the table.

create table login_attempts (
  id bigint generated always as identity primary key,
  at timestamptz not null default now()
);

-- Every check asks "how many failures since a moment fifteen minutes ago".
create index login_attempts_at_idx on login_attempts (at);

-- Same lockdown as every other table: security on, no access rules, so the public
-- roles can do nothing at all. Only the server, holding the secret key, gets in.
alter table login_attempts enable row level security;

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
