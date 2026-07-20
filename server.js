const express = require('express');
const Ably = require('ably');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Your Ably API key stored safely on the server
const ABLY_API_KEY = process.env.ABLY_API_KEY || '1lp6tg.HQf56Q:jG8WN7pKzXPd5tttAPzxYkI1oa3IBXDG_PVPWjknUmI';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const ably = new Ably.Rest(ABLY_API_KEY);

app.use(express.json());

// Automatically serves public/index.html whenever someone visits your site
app.use(express.static(path.join(__dirname, 'public')));

// Secure authentication endpoint for Ably tokens
app.get('/auth', (req, res) => {
    const clientId = req.query.clientId || 'anonymous_agent';
    
    ably.auth.createTokenRequest({ clientId: clientId }, (err, tokenRequest) => {
        if (err) {
            res.status(500).send({ error: err.message });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(tokenRequest));
        }
    });
});

// Admin endpoint for system announcements
app.post('/api/admin/announcement', (req, res) => {
    const { password, message } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, error: 'Unauthorized: Invalid Admin Password' });
    }

    if (!message) {
        return res.status(400).json({ success: false, error: 'Announcement message cannot be empty' });
    }

    const lobbyChannel = ably.channels.get('ARGUS_GLOBAL_LOBBY');
    lobbyChannel.publish('system_announcement', {
        text: message,
        timestamp: new Date().toLocaleTimeString()
    }, (err) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, message: 'Broadcast transmitted successfully!' });
    });
});

app.listen(PORT, () => {
    console.log(`ARGUS Server running on port ${PORT}`);
});
