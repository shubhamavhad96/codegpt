CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT CHECK (role IN ('system', 'user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at); 