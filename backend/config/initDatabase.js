async function tablesExist() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    const result = await client.query(`
        
    CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,

    role_id UUID NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_role
        FOREIGN KEY(role_id)
        REFERENCES roles(id)
);
  `);

    await client.end();

    return result.rows[0].exists;
}

export async function initDatabase() {
    const alreadyExists = await tablesExist();

    if (alreadyExists) {
        console.log("Database already initialized");
        return;
    }

    await runSqlViaPg(SCHEMA_SQL);
}