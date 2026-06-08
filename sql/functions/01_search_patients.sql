-- Full-text search helper for patients
-- Accepts a search term, returns matching patients ordered by relevance.
-- Used internally by the NestJS patients service for the ?search= query param.

CREATE OR REPLACE FUNCTION search_patients(search_term TEXT)
RETURNS SETOF patients AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM patients
  WHERE
    lower(first_name || ' ' || last_name) LIKE '%' || lower(search_term) || '%'
    OR lower(email) LIKE '%' || lower(search_term) || '%'
    OR phone LIKE '%' || search_term || '%'
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;
