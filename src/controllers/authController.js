const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { user } = require('pg/lib/defaults');

require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const signup = async (req, res) => {
    try {
        const { email, password, phone } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const {data: userData, error: userError} = await supabase
            .from('users')
            .insert([{ email, password_hash: hashedPassword, phone: phone || null }])
            .select();

        if (userError) {
            if (userError.code === '23505') {
                return res.status(409).json({ error: 'Email already exists' });
            }
            throw userError;
        }

        const userId = userData[0].id;

        // Create wallet for users
        await supabase
        .from('wallets')
        .insert([{ user_id: userId }]);

        // Create JWT token
        const token = jwt.sign({ userId, email }, process.env.JWT_SECRET || 'secret__key', {
            expiresIn: '7d',
        });

        res.status(201).json({
            message: 'Signup successful',
            user: { id: userData[0].id, email: userData[0].email },
            token,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Find user
        const { data: userData, error } = await supabase
            .from('users')
            .select("*")
            .eq('email', email);

        if (error || userData.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = userData[0];
        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Create JWT token
        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'secret__key', {
            expiresIn: '7d',
        });

        res.json({
            message: 'Login successful',
            user: { id: user.id, email: user.email },
            token,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { signup, login };