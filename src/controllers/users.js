// Import any needed model functions
import bcrypt from 'bcrypt';
import { createUser, authenticateUser } from '../models/users.js';

// PostgreSQL error code for a UNIQUE constraint violation
// (each email address can only be registered once)
const UNIQUE_VIOLATION = '23505';

// Number of bcrypt salt rounds: higher is slower and harder to brute-force
const SALT_ROUNDS = 10;

// Define any controller functions
const showUserRegistrationForm = (req, res) => {
    const title = 'Register';

    res.render('register', { title });
};

const processUserRegistrationForm = async (req, res) => {
    // In Express 5, req.body is undefined when a request has no body at all
    const name = req.body?.name?.trim();
    const password = req.body?.password;
    // Store emails in lowercase so "Me@Example.com" and "me@example.com" are the same account
    const email = req.body?.email?.trim().toLowerCase();

    // The form marks every field required, but check on the server too
    if (!name || !email || !password) {
        req.flash('error', 'Name, email, and password are all required.');
        return res.redirect('/register');
    }

    try {
        // Hash the password before storing it (the plain password is never saved)
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        await createUser(name, email, passwordHash);

        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/login');
    } catch (error) {
        if (error.code === UNIQUE_VIOLATION) {
            req.flash('error', 'An account with that email already exists.');
        } else {
            console.error('Error registering user:', error);
            req.flash('error', 'An error occurred during registration. Please try again.');
        }
        res.redirect('/register');
    }
};

const showLoginForm = (req, res) => {
    const title = 'Login';

    res.render('login', { title });
};

const processLoginForm = async (req, res) => {
    const password = req.body?.password;
    const email = req.body?.email?.trim().toLowerCase();

    if (!email || !password) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/login');
    }

    try {
        const user = await authenticateUser(email, password);

        if (user) {
            // Store the user (without the password hash) in the session
            req.session.user = user;
            req.flash('success', 'Login successful!');

            if (res.locals.NODE_ENV === 'development') {
                console.log('User logged in:', user);
            }

            res.redirect('/dashboard');
        } else {
            // Same message for a wrong email or a wrong password, so the form
            // doesn't reveal which email addresses have accounts
            req.flash('error', 'Invalid email or password.');
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error during login:', error);
        req.flash('error', 'An error occurred during login. Please try again.');
        res.redirect('/login');
    }
};

const processLogout = (req, res) => {
    // Remove the user from the session instead of destroying the whole session,
    // because the flash message below is stored in the session
    if (req.session.user) {
        delete req.session.user;
    }

    req.flash('success', 'Logout successful!');
    res.redirect('/login');
};

/**
 * Middleware for routes that require a logged-in user.
 * Sends visitors who are not logged in to the login page.
 */
const requireLogin = (req, res, next) => {
    if (!req.session || !req.session.user) {
        req.flash('error', 'You must be logged in to access that page.');
        return res.redirect('/login');
    }
    next();
};

/**
 * Middleware factory for routes that require a specific role.
 * It returns a middleware function, because Express middleware only receives
 * (req, res, next) and has no way to be told which role to check for.
 * @param {string} role - The role name required (e.g. 'admin').
 * @returns {Function} Express middleware that only lets users with that role through.
 */
const requireRole = (role) => {
    return (req, res, next) => {
        // Not logged in at all: send them to log in first
        if (!req.session || !req.session.user) {
            req.flash('error', 'You must be logged in to access that page.');
            return res.redirect('/login');
        }

        // Logged in, but without the required role
        if (req.session.user.role_name !== role) {
            req.flash('error', 'You do not have permission to access that page.');
            return res.redirect('/');
        }

        next();
    };
};

const showDashboard = (req, res) => {
    const { name, email } = req.session.user;
    const title = 'Dashboard';

    res.render('dashboard', { title, name, email });
};

// Export any controller functions
export {
    showUserRegistrationForm,
    processUserRegistrationForm,
    showLoginForm,
    processLoginForm,
    processLogout,
    requireLogin,
    requireRole,
    showDashboard
};
