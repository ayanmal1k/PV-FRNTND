alter table agents
add column if not exists email text;

-- Backfill from user profile email when agent is linked to a user.
update agents a
set email = p.email
from profiles p
where a.user_id = p.id
  and a.email is null
  and p.email is not null;

-- Fallback backfill from auth.users email.
update agents a
set email = u.email
from auth.users u
where a.user_id = u.id
  and a.email is null
  and u.email is not null;

-- Final fallback from linked agency email.
update agents a
set email = ag.email
from agencies ag
where a.agency_id = ag.id
  and a.email is null
  and ag.email is not null;
