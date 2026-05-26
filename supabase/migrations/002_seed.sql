insert into cities (name, slug, latitude, longitude, featured, image) values
('Lahore', 'lahore', 31.5204, 74.3587, true, 'https://res.cloudinary.com/dqmpuhnsk/image/upload/v1710000000/propvault/seeds/lahore.jpg'),
('Karachi', 'karachi', 24.8607, 67.0011, true, 'https://res.cloudinary.com/dqmpuhnsk/image/upload/v1710000000/propvault/seeds/karachi.jpg'),
('Islamabad', 'islamabad', 33.6844, 73.0479, true, 'https://res.cloudinary.com/dqmpuhnsk/image/upload/v1710000000/propvault/seeds/islamabad.jpg'),
('Rawalpindi', 'rawalpindi', 33.5651, 73.0169, true, 'https://res.cloudinary.com/dqmpuhnsk/image/upload/v1710000000/propvault/seeds/rawalpindi.jpg')
on conflict (slug) do nothing;

insert into areas (name, slug, city_id, latitude, longitude)
select 'DHA Phase 6', 'dha-phase-6', id, 31.4681, 74.4511 from cities where slug = 'lahore'
on conflict do nothing;
insert into areas (name, slug, city_id, latitude, longitude)
select 'Bahria Town', 'bahria-town', id, 31.3695, 74.1766 from cities where slug = 'lahore'
on conflict do nothing;
insert into areas (name, slug, city_id, latitude, longitude)
select 'Gulberg', 'gulberg', id, 31.5119, 74.3446 from cities where slug = 'lahore'
on conflict do nothing;
insert into areas (name, slug, city_id, latitude, longitude)
select 'Clifton', 'clifton', id, 24.8138, 67.0305 from cities where slug = 'karachi'
on conflict do nothing;
insert into areas (name, slug, city_id, latitude, longitude)
select 'Bahria Town Karachi', 'bahria-town-karachi', id, 25.0107, 67.3066 from cities where slug = 'karachi'
on conflict do nothing;
insert into areas (name, slug, city_id, latitude, longitude)
select 'F-11', 'f-11', id, 33.6840, 72.9886 from cities where slug = 'islamabad'
on conflict do nothing;
insert into areas (name, slug, city_id, latitude, longitude)
select 'DHA Phase 2', 'dha-phase-2', id, 33.5225, 73.1534 from cities where slug = 'islamabad'
on conflict do nothing;
insert into areas (name, slug, city_id, latitude, longitude)
select 'Bahria Town Rawalpindi', 'bahria-town-rawalpindi', id, 33.5517, 73.1241 from cities where slug = 'rawalpindi'
on conflict do nothing;

insert into property_types (name, slug, category, icon) values
('House', 'house', 'RESIDENTIAL', 'home'),
('Flat', 'flat', 'RESIDENTIAL', 'building'),
('Upper Portion', 'upper-portion', 'RESIDENTIAL', 'layers'),
('Residential Plot', 'residential-plot', 'PLOT', 'map'),
('Commercial Plot', 'commercial-plot', 'PLOT', 'map'),
('Office', 'office', 'COMMERCIAL', 'briefcase'),
('Shop', 'shop', 'COMMERCIAL', 'store')
on conflict (slug) do nothing;

insert into amenities (name, slug, category) values
('Electricity', 'electricity', 'Utilities'),
('Gas', 'gas', 'Utilities'),
('Water Supply', 'water-supply', 'Utilities'),
('Security', 'security', 'Community'),
('Parking', 'parking', 'Facilities'),
('Park Nearby', 'park-nearby', 'Nearby')
on conflict (slug) do nothing;

insert into agencies (name, slug, logo, cover_image, description, email, phone, website, address, city_id, verified, featured, rating, review_count)
select 'Darwaish Associates', 'darwaish-associates',
'https://res.cloudinary.com/dqmpuhnsk/image/upload/v1710000000/propvault/seeds/agency-darwaish.png',
'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
'A premium real estate agency focused on verified residential and investment properties.',
'info@darwaishassociates.com', '+923001234567', 'https://propvault.example', 'DHA Phase 6, Lahore', id, true, true, 4.8, 128
from cities where slug = 'lahore'
on conflict (slug) do nothing;

insert into agencies (name, slug, logo, cover_image, description, email, phone, website, address, city_id, verified, featured, rating, review_count)
select 'Capital Estate Group', 'capital-estate-group',
'https://res.cloudinary.com/dqmpuhnsk/image/upload/v1710000000/propvault/seeds/agency-capital.png',
'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200',
'Islamabad specialists for family homes, apartments, and new development investments.',
'hello@capitalestate.example', '+923111234567', 'https://propvault.example', 'F-11 Markaz, Islamabad', id, true, true, 4.6, 92
from cities where slug = 'islamabad'
on conflict (slug) do nothing;

insert into agents (agency_id, license_no, bio, whatsapp, verified, featured, rating, review_count)
select id, 'PV-LHR-001', 'Senior property consultant for Lahore premium communities.', '+923001234567', true, true, 4.8, 84
from agencies where slug = 'darwaish-associates'
on conflict do nothing;

insert into agents (agency_id, license_no, bio, whatsapp, verified, featured, rating, review_count)
select id, 'PV-ISB-001', 'Investment advisor for Islamabad and Rawalpindi properties.', '+923111234567', true, true, 4.7, 61
from agencies where slug = 'capital-estate-group'
on conflict do nothing;

with refs as (
  select
    (select id from cities where slug = 'lahore') lahore,
    (select id from cities where slug = 'islamabad') islamabad,
    (select id from cities where slug = 'karachi') karachi,
    (select id from areas where slug = 'dha-phase-6' limit 1) dha6,
    (select id from areas where slug = 'bahria-town' limit 1) bahria_lhr,
    (select id from areas where slug = 'f-11' limit 1) f11,
    (select id from areas where slug = 'clifton' limit 1) clifton,
    (select id from property_types where slug = 'house') house,
    (select id from property_types where slug = 'flat') flat,
    (select id from property_types where slug = 'residential-plot') plot,
    (select id from property_types where slug = 'office') office,
    (select id from agencies where slug = 'darwaish-associates') darwaish,
    (select id from agencies where slug = 'capital-estate-group') capital,
    (select id from agents where license_no = 'PV-LHR-001') lhr_agent,
    (select id from agents where license_no = 'PV-ISB-001') isb_agent
)
insert into properties (
  title, slug, description, purpose, category, status, verification, price, bedrooms, bathrooms,
  area_size, area_unit, address, latitude, longitude, city_id, area_id, property_type_id,
  agency_id, agent_id, featured, trending, views, furnishing_status, possession_status,
  built_year, floors_count, facing_direction, published_at
)
select * from (
  select '1 Kanal Designer House for Sale in DHA Phase 6' title, '1-kanal-designer-house-dha-phase-6-lahore' slug,
  'A bright, contemporary 1 kanal home with generous living spaces, landscaped lawn, imported kitchen fittings, and a quiet street position in DHA Phase 6.' description,
  'SALE'::listing_purpose purpose, 'RESIDENTIAL'::property_category category, 'ACTIVE'::property_status status, 'VERIFIED'::verification_status verification,
  87500000::numeric price, 5 bedrooms, 6 bathrooms, 1::numeric area_size, 'KANAL' area_unit, 'DHA Phase 6, Lahore' address,
  31.4681::double precision latitude, 74.4511::double precision longitude, lahore city_id, dha6 area_id, house property_type_id, darwaish agency_id, lhr_agent agent_id,
  true featured, true trending, 842 views, 'Furnished' furnishing_status, 'Ready' possession_status, 2021 built_year, 2 floors_count, 'East' facing_direction, now() published_at
  from refs
  union all
  select '10 Marla Family Home in Bahria Town Lahore', '10-marla-family-home-bahria-town-lahore',
  'Well maintained 10 marla house close to parks, schools, commercial area, and mosque. Ideal for families looking for secure community living.',
  'SALE', 'RESIDENTIAL', 'ACTIVE', 'VERIFIED', 36500000, 4, 5, 10, 'MARLA', 'Bahria Town, Lahore', 31.3695, 74.1766, lahore, bahria_lhr, house, darwaish, lhr_agent, true, false, 526, 'Semi Furnished', 'Ready', 2019, 2, 'North', now()
  from refs
  union all
  select 'Luxury Apartment for Rent in F-11 Islamabad', 'luxury-apartment-rent-f-11-islamabad',
  'Modern apartment with elegant interiors, lift access, secure parking, and quick access to F-11 Markaz. Suitable for executives and small families.',
  'RENT', 'RESIDENTIAL', 'ACTIVE', 'VERIFIED', 185000, 3, 3, 1800, 'SQFT', 'F-11, Islamabad', 33.6840, 72.9886, islamabad, f11, flat, capital, isb_agent, true, true, 731, 'Furnished', 'Ready', 2022, 1, 'South', now()
  from refs
  union all
  select 'Sea View Apartment in Clifton Karachi', 'sea-view-apartment-clifton-karachi',
  'High floor apartment with sea-facing views, spacious lounge, reserved parking, and easy access to restaurants and shopping districts.',
  'SALE', 'RESIDENTIAL', 'ACTIVE', 'VERIFIED', 52000000, 3, 4, 2200, 'SQFT', 'Clifton Block 4, Karachi', 24.8138, 67.0305, karachi, clifton, flat, null, null, false, true, 415, 'Unfurnished', 'Ready', 2020, 1, 'West', now()
  from refs
  union all
  select 'Commercial Office for Rent on Main Boulevard', 'commercial-office-rent-main-boulevard-lahore',
  'Corporate office floor with open work area, meeting rooms, glass frontage, backup power, and excellent visibility on a prime road.',
  'RENT', 'COMMERCIAL', 'ACTIVE', 'VERIFIED', 450000, null, 2, 3200, 'SQFT', 'Main Boulevard Gulberg, Lahore', 31.5119, 74.3446, lahore, (select id from areas where slug='gulberg' limit 1), office, darwaish, lhr_agent, false, false, 309, 'Furnished', 'Ready', 2018, 1, 'South-East', now()
  from refs
  union all
  select '1 Kanal Residential Plot in DHA Islamabad', '1-kanal-residential-plot-dha-islamabad',
  'Possession plot in a developed block with wide roads and strong investment fundamentals. Clean documents and ready for transfer.',
  'SALE', 'PLOT', 'ACTIVE', 'VERIFIED', 44000000, null, null, 1, 'KANAL', 'DHA Phase 2, Islamabad', 33.5225, 73.1534, islamabad, (select id from areas where slug='dha-phase-2' limit 1), plot, capital, isb_agent, true, false, 288, null, 'Possession', null, null, 'North-East', now()
  from refs
) seeded
on conflict (slug) do nothing;

insert into property_images (property_id, url, public_id, sort_order, is_primary)
select p.id, img.url, img.public_id, img.sort_order, img.is_primary
from properties p
join lateral (
  values
  ('https://images.unsplash.com/photo-1600596542815-fdef06020168?w=1200', 'seed-house-1', 0, true),
  ('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200', 'seed-house-2', 1, false),
  ('https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200', 'seed-house-3', 2, false)
) as img(url, public_id, sort_order, is_primary) on p.slug = '1-kanal-designer-house-dha-phase-6-lahore'
on conflict do nothing;

insert into property_images (property_id, url, public_id, sort_order, is_primary)
select p.id, img.url, img.public_id, img.sort_order, img.is_primary
from properties p
join lateral (
  values
  ('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200', 'seed-bahria-1', 0, true),
  ('https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200', 'seed-bahria-2', 1, false)
) as img(url, public_id, sort_order, is_primary) on p.slug = '10-marla-family-home-bahria-town-lahore'
on conflict do nothing;

insert into property_images (property_id, url, public_id, sort_order, is_primary)
select p.id, img.url, img.public_id, img.sort_order, img.is_primary
from properties p
join lateral (
  values
  ('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200', 'seed-f11-1', 0, true),
  ('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200', 'seed-f11-2', 1, false)
) as img(url, public_id, sort_order, is_primary) on p.slug = 'luxury-apartment-rent-f-11-islamabad'
on conflict do nothing;

insert into property_images (property_id, url, public_id, sort_order, is_primary)
select p.id, img.url, img.public_id, img.sort_order, img.is_primary
from properties p
join lateral (
  values
  ('https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200', 'seed-clifton-1', 0, true),
  ('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200', 'seed-clifton-2', 1, false)
) as img(url, public_id, sort_order, is_primary) on p.slug = 'sea-view-apartment-clifton-karachi'
on conflict do nothing;

insert into property_images (property_id, url, public_id, sort_order, is_primary)
select p.id, img.url, img.public_id, img.sort_order, img.is_primary
from properties p
join lateral (
  values
  ('https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200', 'seed-office-1', 0, true),
  ('https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200', 'seed-office-2', 1, false)
) as img(url, public_id, sort_order, is_primary) on p.slug = 'commercial-office-rent-main-boulevard-lahore'
on conflict do nothing;

insert into property_images (property_id, url, public_id, sort_order, is_primary)
select p.id, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200', 'seed-plot-1', 0, true
from properties p where p.slug = '1-kanal-residential-plot-dha-islamabad'
on conflict do nothing;

insert into property_amenities (property_id, amenity_id)
select p.id, a.id
from properties p cross join amenities a
where p.slug in ('1-kanal-designer-house-dha-phase-6-lahore', '10-marla-family-home-bahria-town-lahore', 'luxury-apartment-rent-f-11-islamabad')
and a.slug in ('electricity', 'gas', 'water-supply', 'security', 'parking')
on conflict do nothing;

insert into nearby_places (property_id, name, type, distance, unit)
select p.id, v.name, v.type, v.distance, 'km'
from properties p
join lateral (
  values ('Park', 'park', 0.4::numeric), ('School', 'education', 1.1::numeric), ('Market', 'shopping', 0.8::numeric)
) v(name, type, distance) on true
where p.slug in ('1-kanal-designer-house-dha-phase-6-lahore', '10-marla-family-home-bahria-town-lahore', 'luxury-apartment-rent-f-11-islamabad')
on conflict do nothing;

insert into projects (name, slug, description, developer, city_id, area_id, cover_image, min_price, max_price, handover, featured, status, latitude, longitude)
select 'Green Heights Residencia', 'green-heights-residencia',
'A gated vertical community with retail, apartments, rooftop amenities, and flexible payment plans.',
'Green Developers', c.id, a.id,
'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
14500000, 42000000, 'Q4 2027', true, 'ONGOING', c.latitude, c.longitude
from cities c left join areas a on a.city_id = c.id and a.slug = 'f-11'
where c.slug = 'islamabad'
on conflict (slug) do nothing;

insert into projects (name, slug, description, developer, city_id, area_id, cover_image, min_price, max_price, handover, featured, status, latitude, longitude)
select 'DHA Business Square', 'dha-business-square',
'Premium commercial offices and shops designed for high-footfall businesses and investors.',
'Urban Axis', c.id, a.id,
'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
22000000, 95000000, 'Q2 2028', true, 'ONGOING', c.latitude, c.longitude
from cities c left join areas a on a.city_id = c.id and a.slug = 'dha-phase-6'
where c.slug = 'lahore'
on conflict (slug) do nothing;

insert into blog_posts (title, slug, excerpt, content, cover_image, published, tags, published_at)
values
('How to Verify a Property Before Buying in Pakistan', 'verify-property-before-buying-pakistan',
'A practical checklist for documents, ownership, possession, and neighborhood checks before you commit.',
'Always verify title documents, mutation records, possession status, utility connections, society approvals, and seller identity before making a property purchase.',
'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200', true, '["guides","buying"]'::jsonb, now()),
('Best Areas for Rental Yield in Lahore and Islamabad', 'best-rental-yield-lahore-islamabad',
'A quick look at communities with strong tenant demand and stable long-term returns.',
'Rental yield depends on acquisition price, maintenance cost, tenant demand, and liquidity. Compare similar properties before deciding.',
'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200', true, '["investment","rental"]'::jsonb, now())
on conflict (slug) do nothing;

insert into area_guides (title, slug, content, city_id, area_id, cover_image, avg_price, property_count, published)
select 'DHA Phase 6 Lahore Area Guide', 'dha-phase-6-lahore-area-guide',
'DHA Phase 6 is known for wide roads, strong security, premium homes, and easy access to commercial zones.',
c.id, a.id, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200', 75000000, 328, true
from cities c join areas a on a.city_id = c.id and a.slug = 'dha-phase-6'
where c.slug = 'lahore'
on conflict (slug) do nothing;
