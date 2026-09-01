-- Life Tracker — remember when the last export happened
--
-- Run this after 0002, in the Supabase SQL editor.
--
-- One column on the settings row. It's what the "backed up 3 days ago" line on the
-- home screen reads. It lives in the database rather than on the phone because iOS
-- wipes a home-screen app's stored data after roughly a week of not opening it —
-- which is exactly the moment the reminder would need to be shouting at you.
--
-- Honest limitation: this records that the file was HANDED to you, not that you
-- saved it. Tap export and then cancel the share sheet and the clock still resets.

alter table settings add column last_export_at timestamptz;
