-- =====================================================
-- SMS Invitations System - Supabase Migration
-- =====================================================
-- Purpose: Track SMS invitations sent by admins via Emma
-- Usage: Admin texts Emma: "Invite Marc +18193425966"
--        Emma sends invitation and tracks it in this table
-- =====================================================

-- 1. Create sms_invitations table
CREATE TABLE IF NOT EXISTS sms_invitations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact Information
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,

  -- Invitation Details
  template_used VARCHAR(50) DEFAULT 'standard',
  message_sent TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  sent_by VARCHAR(255) NOT NULL, -- Phone or email of admin who sent

  -- Status Tracking
  status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, failed, responded
  first_response_at TIMESTAMP,
  total_responses INTEGER DEFAULT 0,

  -- Twilio Integration
  twilio_message_sid VARCHAR(50),
  delivery_status VARCHAR(20), -- queued, sent, delivered, failed

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sms_invitations_phone ON sms_invitations(phone);
CREATE INDEX IF NOT EXISTS idx_sms_invitations_sent_by ON sms_invitations(sent_by);
CREATE INDEX IF NOT EXISTS idx_sms_invitations_status ON sms_invitations(status);
CREATE INDEX IF NOT EXISTS idx_sms_invitations_sent_at ON sms_invitations(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_invitations_twilio_sid ON sms_invitations(twilio_message_sid);

-- 3. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sms_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_sms_invitations_updated_at ON sms_invitations;
CREATE TRIGGER trigger_sms_invitations_updated_at
  BEFORE UPDATE ON sms_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_sms_invitations_updated_at();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE sms_invitations ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies

-- Allow service role (backend) full access
CREATE POLICY "Allow service role full access"
  ON sms_invitations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to view their own invitations (if they become users)
CREATE POLICY "Allow users to view their own invitations"
  ON sms_invitations
  FOR SELECT
  TO authenticated
  USING (
    phone IN (
      SELECT phone FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Allow admins to view all invitations (optional - requires admin role)
-- Uncomment if you implement admin roles:
-- CREATE POLICY "Allow admins to view all invitations"
--   ON sms_invitations
--   FOR SELECT
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_profiles
--       WHERE id = auth.uid() AND metadata->>'role' = 'admin'
--     )
--   );

-- 7. Create view for invitation statistics
CREATE OR REPLACE VIEW sms_invitation_stats AS
SELECT
  COUNT(*) as total_invitations,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
  COUNT(CASE WHEN first_response_at IS NOT NULL THEN 1 END) as responded_count,
  ROUND(
    100.0 * COUNT(CASE WHEN first_response_at IS NOT NULL THEN 1 END) /
    NULLIF(COUNT(*), 0),
    2
  ) as response_rate_percent,
  sent_by
FROM sms_invitations
GROUP BY sent_by;

-- 8. Grant permissions on view
GRANT SELECT ON sms_invitation_stats TO service_role;
GRANT SELECT ON sms_invitation_stats TO authenticated;

-- =====================================================
-- EXAMPLE QUERIES
-- =====================================================

-- Get all invitations sent in last 30 days
-- SELECT * FROM sms_invitations
-- WHERE sent_at >= NOW() - INTERVAL '30 days'
-- ORDER BY sent_at DESC;

-- Check if phone number was invited recently (30 days)
-- SELECT * FROM sms_invitations
-- WHERE phone = '+18193425966'
-- AND sent_at >= NOW() - INTERVAL '30 days';

-- Get invitation statistics by admin
-- SELECT * FROM sms_invitation_stats;

-- Get response rate for specific admin
-- SELECT
--   sent_by,
--   COUNT(*) as total_sent,
--   COUNT(CASE WHEN first_response_at IS NOT NULL THEN 1 END) as responses,
--   ROUND(100.0 * COUNT(CASE WHEN first_response_at IS NOT NULL THEN 1 END) / COUNT(*), 2) as response_rate
-- FROM sms_invitations
-- WHERE sent_by = '+14183185826'
-- GROUP BY sent_by;

-- =====================================================
-- MIGRATION NOTES
-- =====================================================
--
-- This table integrates with:
-- - /lib/invitation-handler.js - Creates invitation records
-- - /api/adapters/sms.js - Detects invitation commands
-- - user_profiles table - Links to existing users
--
-- Admin phone numbers (from phone-contacts.js):
-- - +14183185826 (J-S)
-- - +14187501061 (Daniel)
-- - +18193425966 (Maxime)
--
-- Templates available:
-- - standard: Full presentation with capabilities
-- - short: Brief version
-- - vip: Exclusive access messaging
-- =====================================================

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- DROP VIEW IF EXISTS sms_invitation_stats;
-- DROP TRIGGER IF EXISTS trigger_sms_invitations_updated_at ON sms_invitations;
-- DROP FUNCTION IF EXISTS update_sms_invitations_updated_at();
-- DROP TABLE IF EXISTS sms_invitations CASCADE;
-- =====================================================
