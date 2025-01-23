const router = require('express').Router();
const pool = require('../database');
const bcrypt = require('bcrypt');

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { user_name, user_email, user_password, user_contact_no, is_admin } = req.body;
        
        // Check if user already exists
        const userExists = await pool.query(
            'SELECT * FROM users WHERE user_email = $1',
            [user_email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(user_password, 10);

        // Create new user
        const newUser = await pool.query(
            'INSERT INTO users (user_name, user_email, user_password, user_contact_no, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user_name, user_email, hashedPassword, user_contact_no, is_admin]
        );

        res.status(200).json({ message: "User created successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { user_email, user_password } = req.body;
        const user = await pool.query(
            'SELECT * FROM users WHERE user_email = $1',
            [user_email]
        );

        if (user.rows.length === 0 || !(await bcrypt.compare(user_password, user.rows[0].user_password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // // Set user data in session
        // req.session.regenerate(async function(err) {
        //     if (err) {
        //         console.error("Session regeneration error:", err);
        //         return res.status(500).json({ message: "Session error" });
        //     }

        //     req.session.user = {
        //         id: user.rows[0].user_id,
        //         email: user.rows[0].user_email,
        //         name: user.rows[0].user_name,
        //         is_admin: user.rows[0].is_admin
        //     };
        //     req.session.authenticated = true;

        //     // Wait for session to be saved
        //     await new Promise((resolve) => req.session.save(resolve));

        //     res.json({
        //         message: "Logged in successfully",
        //         user: req.session.user
        //     });
        // });

        req.session.user = {
            id: user.rows[0].user_id,
            email: user.rows[0].user_email,
            name: user.rows[0].user_name,
            is_admin: user.rows[0].is_admin
        };
        req.session.authenticated = true;
        
        req.session.save((err) => {
            if (err) {
                console.error("Error saving session:", err);
                return res.status(500).json({ message: "Could not save session" });
            }
        
            res.json({
                message: "Logged in successfully",
                user: req.session.user
            });
        });
        
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Check auth status
router.get('/check-auth', async (req, res) => {
    try {
        console.log("Session in check-auth:", req.session);
        
        if (!req.session || !req.session.user) {
            return res.status(401).json({ 
                isAuthenticated: false,
                message: "No active session found"
            });
        }

        // Verify user still exists in database
        const user = await pool.query(
            'SELECT user_id, user_name, user_email, is_admin FROM users WHERE user_id = $1',
            [req.session.user.id]
        );

        if (user.rows.length === 0) {
            // User no longer exists in database
            req.session.destroy();
            return res.status(401).json({
                isAuthenticated: false,
                message: "User not found"
            });
        }

        res.status(200).json({ 
            isAuthenticated: true, 
            user: {
                id: user.rows[0].user_id,
                name: user.rows[0].user_name,
                email: user.rows[0].user_email,
                is_admin: user.rows[0].is_admin
            }
        });
    } catch (err) {
        console.error("Check-auth error:", err);
        res.status(500).json({ 
            isAuthenticated: false,
            message: "Server error during authentication check" 
        });
    }
});

// Check admin status
router.get('/check-admin', (req, res) => {
    if (req.session.user && req.session.user.is_admin) {
        res.status(200).json({ isAdmin: true });
    } else {
        res.status(200).json({ isAdmin: false });
    }
});

// Get user information
router.get('/user-info', async (req, res) => {
    try {
        // Force session reload
        await new Promise((resolve) => req.session.reload(resolve));

        console.log("Session after reload:", {
            id: req.sessionID,
            user: req.session?.user,
            authenticated: req.session?.authenticated
        });

        if (!req.session?.authenticated || !req.session?.user?.id) {
            return res.status(401).json({ 
                message: "Not authenticated",
                debug: { sessionId: req.sessionID }
            });
        }

        const userInfo = await pool.query(
            'SELECT user_id, user_name, user_email, user_contact_no, is_admin FROM users WHERE user_id = $1',
            [req.session.user.id]
        );

        if (userInfo.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            success: true,
            user: userInfo.rows[0]
        });
    } catch (err) {
        console.error("User info error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Get current user ID
router.get('/current-user', (req, res) => {
  console.log('Current User Debug:', {
    sessionExists: !!req.session,
    sessionUser: req.session?.user,
    cookies: req.headers.cookie
  });

  if (req.session && req.session.user && req.session.user.id) {
    res.status(200).json({
      success: true,
      userId: req.session.user.id,
      sessionInfo: req.session.user
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Not authenticated",
      debugInfo: {
        hasSession: !!req.session,
        hasSessionUser: !!req.session?.user,
        sessionID: req.sessionID
      }
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
    try {
        if (!req.session) {
            return res.status(200).json({ message: "Already logged out" });
        }

        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).json({ message: "Could not log out" });
            }

            res.clearCookie('sessionId');
            res.status(200).json({ message: "Logged out successfully" });
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: "Server error during logout" });
    }
});

module.exports = router;

