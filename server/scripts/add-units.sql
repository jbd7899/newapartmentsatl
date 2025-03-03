-- Add units for property ID 2
INSERT INTO property_units (property_id, unit_number, bedrooms, bathrooms, sqft, rent, available, description, features)
VALUES 
(2, '101', 1, '1.0', 650, 1200, true, 'Cozy one-bedroom apartment with modern finishes and great natural light.', 'Stainless steel appliances, Hardwood floors, In-unit laundry, Central AC'),
(2, '102', 2, '1.5', 850, 1500, true, 'Spacious two-bedroom apartment with an open floor plan and updated kitchen.', 'Granite countertops, Walk-in closets, Balcony, Pet-friendly'),
(2, '201', 2, '2.0', 950, 1700, true, 'Luxury two-bedroom apartment with two full bathrooms and a large living area.', 'Quartz countertops, Stainless steel appliances, In-unit laundry, Smart home features'),
(2, '202', 3, '2.0', 1200, 2100, false, 'Premium three-bedroom corner unit with abundant natural light and city views.', 'Floor-to-ceiling windows, Hardwood floors, Walk-in closets, Balcony, In-unit laundry');

-- Update the unit count on property ID 2
UPDATE properties SET unit_count = 4, is_multifamily = true WHERE id = 2; 