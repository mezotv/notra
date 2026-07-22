-- Custom SQL migration file, put your code below! --
UPDATE mcp_server_integrations SET slug = lower(name) WHERE slug IS NULL AND resource_type = 'store_listing';
