-- Add geolocation to ritual_blueprints for nearby discovery
ALTER TABLE ritual_blueprints ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE ritual_blueprints ADD COLUMN IF NOT EXISTS lat double precision;

-- Add a routine_type column for color coding on the map
ALTER TABLE ritual_blueprints ADD COLUMN IF NOT EXISTS routine_type text default 'other';

-- Index for geo queries
CREATE INDEX IF NOT EXISTS idx_blueprints_geo ON ritual_blueprints(lng, lat);

-- Seed some example rituals in Denver for demo purposes
-- These show up as "nearby rituals" when someone opens Build mode in Denver
INSERT INTO lodges (id, name, type, cadence, preferences, keeper_name, keeper_phone, keeper_timezone) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Tuesday Morning Walk', 'build', 'weekly', '{"walk"}', 'Alex', '+10000000001', 'America/Denver'),
  ('00000000-0000-0000-0000-000000000002', 'Sunday Cook Club', 'build', 'weekly', '{"cook"}', 'Sam', '+10000000002', 'America/Denver'),
  ('00000000-0000-0000-0000-000000000003', 'Gym Buddy - Mornings', 'build', 'weekly', '{"gym"}', 'Jordan', '+10000000003', 'America/Denver'),
  ('00000000-0000-0000-0000-000000000004', 'Coffee & Work Wednesdays', 'build', 'weekly', '{"coffee"}', 'Maya', '+10000000004', 'America/Denver'),
  ('00000000-0000-0000-0000-000000000005', 'Saturday Trail Run', 'build', 'weekly', '{"walk"}', 'Chris', '+10000000005', 'America/Denver')
ON CONFLICT DO NOTHING;

INSERT INTO ritual_blueprints (lodge_id, routine, city, day_time, group_size, framing_copy, session_scaffolding, routine_type, lng, lat) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Morning walk', 'Denver, CO', 'Tuesday & Thursday, 7:30am', 2, 'Come walk with me at Sloan''s Lake Tuesday mornings. I go anyway — just nicer with someone.', '{"Session 1: Walk the lake loop (2.5mi). No pressure to talk the whole time — earbuds in is fine.", "Session 2: Same route. Grab coffee at the cart by the boathouse after.", "Session 3: By now you have a route and a rhythm. This is just what Tuesdays are."}', 'walk', -105.0353, 39.7508),
  ('00000000-0000-0000-0000-000000000002', 'Sunday cooking', 'Denver, CO', 'Sundays, 5pm', 3, 'I meal prep every Sunday anyway. Come cook with me — we split groceries, leave with a week of food.', '{"Session 1: Everyone brings one recipe they already know. Cook in parallel, share the results.", "Session 2: Pick a cuisine none of you have tried. Split the grocery run beforehand.", "Session 3: Potluck style — you each own a dish now. This is your Sunday thing."}', 'cook', -104.9903, 39.7392),
  ('00000000-0000-0000-0000-000000000003', 'Morning gym session', 'Denver, CO', 'Weekdays, 6:30am', 2, 'I''m at Colorado Athletic Club every morning at 6:30. Need someone to make sure I actually go.', '{"Session 1: Meet at the entrance. Do your own workouts but spot each other on bench/squat.", "Session 2: Try a workout one of you has been doing. Teach each other something.", "Session 3: You have a gym partner now. Missing feels like letting someone down — that''s the point."}', 'gym', -104.9847, 39.7486),
  ('00000000-0000-0000-0000-000000000004', 'Work from a cafe', 'Denver, CO', 'Wednesdays, 10am-1pm', 3, 'I work from Thump Coffee on Wednesdays. Come be productive near someone instead of alone at home.', '{"Session 1: Show up, grab a table near each other. Work independently. Take a 15-min coffee break together at 11:30.", "Session 2: Same cafe, same time. Compare what you''re working on over the break.", "Session 3: You have a Wednesday spot now. The barista knows your order."}', 'coffee', -104.9811, 39.7554),
  ('00000000-0000-0000-0000-000000000005', 'Trail run', 'Denver, CO', 'Saturdays, 8am', 2, 'Saturday morning trail run at Red Rocks. I do it solo but it''d be better with someone to pace with.', '{"Session 1: Meet at the Trading Post trailhead. Easy 3-mile loop to see if your paces match.", "Session 2: Try the longer loop (5mi). Bring water. Post-run breakfast at a diner.", "Session 3: This is your Saturday morning now. Pick next week''s trail together."}', 'walk', -105.2056, 39.6655)
ON CONFLICT DO NOTHING;
