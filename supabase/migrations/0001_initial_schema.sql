-- Life Tracker — initial schema
-- Every table except the gym module. Run this once, whole, in the Supabase SQL editor.
--
-- Two rules from the plan are enforced by the database itself rather than trusted to
-- the app:
--   * Deleting a product or recipe that has been used anywhere is REFUSED, never
--     cascaded (Part 4, rule 4). That's what "on delete restrict" does below.
--   * Nothing derived is stored. There are no total, average or shrinkage columns
--     anywhere — all of that is calculated when a screen is read.


-- ---------------------------------------------------------------------------
-- settings — exactly one row, forever
-- ---------------------------------------------------------------------------
-- The id column can only ever hold 1, so a second row is impossible. Targets are
-- left empty for now and filled in from the app.

create table settings (
  id                smallint primary key default 1 check (id = 1),
  calorie_target    integer       check (calorie_target > 0),
  protein_target    numeric(6,1)  check (protein_target >= 0),
  added_sugar_max   numeric(6,1)  check (added_sugar_max >= 0),
  fibre_min         numeric(6,1)  check (fibre_min >= 0),
  daily_budget      numeric(10,2) check (daily_budget >= 0),
  day_boundary_hour smallint not null default 4 check (day_boundary_hour between 0 and 23),
  created_at        timestamptz not null default now()
);

insert into settings (id) values (1);


-- ---------------------------------------------------------------------------
-- products — what you buy, entered once each
-- ---------------------------------------------------------------------------
-- Nutrition is per 100 units. Calories are required; everything else is optional,
-- because EU labels don't always carry it.
--
-- retired + replaced_by are how a price or nutrition change is handled: never edit
-- a used product, create a new one and point the old one at it (Part 4, rule 1).

create table products (
  id               bigint generated always as identity primary key,
  name             text not null check (length(trim(name)) > 0),
  unit             text not null check (unit in ('g', 'ml')),
  package_price    numeric(10,2) not null check (package_price >= 0),
  package_quantity numeric(10,2) not null check (package_quantity > 0),
  ingredients_text text,
  -- Grams in one piece: 1 egg = 60. Empty for anything sold loose.
  piece_grams      numeric(8,2) check (piece_grams > 0),

  -- Per 100 units.
  calories         numeric(7,2) not null check (calories >= 0),
  protein          numeric(7,2) check (protein >= 0),
  carbs            numeric(7,2) check (carbs >= 0),
  sugars_natural   numeric(7,2) check (sugars_natural >= 0),
  sugars_added     numeric(7,2) check (sugars_added >= 0),
  fibre            numeric(7,2) check (fibre >= 0),
  fat              numeric(7,2) check (fat >= 0),
  saturated_fat    numeric(7,2) check (saturated_fat >= 0),
  salt             numeric(7,3) check (salt >= 0),

  retired          boolean not null default false,
  replaced_by      bigint references products(id) on delete restrict,
  created_at       timestamptz not null default now(),

  -- A product can't be its own replacement.
  constraint product_not_replaced_by_itself check (replaced_by is distinct from id)
);


-- ---------------------------------------------------------------------------
-- recipes — built from products, make N servings
-- ---------------------------------------------------------------------------
-- cooked_weight is typed in after weighing the pan. Raw weight is calculated from
-- the lines (1 ml counts as 1 g), and the difference is the shrinkage — neither is
-- stored.
--
-- A recipe contains products only. There is deliberately no way for a recipe to
-- contain another recipe.

create table recipes (
  id            bigint generated always as identity primary key,
  name          text not null check (length(trim(name)) > 0),
  servings      integer not null check (servings > 0),
  cooked_weight numeric(10,2) check (cooked_weight > 0),
  notes         text,
  retired       boolean not null default false,
  replaced_by   bigint references recipes(id) on delete restrict,
  created_at    timestamptz not null default now(),

  constraint recipe_not_replaced_by_itself check (replaced_by is distinct from id)
);

create table recipe_items (
  id         bigint generated always as identity primary key,
  -- Deleting a recipe removes its own lines. That's safe: the lines belong to it
  -- and mean nothing on their own.
  recipe_id  bigint not null references recipes(id) on delete cascade,
  -- Deleting a product that a recipe uses is refused.
  product_id bigint not null references products(id) on delete restrict,
  quantity   numeric(10,2) not null check (quantity > 0),
  created_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- meals — what you ate
-- ---------------------------------------------------------------------------
-- "day" is which day the meal counts towards. The app fills it in from eaten_at
-- using the 04:00 cutoff, in Europe/Bucharest, but it's an ordinary editable
-- column so a 05:00 kebab can be moved with one tap.

create table meals (
  id         bigint generated always as identity primary key,
  eaten_at   timestamptz not null,
  day        date not null,
  type       text not null check (type in ('meal', 'snack')),
  note       text,
  score      smallint check (score between 1 and 10),
  created_at timestamptz not null default now()
);

-- Every screen that shows food asks "what did I eat on this day".
create index meals_day_idx on meals (day);

-- A meal line is EITHER a product or a recipe serving, never both and never
-- neither. The constraint at the bottom is what enforces that.
--
-- quantity_unit records what you actually typed:
--   'unit'  — the number is in the product's own unit, grams or millilitres
--   'piece' — the number is a count of pieces, converted using piece_grams
-- Storing what was typed rather than the converted value means the line still
-- reads "2 eggs" a year later instead of "120 g".

create table meal_items (
  id            bigint generated always as identity primary key,
  -- Deleting a meal removes its lines. Deleting a meal is always fine.
  meal_id       bigint not null references meals(id) on delete cascade,

  -- Deleting a product or recipe that has been eaten is refused.
  product_id    bigint references products(id) on delete restrict,
  recipe_id     bigint references recipes(id) on delete restrict,

  quantity      numeric(10,2) check (quantity > 0),
  quantity_unit text check (quantity_unit in ('unit', 'piece')),
  servings      numeric(6,2) check (servings > 0),

  created_at    timestamptz not null default now(),

  constraint meal_item_is_product_or_recipe check (
    (
      product_id is not null and recipe_id is null
      and quantity is not null and quantity_unit is not null
      and servings is null
    )
    or
    (
      recipe_id is not null and product_id is null
      and servings is not null
      and quantity is null and quantity_unit is null
    )
  )
);

create index meal_items_meal_id_idx    on meal_items (meal_id);
-- These two exist so that refusing a deletion is instant rather than a full scan.
create index meal_items_product_id_idx on meal_items (product_id);
create index meal_items_recipe_id_idx  on meal_items (recipe_id);
create index recipe_items_recipe_id_idx  on recipe_items (recipe_id);
create index recipe_items_product_id_idx on recipe_items (product_id);


-- ---------------------------------------------------------------------------
-- sleep · weight · smoking — one row per day
-- ---------------------------------------------------------------------------
-- "date" is unique on all three. That's not decoration: it's what stops the same
-- day being logged twice, so the app can warn instead of quietly duplicating.

-- date is the WAKE-UP date. bedtime is usually the evening before; when bedtime is
-- later than wake_time, the night crossed midnight. Duration is calculated, never
-- stored.
create table sleep (
  id         bigint generated always as identity primary key,
  date       date not null unique,
  bedtime    time,
  wake_time  time,
  quality    smallint check (quality between 1 and 10),
  notes      text,
  created_at timestamptz not null default now()
);

create table weight (
  id         bigint generated always as identity primary key,
  date       date not null unique,
  kg         numeric(5,2) not null check (kg > 0),
  notes      text,
  created_at timestamptz not null default now()
);

-- Skipped days stay missing rather than being written as zero. A day with no row
-- is "not logged"; a row with count 0 is "smoked nothing". Those are different
-- facts and the charts treat them differently.
create table smoking (
  id         bigint generated always as identity primary key,
  date       date not null unique,
  count      smallint not null check (count >= 0),
  notes      text,
  created_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- Lock everything down
-- ---------------------------------------------------------------------------
-- Row Level Security on, with no policies written, means: the anonymous and
-- logged-in roles can read and write nothing at all. There is no policy to get
-- wrong because there are no policies.
--
-- The app reaches the database as service_role, which bypasses this entirely, and
-- that key only ever exists on the server. So a leaked project URL gets nothing.

alter table settings     enable row level security;
alter table products     enable row level security;
alter table recipes      enable row level security;
alter table recipe_items enable row level security;
alter table meals        enable row level security;
alter table meal_items   enable row level security;
alter table sleep        enable row level security;
alter table weight       enable row level security;
alter table smoking      enable row level security;

-- Belt and braces: take the table permissions away too, so those roles are blocked
-- twice over.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
