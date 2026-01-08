-- Service Bookings Table
-- Stores customer service booking requests for repair, installation, and maintenance

CREATE TABLE IF NOT EXISTS service_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  booking_number TEXT UNIQUE NOT NULL,
  
  -- Customer Info (for non-registered customers)
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  
  -- Service Details
  service_type TEXT NOT NULL, -- AC Repair, Solar Installation, etc.
  description TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT, -- Morning, Afternoon, Evening
  
  -- Admin Management
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, in_progress, completed, cancelled
  assigned_technician TEXT,
  technician_phone TEXT,
  scheduled_date DATE,
  scheduled_time TEXT,
  completion_date TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  service_charges DECIMAL(10, 2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_customer ON service_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_date ON service_bookings(preferred_date);
CREATE INDEX IF NOT EXISTS idx_service_bookings_number ON service_bookings(booking_number);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_service_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_bookings_updated_at
  BEFORE UPDATE ON service_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_service_bookings_updated_at();

-- RLS Policies
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

-- Customers can view their own bookings
CREATE POLICY "Customers can view own bookings"
  ON service_bookings FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM customers WHERE id = service_bookings.customer_id
    )
  );

-- Customers can insert their own bookings
CREATE POLICY "Customers can create bookings"
  ON service_bookings FOR INSERT
  WITH CHECK (true); -- Allow anyone to create bookings

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
  ON service_bookings FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Admins can update all bookings
CREATE POLICY "Admins can update bookings"
  ON service_bookings FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Grant permissions
GRANT ALL ON service_bookings TO authenticated;
GRANT ALL ON service_bookings TO service_role;

-- Generate unique booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  number_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate format: BK-YYYYMMDD-XXXX (e.g., BK-20260108-1234)
    new_number := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if number already exists
    SELECT EXISTS(SELECT 1 FROM service_bookings WHERE booking_number = new_number) INTO number_exists;
    
    -- Exit loop if unique number found
    EXIT WHEN NOT number_exists;
  END LOOP;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate booking number on insert
CREATE OR REPLACE FUNCTION set_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
    NEW.booking_number := generate_booking_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_bookings_number
  BEFORE INSERT ON service_bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_number();
