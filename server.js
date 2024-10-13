// Disclosure: I used ChatGPT to assist with the content of this assignment.


const http = require('http');
const mysql = require('mysql2');
const url = require('url');
const messages = require('./lang/en/en'); // Import the messages
const port = process.env.PORT || 3000; // Use the Heroku-assigned port if available, otherwise default to 3000

// Create connection to the MySQL database
const db = mysql.createConnection({
    host: 'zj2x67aktl2o6q2n.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'e72hw5599nadybng',
    password: 'ek1g35pc8itb0xm8',
    database: 'eo3ysjp1m3pfhh64'
});

// Create the patient table if it doesn't exist
db.connect((err) => {
    if (err) throw err;
    console.log('MySQL connected...');
    const createTable = `CREATE TABLE IF NOT EXISTS patients (
        patientid INT(11) AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        dateOfBirth DATETIME
    ) ENGINE=INNODB;`;
    db.query(createTable, (err, result) => {
        if (err) throw err;
        console.log("Table created or exists.");
    });
});

// Handle SQL queries and POST requests
http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');  // Allow all origins
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS (preflight) requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    let parsedUrl = url.parse(req.url, true);

    // Handle Insert Request (POST /insert)
    if (req.method === 'POST' && parsedUrl.pathname === '/lab5/api/v1/insert') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const bodyData = JSON.parse(body);
            const patientData = bodyData.data;

            if (!patientData || patientData.length === 0) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end(messages.errors.noPatientData); // Use message from en.js
                return;
            }

            // Insert patient data into the database
            const insertData = `INSERT INTO patients (name, dateOfBirth) VALUES ${patientData};`;

            db.query(insertData, (err, result) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end(messages.errors.insertError.replace('%1', err.message)); // Dynamic error message
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(messages.success.dataInserted); // Success message
            });
        });
    }
    else if (parsedUrl.pathname === '/lab5/api/v1/sql') {
        let query;

        // Handle GET requests (use URL parameter for the query)
        if (req.method === 'GET') {
            query = parsedUrl.query.query;

            if (!query) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end(messages.errors.missingQuery); // Use message from en.js
                return;
            }

            // At this point, query has been set
            handleQuery(query);
        }
        // Handle POST requests (read query from the request body)
        else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', () => {
                const bodyData = JSON.parse(body);
                query = bodyData.query;

                if (!query) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end(messages.errors.missingQuery); // Use message from en.js
                    return;
                }

                handleQuery(query);
            });

            return;
        } else {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end(messages.errors.endpointNotFound); // Use message from en.js
            return;
        }

        // At this point, `query` has been set from either GET or POST
        handleQuery(query);

        function handleQuery(query) {
            // Block DROP or DELETE queries
            if (/drop|delete/i.test(query)) {
                res.writeHead(403, { 'Content-Type': 'text/plain' });
                res.end(messages.errors.sqlForbidden); // Use message from en.js
                return;
            }

            // Execute the query
            db.query(query, (err, result) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: messages.errors.sqlError.replace('%1', err.message) }));
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            });
        }
    }
    // Default 404 response
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(messages.errors.endpointNotFound); // Use message from en.js
    }
}).listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});


