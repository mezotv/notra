-- Custom SQL migration file, put your code below! --
UPDATE mcp_server_integrations
SET category = 'Productivity', store_featured_at = now()
WHERE name = 'Brew'
	AND resource_type = 'store_listing'
	AND category IS NULL
	AND store_featured_at IS NULL;
