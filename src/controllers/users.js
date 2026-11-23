// Import any needed model functions
import bcrypt from 'bcrypt';
import { createUser } from '../models/users.js';

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

        req.flash('success', 'Registration successful!');
        res.redirect('/');
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

// Export any controller functions
export {
    showUserRegistrationForm,
    processUserRegistrationForm
};
