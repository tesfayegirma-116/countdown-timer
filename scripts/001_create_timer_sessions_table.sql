-- Create timer_sessions table to store countdown timer data
CREATE TABLE IF NOT EXISTS timer_sessions (
  id SERIAL PRIMARY KEY,
  session_name VARCHAR(255) NOT NULL DEFAULT 'Timer Session',
  target_duration INTEGER NOT NULL, -- in seconds
  actual_duration INTEGER NOT NULL DEFAULT 0, -- in seconds
  extra_time INTEGER NOT NULL DEFAULT 0, -- overtime in seconds
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())
);

-- Create index for faster queries by date
CREATE INDEX IF NOT EXISTS idx_timer_sessions_date ON timer_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_year ON timer_sessions(session_year);
