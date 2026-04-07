-- Drop the old prefix-match policy
DROP POLICY IF EXISTS "Users can only receive their own realtime events" ON realtime.messages;

-- Create a strict equality policy instead of LIKE prefix match
CREATE POLICY "Users can only receive their own realtime events"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = 'user-' || auth.uid()::text
  );