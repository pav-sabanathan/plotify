-- Enable RLS on realtime.messages
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow users to only receive events on their own user-scoped channels
CREATE POLICY "Users can only receive their own realtime events"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() LIKE 'user-' || auth.uid()::text || '%'
  );