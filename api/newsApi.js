const https = require('https');
require('dotenv').config();

const options = {
    method: process.env.RAPID_METHOD,
    hostname: process.env.RAPID_HOSTNAME,
    port: null,
    path: process.env.RAPID_PATH,
    headers: {
        'x-rapidapi-key': process.env.RAPID_X_RAPIDAPI_KEY,
        'x-rapidapi-host': process.env.RAPID_X_RAPIDAPI_HOST
    }
};

const fetchData = async () => {
    try {
        return await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let chunks = [];

                res.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                res.on('end', () => {
                    try {
                        const body = Buffer.concat(chunks).toString();
                        const parsedBody = JSON.parse(body); // Parse the JSON response
                        
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve({ success: true, data: parsedBody.data.mostPopularEntries.assets });
                        } else {
                            resolve({ success: false, data: [], error: { message: "Error", body: parsedBody } });
                        }
                    } catch (error) {
                        reject({ success: false, data: [], error: error });
                    }
                });
            });

            req.on('error', (error) => {
                reject({ success: false, data: [], error: error });
            });

            req.end();
        });
    } catch (error) {
        return { success: false, data: [], error: error };
    }
};

module.exports = fetchData;
