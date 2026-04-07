DROP POLICY IF EXISTS "Users can only receive their own realtime events" ON realtime.messages;

CREATE POLICY "Users can only receive their own realtime events"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = 'user-' || auth.uid()::text
  );