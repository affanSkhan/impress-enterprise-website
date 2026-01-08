-- Payment Transactions Table
-- Stores all payment transactions for orders (Razorpay, COD, etc.)

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Payment Gateway Details
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  
  -- Transaction Details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed, refunded
  payment_method TEXT, -- card, netbanking, upi, wallet, cod
  payment_gateway TEXT DEFAULT 'razorpay', -- razorpay, cod, other
  
  -- Metadata
  gateway_response JSONB, -- Store full gateway response
  error_code TEXT,
  error_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay_order ON payment_transactions(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_transactions_updated_at();

-- RLS Policies
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Customers can view their own payment transactions
CREATE POLICY "Customers can view own payment transactions"
  ON payment_transactions FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = auth.uid()
    )
  );

-- Admins can view all payment transactions
CREATE POLICY "Admins can view all payment transactions"
  ON payment_transactions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- System can insert payment transactions
CREATE POLICY "System can insert payment transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (true);

-- System can update payment transactions
CREATE POLICY "System can update payment transactions"
  ON payment_transactions FOR UPDATE
  USING (true);

-- Grant permissions
GRANT ALL ON payment_transactions TO authenticated;
GRANT ALL ON payment_transactions TO service_role;

-- Add payment fields to orders table
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

-- Index on payment status
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
