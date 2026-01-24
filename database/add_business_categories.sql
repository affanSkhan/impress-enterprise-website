-- Add categories for all business contexts
-- Solar Business Categories
INSERT INTO categories (name, slug, business_type) VALUES
('Solar Panels', 'solar-panels', 'solar'),
('Solar Inverters', 'solar-inverters', 'solar'),
('Solar Batteries', 'solar-batteries', 'solar'),
('Solar Charge Controllers', 'solar-charge-controllers', 'solar'),
('Solar Mounting Systems', 'solar-mounting-systems', 'solar'),
('Solar Cables & Wiring', 'solar-cables-wiring', 'solar'),
('Solar Installation Kits', 'solar-installation-kits', 'solar'),
('Solar Accessories', 'solar-accessories', 'solar')
ON CONFLICT (slug) DO NOTHING;

-- Electronics Business Categories
INSERT INTO categories (name, slug, business_type) VALUES
('Laptops & Computers', 'laptops-computers', 'electronics'),
('Mobile Phones', 'mobile-phones', 'electronics'),
('Tablets & iPads', 'tablets-ipads', 'electronics'),
('Televisions', 'televisions', 'electronics'),
('Audio Systems', 'audio-systems', 'electronics'),
('Cameras & Photography', 'cameras-photography', 'electronics'),
('Gaming Consoles', 'gaming-consoles', 'electronics'),
('Smart Home Devices', 'smart-home-devices', 'electronics'),
('Wearables & Smartwatches', 'wearables-smartwatches', 'electronics'),
('Computer Accessories', 'computer-accessories', 'electronics'),
('Home Appliances', 'home-appliances', 'electronics')
ON CONFLICT (slug) DO NOTHING;

-- Furniture Business Categories
INSERT INTO categories (name, slug, business_type) VALUES
('Living Room Furniture', 'living-room-furniture', 'furniture'),
('Bedroom Furniture', 'bedroom-furniture', 'furniture'),
('Dining Room Furniture', 'dining-room-furniture', 'furniture'),
('Office Furniture', 'office-furniture', 'furniture'),
('Outdoor Furniture', 'outdoor-furniture', 'furniture'),
('Storage & Organization', 'storage-organization', 'furniture'),
('Kids Furniture', 'kids-furniture', 'furniture'),
('Home Decor', 'home-decor', 'furniture'),
('Lighting', 'lighting', 'furniture'),
('Mattresses & Bedding', 'mattresses-bedding', 'furniture')
ON CONFLICT (slug) DO NOTHING;
