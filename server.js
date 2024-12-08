require('dotenv').config(); // Load environment variables from .env file
const express = require('express'); // Import Express
const { exec } = require('child_process'); // Import exec to run shell scripts
const axios = require('axios'); // Import Axios for making HTTP requests

const app = express(); // Initialize the Express app

// Read constants from environment variables or use defaults
const PORT = 9000;
const AUTH_API = process.env.AUTH_API;
const JIDLO_TILCER_BUILD_SCRIPT = process.env.JIDLO_TILCER_BUILD_SCRIPT;

// Middleware to parse JSON (if needed)
app.use(express.json());

const handleRunScript = (scriptPath) => async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
        // Validate the token by making a request to another endpoint
        const validationResponse = await axios.get(AUTH_API, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (validationResponse.status === 200) {
            // Token is valid, execute the script
            exec(scriptPath, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error: ${error.message}`);
                    return res.status(500).send(`Error running script: ${error.message}`);
                }
                if (stderr) {
                    console.error(`stderr: ${stderr}`);
                    return res.status(500).send(`Script error: ${stderr}`);
                }
                console.log(`stdout: ${stdout}`);
                res.status(200).send(`Script executed successfully: ${stdout}`);
            });
        } else {
            // Token validation failed
            res.status(401).send('Unauthorized');
        }
    } catch (err) {
        console.error(`Token validation error: ${err.message}`);
        res.status(401).send('Unauthorized');
    }
};

app.post('/build-jidlo', handleRunScript(JIDLO_TILCER_BUILD_SCRIPT));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});