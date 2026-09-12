-- Life Tracker — remove the sample data
--
-- The other half of seed.sql. Run this before you start logging anything real,
-- so the invented week doesn't end up mixed into your actual history.
--
-- It only ever touches rows that seed.sql created: products and recipes named
-- "Sample …", and rows noted "sample data". Anything you logged yourself is
-- matched by none of that and is left alone.
--
-- It's one block, so it either all happens or none of it does. If it stops, the
-- database is exactly as it was before you ran it.
--
-- Order matters. The database refuses to delete a product or recipe that has
-- been used, so the meals go first — their lines go with them automatically —
-- and the replaced_by links are cut before the products they point at are
-- removed. This is Part 4, rule 4: refuse, never cascade.

do $$
begin
  delete from sleep   where notes = 'sample data';
  delete from weight  where notes = 'sample data';
  delete from smoking where notes = 'sample data';

  -- Deleting a meal always takes its own lines with it and nothing else.
  delete from meals where note = 'sample data';

  update recipes set replaced_by = null where name like 'Sample %';
  delete from recipes where name like 'Sample %';

  update products set replaced_by = null where name like 'Sample %';
  delete from products where name like 'Sample %';

  -- Clears the targets seed.sql filled in. If you have set real targets since,
  -- write them down before running this — it empties them too.
  update settings set
    calorie_target  = null,
    protein_target  = null,
    added_sugar_max = null,
    fibre_target    = null,
    daily_budget    = null
  where id = 1;

  raise notice 'Sample data removed.';

exception
  -- "on delete restrict" raises restrict_violation (23001), not the
  -- foreign_key_violation (23503) you'd expect. Both are caught, because which
  -- one comes back depends on how the constraint was declared.
  when restrict_violation or foreign_key_violation then
    raise exception
      'Something you logged for real uses the sample data, so it was refused. Nothing has been deleted. Find the meal or recipe that uses a "Sample …" product, delete that first, then run this again.';
end $$;
