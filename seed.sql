-- 1. Sample users:
-- hasło „Pass123!” zahashowane przy pomocy bcrypt (koszt 12)
INSERT INTO users (email, password_hash, role) VALUES
  ('org@example.com', '$2b$10$IRqMFAM3YtGUvApVUghDtOuStFuY9Ac1l2FddDzyrJCdKAITkEFz2', 'organizer'),
  ('alice@example.com', '$2b$10$IRqMFAM3YtGUvApVUghDtOuStFuY9Ac1l2FddDzyrJCdKAITkEFz2', 'participant');

-- 2. Sample events (organizator o id=1):
INSERT INTO events (title, description, date, capacity, organizer_id, image_url) VALUES
  ('Koncert rockowy', 'Wieczór z muzyką rockową na żywo.', '2025-07-10 19:00:00', 200, 1, '/images/event1.jpg'),
  ('Warsztaty fotograficzne', 'Nauka fotografii od podstaw.', '2025-07-15 10:00:00', 30, 1, '/images/event2.jpg'),
  ('Spektakl teatralny', 'Sztuka dramatyczna w reżyserii znanego artysty.', '2025-08-01 18:30:00', 100, 1, '/images/event2.jpg');

-- 3. Sample reservation (użytkownik o id=2 kupuje 2 bilety na wydarzenie o id=1):
INSERT INTO reservations (user_id, event_id, tickets) VALUES
  (2, 1, 2);
