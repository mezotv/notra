-- Custom SQL migration file, put your code below! --
WITH candidates AS (
	SELECT
		id,
		btrim(regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'), '-') AS base,
		row_number() OVER (
			PARTITION BY btrim(regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'), '-')
			ORDER BY created_at, id
		) AS occurrence
	FROM mcp_server_integrations
	WHERE slug IS NULL AND resource_type = 'store_listing'
)
UPDATE mcp_server_integrations AS target
SET slug = CASE
	WHEN candidates.occurrence = 1 THEN candidates.base
	ELSE candidates.base || '-' || candidates.occurrence
END
FROM candidates
WHERE target.id = candidates.id AND candidates.base <> '';
