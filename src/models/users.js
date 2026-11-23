import bcrypt from 'bcrypt';
import db from './db.js'

/**
 * Creates a new user in the database with the standard "user" role.
 * @param {string} name - The user's display name.
 * @param {string} email - The user's email address (used as the username).
 * @param {string} passwordHash - The bcrypt hash of the user's password (never the plain password).
 * @returns {number} The id of the newly created user record.
 */
const createUser = async (name, email, passwordHash) => {
    const default_role = 'user';
    const query = `
        INSERT INTO users (name, email, password_hash, role_id)
        VALUES ($1, $2, $3, (SELECT role_id FROM roles WHERE role_name = $4))
        RETURNING user_id;
    `;
    const queryParams = [name, email, passwordHash, default_role];

    const result = await db.query(query, queryParams);

    if (result.rows.length === 0) {
        throw new Error('Failed to create user');
    }

    if (process.env.ENABLE_SQL_LOGGING === 'true') {
        console.log('Created new user with ID:', result.rows[0].user_id);
    }

    return result.rows[0].user_id;
};

/**
 * Finds a user by email address, including the name of the user's role.
 * Only used inside this file, so it is not exported.
 * @param {string} email - The email address to look up.
 * @returns {object|null} The user record (including password_hash and role_name), or null if not found.
 */
const findUserByEmail = async (email) => {
    // Join roles so the session gets the role name (e.g. 'admin') instead of a role_id number
    const query = `
        SELECT u.user_id, u.name, u.email, u.password_hash, r.role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.role_id
        WHERE u.email = $1;
    `;
    const queryParams = [email];

    const result = await db.query(query, queryParams);

    if (result.rows.length === 0) {
        return null; // User not found
    }

    return result.rows[0];
};

/**
 * Checks a plain text password against a stored bcrypt hash.
 * Only used inside this file, so it is not exported.
 * @param {string} password - The password the user typed.
 * @param {string} passwordHash - The hash stored in the database.
 * @returns {boolean} True if the password matches the hash.
 */
const verifyPassword = async (password, passwordHash) => {
    return bcrypt.compare(password, passwordHash);
};

/**
 * Checks a user's login credentials.
 * @param {string} email - The email address the user typed.
 * @param {string} password - The password the user typed.
 * @returns {object|null} The user record without the password hash, or null if the
 * email or password is wrong.
 */
const authenticateUser = async (email, password) => {
    const user = await findUserByEmail(email);
    if (!user) {
        return null;
    }

    const passwordMatches = await verifyPassword(password, user.password_hash);
    if (!passwordMatches) {
        return null;
    }

    // Never keep the password hash in the session
    delete user.password_hash;
    return user;
};

// Export the model functions
export { createUser, authenticateUser };
