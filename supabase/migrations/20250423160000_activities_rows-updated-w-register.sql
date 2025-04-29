-- First ensure the activities table exists and has the correct structure
DO $$ 
BEGIN
    -- Check if we need to add any missing columns
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'activities' 
        AND column_name = 'price_cents'
    ) THEN
        ALTER TABLE activities ADD COLUMN price_cents numeric(10,0);
    END IF;
END $$;

-- Clear existing activities to avoid duplicates
TRUNCATE TABLE activities CASCADE;

-- Insert activities with proper formatting and escaping
INSERT INTO activities (
    id,
    name,
    description,
    price_cents,
    image_url,
    active,
    created_at,
    participant_type
) VALUES 
    (
        '0a9b9585-c16c-43ad-8c1a-dc291ca97d43',
        'Tier 2 Sponsorship',
        'Invite 4 people, 4 customer invites w/ discount, 1 event logo, Chatbook recognition, 1 Golf sponsorship.',
        2000000,
        null,
        true,
        '2025-04-17 22:25:06.028494+00',
        null
    ),
    (
        '10269029-08ba-4623-a8b9-2fb4849626dd',
        'Signature Pool and Spa',
        'Unwind in our world-class spa facilities with mountain views. Package includes pool access and a spa treatment.',
        2500,
        null,
        true,
        '2025-04-21 22:09:17.652245+00',
        null
    ),
    (
        '1c70b6dc-7265-4aac-b63d-26e7a3ee861f',
        'Evening Reception',
        'Join us for an elegant evening of networking, fine dining, and entertainment at the historic Banff Springs Hotel.',
        2500,
        null,
        true,
        '2025-04-21 22:10:37.16049+00',
        null
    ),
    (
        '2573dc8b-f865-4988-8952-50958c4d368f',
        'Tier 1 Sponsorship',
        'Invite 5 people, 5 customer invites w/ discount, 1 event logo, Chatbook recognition, 1 Golf sponsorship, 1 Welcome Reception sponsorship.',
        2500000,
        null,
        true,
        '2025-04-17 22:25:06.028494+00',
        null
    ),
    (
        '5256bba1-bfec-420c-9859-d6c3e046136e',
        'Guided Mountain Hiking',
        'Experience a guided hiking tour through Banff''s stunning mountain trails. Equipment and snacks provided.',
        2500,
        null,
        true,
        '2025-04-21 22:09:59.443154+00',
        null
    ),
    (
        '72252597-6bd9-485c-8a7b-06f244bb4f52',
        'Horseback Riding',
        'Take in breathtaking views of Banff from the Horseback Riding. Includes summit access and dining credit.',
        2500,
        null,
        true,
        '2025-04-21 22:10:54.454893+00',
        null
    ),
    (
        '7e135487-b8bd-4fbd-900e-62fb9b39acf8',
        'Tier 5 Sponsorship',
        'One person from your company, 1 customer invite subject to Tracts approval with 10% discount on room fees, 1 event logo sponsorship, Chatbook Sponsor Recognition.',
        500000,
        null,
        true,
        '2025-04-21 21:45:15.46144+00',
        null
    ),
    (
        '80388bae-f70a-4c80-841c-e380f50010e3',
        'Tier 3 Sponsorship',
        'One suite upgrade, can invite 2 people from your company, 5 customer invites subject to Tracts approval with 10% discount on room fees, 3 event logo sponsorships, Chatbook Sponsor recognition.',
        1500000,
        null,
        true,
        '2025-04-21 21:42:58.043849+00',
        null
    ),
    (
        '81457d58-2340-4d32-b923-45ca1d21c7c8',
        'BES2025 Golf Tournament',
        'Join us for a round of golf at the scenic Banff Springs Golf Course. Includes equipment rental and lunch.',
        2500,
        null,
        true,
        '2025-04-21 22:09:36.294302+00',
        null
    ),
    (
        'ba4562ae-b024-4a91-9fca-7d0b7d968a1d',
        'Mountain Biking Adventure',
        'Explore Banff''s trails on two wheels with our guided mountain biking tour. Includes bike rental and safety gear.',
        2500,
        null,
        true,
        '2025-04-21 22:10:16.924416+00',
        null
    ),
    (
        'd51bef8e-99eb-42de-87c1-aa24282d1ddd',
        'Tier 4 Sponsorship',
        'One suite upgrade, 1 person from your company, 3 customer invites subject to Tracts approval with 10% discount on room fees, 3 event logo sponsorships, Chatbook Sponsor Recognition.',
        1000000,
        null,
        true,
        '2025-04-21 21:44:06.100113+00',
        null
    );