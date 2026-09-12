-- Life Tracker — everything the phase 7 Settings tab holds
--
-- Run this after 0004, in the Supabase SQL editor. Run it just before pushing
-- the step 7.3 code: the new Settings screen needs these columns, and the
-- screen that's live now still reads `fibre_min`, so between running this and
-- the new version going live, the day screen shows no fibre target and the old
-- Settings screen can't save. Nothing is lost either way.
--
-- WHAT THIS DOES
--
-- 1. Renames `fibre_min` to `fibre_target`. Fibre is now a ±10% zone to land
--    in, not a minimum, and a column whose name says the opposite of what it
--    holds is how a wrong number ends up on every screen. Your fibre target
--    keeps its value; only the name changes.
--
-- 2. Adds the rest of the settings, all empty to start with except the fat
--    ratio, which starts at 1 : 2:
--
--      carbs_target     grams a day, a ±10% zone
--      fat_target       grams a day, a ±10% zone
--      unsat_per_sat    the fat ratio 1 : N — this is the N. Starts at 2.
--      goal_phase       cut, maintain or bulk. Switches how calories are
--                       judged: a ceiling on a cut, a ±10% zone otherwise.
--      goal_weight      kg
--      height_cm        for the formula estimate
--      birth_year       for the formula estimate (it needs your age)
--      sex              male or female, for the formula estimate
--      activity_level   sedentary, light, moderate or very_active
--      gym_start_date   what the Workout tab counts down to
--
-- Every one of them can be left empty. Empty means "not decided", which the
-- app treats differently from zero.
--
-- It all happens together or not at all: if any line fails, nothing changes
-- and it can simply be run again once the problem is fixed.

begin;

alter table settings rename column fibre_min to fibre_target;

-- The "must not be negative" rule was created with the column, so it still
-- carries the old name. Renamed to match, as 0004 did for sugars.
alter table settings rename constraint settings_fibre_min_check
  to settings_fibre_target_check;

alter table settings
  add column carbs_target   numeric(6,1) check (carbs_target >= 0),
  add column fat_target     numeric(6,1) check (fat_target >= 0),
  add column unsat_per_sat  numeric(4,2) default 2 check (unsat_per_sat > 0),
  add column goal_phase     text check (goal_phase in ('cut', 'maintain', 'bulk')),
  add column goal_weight    numeric(5,2) check (goal_weight > 0),
  add column height_cm      numeric(4,1) check (height_cm > 0),
  add column birth_year     integer check (birth_year between 1900 and 2100),
  add column sex            text check (sex in ('male', 'female')),
  add column activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'very_active')),
  add column gym_start_date date;

-- Written into the database itself, so the meaning travels with the columns
-- rather than living only in this file.
comment on column settings.fibre_target is
  'Fibre a day, in grams. A ±10% zone to land in, not a minimum. Was fibre_min until migration 0005.';

comment on column settings.unsat_per_sat is
  'The fat ratio saturated : unsaturated, written 1 : N — this is N. Saturated fat is over the limit when it is more than 1 / (1 + N) of total fat.';

comment on column settings.goal_phase is
  'cut, maintain or bulk. On a cut calorie_target is a ceiling; on maintain or bulk it is a ±10% zone.';

commit;
