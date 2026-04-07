-- Drop the old policy
DROP POLICY IF EXISTS "Users can only receive their own realtime events" ON realtime.messages;

-- Create strict equality policy using split_part to validate user ID segment
CREATE POLICY "Users can only receive their own realtime events"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    split_part(realtime.topic(), ':', 1) = 'user'
    AND split_part(realtime.topic(), ':', 2) = auth.uid()::text
  );