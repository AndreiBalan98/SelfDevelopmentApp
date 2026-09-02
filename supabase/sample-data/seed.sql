-- Life Tracker — sample data for developing against
--
-- NOT a migration. It changes no structure, it's numbered nowhere, and it is
-- never run in the normal course of using the app. Paste it into the Supabase
-- SQL editor when you want screens to have something to draw, and run
-- `wipe.sql` next to it when you're done.
--
-- Everything it creates is marked so that wipe.sql can find it again and only
-- it: products and recipes are named "Sample …", and every other row carries
-- the note "sample data". Nothing here is subtle.
--
-- The dates are relative to whatever day you run it, so the data is always
-- "the last week" and the screens look alive. Run it, and it refuses politely
-- if the sample data is already there.
--
-- The week is deliberately awkward rather than tidy. It contains a retired
-- product pointing at the one that replaced it, eggs measured in pieces, milk
-- measured in millilitres, a 02:20 snack that counts towards the previous day,
-- and a skipped weigh-in for the weight chart to interpolate across. Those are
-- the cases that break screens; tidy data proves nothing.

do $$
declare
  -- Today in Bucharest, not in UTC. Getting this wrong would put the whole week
  -- on the wrong days for a few hours either side of midnight.
  d date := (now() at time zone 'Europe/Bucharest')::date;

  oats     bigint;
  oats2    bigint;
  eggs     bigint;
  milk     bigint;
  chicken  bigint;
  rice     bigint;
  choc     bigint;
  recipe   bigint;
  m        bigint;
begin
  if exists (select 1 from products where name like 'Sample %') then
    raise exception
      'The sample data is already in the database. Run wipe.sql first if you want a fresh copy.';
  end if;

  -- -------------------------------------------------------------------------
  -- Products
  -- -------------------------------------------------------------------------

  -- The oats you used to buy, and the oats you buy now that the price went up.
  -- This is the pattern from Part 4, rule 1: never edit a product that's been
  -- used, create a new one and point the old one at it. It's also what gives
  -- you a price history.
  insert into products
    (name, unit, package_price, package_quantity, ingredients_text,
     calories, protein, carbs, sugars_total, sugars_added, fibre, fat,
     saturated_fat, salt, retired)
  values
    ('Sample oats', 'g', 6.49, 1000, 'Wholegrain oat flakes.',
     379, 13.2, 60.1, 1.1, 0, 10.1, 6.9, 1.2, 0.02, true)
  returning id into oats;

  insert into products
    (name, unit, package_price, package_quantity, ingredients_text,
     calories, protein, carbs, sugars_total, sugars_added, fibre, fat,
     saturated_fat, salt)
  values
    ('Sample oats 2', 'g', 7.29, 1000, 'Wholegrain oat flakes.',
     379, 13.2, 60.1, 1.1, 0, 10.1, 6.9, 1.2, 0.02)
  returning id into oats2;

  update products set replaced_by = oats2 where id = oats;

  -- piece_grams is what lets you log "2 eggs" instead of "120 g".
  insert into products
    (name, unit, package_price, package_quantity, piece_grams,
     calories, protein, carbs, fat, saturated_fat, salt)
  values
    ('Sample eggs', 'g', 14.99, 600, 60,
     143, 12.6, 0.7, 9.5, 3.1, 0.34)
  returning id into eggs;

  -- Sold in millilitres, because the label is. 1 ml counts as 1 g when a
  -- recipe's raw weight is added up.
  insert into products
    (name, unit, package_price, package_quantity,
     calories, protein, carbs, sugars_total, sugars_added, fat,
     saturated_fat, salt)
  values
    ('Sample milk', 'ml', 5.49, 1000,
     46, 3.2, 4.7, 4.7, 0, 1.5, 1, 0.10)
  returning id into milk;

  insert into products
    (name, unit, package_price, package_quantity,
     calories, protein, carbs, fat, saturated_fat, salt)
  values
    ('Sample chicken breast', 'g', 32.90, 1000,
     106, 22.5, 0, 1.9, 0.6, 0.15)
  returning id into chicken;

  insert into products
    (name, unit, package_price, package_quantity,
     calories, protein, carbs, fibre, fat, saturated_fat, salt)
  values
    ('Sample rice', 'g', 8.99, 1000,
     349, 7.0, 77.5, 1.4, 1.0, 0.3, 0.01)
  returning id into rice;

  -- The one that shows what the two sugar figures mean. The label says 55.5 g
  -- of sugars; sugar is the first ingredient, so nearly all of it is added and
  -- 55.0 is the estimate. The two OVERLAP — added is part of the total, not an
  -- amount on top of it — which is why 55.5 is under the 59.4 g of carbohydrate
  -- rather than 110.5 being over it.
  insert into products
    (name, unit, package_price, package_quantity, ingredients_text,
     calories, protein, carbs, sugars_total, sugars_added, fibre, fat,
     saturated_fat, salt)
  values
    ('Sample chocolate', 'g', 4.29, 90,
     'Sugar, cocoa butter, cocoa mass, milk powder.',
     534, 7.8, 59.4, 55.5, 55.0, 7.0, 30.0, 18.5, 0.06)
  returning id into choc;

  -- -------------------------------------------------------------------------
  -- A recipe
  -- -------------------------------------------------------------------------
  -- 1100 g of ingredients cooked down to 1180 g — it gained weight, because the
  -- rice absorbed water. Shrinkage is calculated from the difference, never
  -- stored.

  insert into recipes (name, servings, cooked_weight, notes)
  values ('Sample chicken and rice', 4, 1180, 'sample data')
  returning id into recipe;

  insert into recipe_items (recipe_id, product_id, quantity) values
    (recipe, chicken, 800),
    (recipe, rice,    300),
    (recipe, milk,    100);

  -- -------------------------------------------------------------------------
  -- Meals
  -- -------------------------------------------------------------------------
  -- "at time zone 'Europe/Bucharest'" turns a wall-clock time into a real
  -- instant. 08:10 means 08:10 as the kitchen clock showed it, in summer and in
  -- winter alike.

  -- Four days ago: breakfast, then the recipe for lunch.
  insert into meals (eaten_at, day, type, note, score)
  values ((d - 4 + time '08:10') at time zone 'Europe/Bucharest', d - 4, 'meal', 'sample data', 7)
  returning id into m;
  insert into meal_items (meal_id, product_id, quantity, quantity_unit) values
    (m, oats2, 80,  'unit'),
    (m, milk,  250, 'unit');

  insert into meals (eaten_at, day, type, note, score)
  values ((d - 4 + time '13:30') at time zone 'Europe/Bucharest', d - 4, 'meal', 'sample data', 8)
  returning id into m;
  insert into meal_items (meal_id, recipe_id, servings) values (m, recipe, 1);

  -- Three days ago: two eggs, logged as pieces rather than grams.
  insert into meals (eaten_at, day, type, note)
  values ((d - 3 + time '08:25') at time zone 'Europe/Bucharest', d - 3, 'meal', 'sample data')
  returning id into m;
  insert into meal_items (meal_id, product_id, quantity, quantity_unit) values
    (m, eggs, 2, 'piece');

  insert into meals (eaten_at, day, type, note, score)
  values ((d - 3 + time '19:45') at time zone 'Europe/Bucharest', d - 3, 'meal', 'sample data', 6)
  returning id into m;
  insert into meal_items (meal_id, recipe_id, servings) values (m, recipe, 1.5);

  -- Eaten at 02:20, counted towards the day before. This is the 04:00 cutoff
  -- doing its job, and it's the row most likely to catch a bug in a daily total.
  insert into meals (eaten_at, day, type, note, score)
  values ((d - 1 + time '02:20') at time zone 'Europe/Bucharest', d - 2, 'snack', 'sample data', 3)
  returning id into m;
  insert into meal_items (meal_id, product_id, quantity, quantity_unit) values
    (m, choc, 45, 'unit');

  -- Yesterday: a mix of a weighed product and a counted one in the same meal.
  insert into meals (eaten_at, day, type, note, score)
  values ((d - 1 + time '12:05') at time zone 'Europe/Bucharest', d - 1, 'meal', 'sample data', 7)
  returning id into m;
  insert into meal_items (meal_id, product_id, quantity, quantity_unit) values
    (m, oats2, 60, 'unit'),
    (m, eggs,  1,  'piece');

  -- Today.
  insert into meals (eaten_at, day, type, note, score)
  values ((d + time '09:00') at time zone 'Europe/Bucharest', d, 'meal', 'sample data', 8)
  returning id into m;
  insert into meal_items (meal_id, product_id, quantity, quantity_unit) values
    (m, oats2, 70,  'unit'),
    (m, milk,  200, 'unit');

  -- -------------------------------------------------------------------------
  -- Sleep, weight, cigarettes — a week of each
  -- -------------------------------------------------------------------------

  insert into sleep (date, bedtime, wake_time, quality, notes) values
    (d - 6, '23:40', '07:10', 6, 'sample data'),
    (d - 5, '00:20', '07:05', 5, 'sample data'),
    (d - 4, '23:10', '07:00', 8, 'sample data'),
    (d - 3, '23:55', '06:50', 6, 'sample data'),
    (d - 2, '01:30', '08:20', 4, 'sample data'),
    (d - 1, '23:20', '07:15', 7, 'sample data'),
    (d,     '22:50', '06:55', 8, 'sample data');

  -- Four days ago is missing on purpose. A skipped weigh-in is what the chart
  -- has to draw a straight line across, and interpolated days are excluded from
  -- the TDEE estimate because they're invented rather than observed.
  insert into weight (date, kg, notes) values
    (d - 6, 78.4, 'sample data'),
    (d - 5, 78.9, 'sample data'),
    (d - 4, 78.1, 'sample data'),
    (d - 2, 77.8, 'sample data'),
    (d - 1, 78.2, 'sample data'),
    (d,     77.6, 'sample data');

  insert into smoking (date, count, notes) values
    (d - 6, 11, 'sample data'),
    (d - 5,  9, 'sample data'),
    (d - 4, 12, 'sample data'),
    (d - 3,  7, 'sample data'),
    (d - 2, 14, 'sample data'),
    (d - 1,  8, 'sample data'),
    (d,      6, 'sample data');

  -- -------------------------------------------------------------------------
  -- Targets
  -- -------------------------------------------------------------------------
  -- The settings row already exists and is left in place — only its empty
  -- target columns are filled, so progress bars have something to fill against.
  -- wipe.sql empties them again. Once you set real targets, be aware that a
  -- wipe clears those too.

  update settings set
    calorie_target  = 2200,
    protein_target  = 150,
    added_sugar_max = 40,
    fibre_min       = 30,
    daily_budget    = 45
  where id = 1;

  raise notice 'Sample data created: 7 products, 1 recipe, 7 meals, 7 nights, 6 weigh-ins, 7 days of cigarettes.';
end $$;
