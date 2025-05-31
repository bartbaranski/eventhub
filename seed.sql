-- 1. Sample users:
-- hasło „Pass123!” zahashowane przy pomocy bcrypt (koszt 12)
INSERT INTO users (email, password_hash, role) VALUES
  ('org@example.com', '$2b$10$IRqMFAM3YtGUvApVUghDtOuStFuY9Ac1l2FddDzyrJCdKAITkEFz2', 'organizer'),
  ('alice@example.com', '$2b$10$IRqMFAM3YtGUvApVUghDtOuStFuY9Ac1l2FddDzyrJCdKAITkEFz2', 'participant');

-- 2. Sample events (organizator o id=1):
INSERT INTO events (title, description, date, capacity, organizer_id) VALUES
  ('Go Workshop',    'Podstawy języka Go',               '2025-06-15 10:00:00', 50, 1),
  ('Docker Meetup',  'Spotkanie o konteneryzacji',      '2025-07-01 18:00:00', 30, 1),
  ('Hackathon',      '24-godzinne wyzwanie programistyczne','2025-08-20 09:00:00', 100, 1);

-- 3. Sample reservation (użytkownik o id=2 kupuje 2 bilety na wydarzenie o id=1):
INSERT INTO reservations (user_id, event_id, tickets) VALUES
  (2, 1, 2);
