-- Life Tracker — say what the sugars column actually holds
--
-- Run this after 0003, in the Supabase SQL editor.
--
-- WHAT THIS IS ABOUT
--
-- A product carries two sugar figures. Until now the first one was called
-- `sugars_natural`, but that is not what goes in it. The product form asks you
-- to copy the packet's "of which sugars" line straight across, and that line is
-- the TOTAL sugar in the food — natural and added together. The second figure,
-- `sugars_added`, is your own estimate of how much of that total was added,
-- because no EU label ever tells you.
--
-- So the two numbers overlap. Added is a part of the total, not something to
-- add to it. Natural sugar, if it is ever wanted, is the total minus the added,
-- worked out when a screen is drawn and never stored.
--
-- The old name said the opposite, and a name that lies is how a wrong number
-- ends up on every screen at once while looking completely fine. This renames
-- it to match what it holds.
--
-- WHAT HAPPENS TO EXISTING DATA
--
-- Nothing moves. Every value stays exactly where it is, under a new name. That
-- is correct, because the form has always asked for the packet figure here, so
-- what you have already typed is already a total.
--
-- The one thing worth checking afterwards is any product where you typed a
-- natural-only figure by hand. There should be none, but a product that has
-- already been eaten is frozen, so correcting one means retiring it and making
-- a replacement rather than editing it.

alter table products rename column sugars_natural to sugars_total;

-- The "must not be negative" rule was created with the column, so it still
-- carries the old name. Renaming it keeps the two in step; without this, a
-- rejected value would report a constraint nobody can find in the schema.
alter table products rename constraint products_sugars_natural_check
  to products_sugars_total_check;

-- Written into the database itself, so the meaning travels with the column
-- rather than living only in this file.
comment on column products.sugars_total is
  'Total sugars per 100 units, copied straight off the label. sugars_added is your estimate of how much of THIS figure is added sugar, not a further amount on top.';

comment on column products.sugars_added is
  'Your estimate, per 100 units, of how much of sugars_total was added rather than naturally present. Never stated on an EU label. Null means you could not tell, which is not the same as zero.';
