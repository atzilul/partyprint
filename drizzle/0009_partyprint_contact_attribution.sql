ALTER TABLE contact_leads ADD COLUMN utm_source TEXT;
ALTER TABLE contact_leads ADD COLUMN utm_medium TEXT;
ALTER TABLE contact_leads ADD COLUMN utm_campaign TEXT;
ALTER TABLE contact_leads ADD COLUMN utm_content TEXT;
ALTER TABLE contact_leads ADD COLUMN utm_term TEXT;
ALTER TABLE contact_leads ADD COLUMN fbclid TEXT;
ALTER TABLE contact_leads ADD COLUMN fbc TEXT;
ALTER TABLE contact_leads ADD COLUMN fbp TEXT;
ALTER TABLE contact_leads ADD COLUMN landing_path TEXT;
ALTER TABLE contact_leads ADD COLUMN first_seen_at TEXT;
ALTER TABLE contact_leads ADD COLUMN referrer TEXT;

UPDATE contact_leads
SET utm_source = COALESCE(json_extract(data, '$.attribution.utm_source'), json_extract(data, '$.source'), 'direct'),
    utm_medium = COALESCE(json_extract(data, '$.attribution.utm_medium'), 'direct'),
    utm_campaign = json_extract(data, '$.attribution.utm_campaign'),
    utm_content = json_extract(data, '$.attribution.utm_content'),
    utm_term = json_extract(data, '$.attribution.utm_term'),
    fbclid = json_extract(data, '$.attribution.fbclid'),
    fbc = json_extract(data, '$.attribution.fbc'),
    fbp = json_extract(data, '$.attribution.fbp'),
    landing_path = COALESCE(json_extract(data, '$.attribution.landing_path'), '/'),
    first_seen_at = json_extract(data, '$.attribution.first_seen_at'),
    referrer = json_extract(data, '$.attribution.referrer');
