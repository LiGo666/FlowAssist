-- Create n8n database if it doesn't exist
DO
$$
BEGIN
    -- Check if the database exists
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'n8n') THEN
        -- Create the n8n database
        CREATE DATABASE n8n;
    END IF;
END
$$;

-- Connect to the n8n database to set up permissions
\connect n8n;

-- Grant privileges (run this regardless of whether the DB was just created)
ALTER DATABASE n8n OWNER TO postgres;
GRANT ALL PRIVILEGES ON DATABASE n8n TO postgres;

-- Set default permissions for future tables
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO postgres;
