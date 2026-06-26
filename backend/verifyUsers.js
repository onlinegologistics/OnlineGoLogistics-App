const http = require('http');

const verify = (email, password) => {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ email, password });
        const options = {
            hostname: 'localhost',
            port: 5001,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
            },
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(body));
                } else {
                    reject(body);
                }
            });
        });

        req.on('error', (error) => reject(error.message));
        req.write(data);
        req.end();
    });
};

const run = async () => {
    const users = [
        { email: 'admin_test@gmail.com', password: 'admin123' },
        { email: 'branch_test@gmail.com', password: 'branch123' },
        { email: 'agent_test@gmail.com', password: 'agent123' },
        { email: 'customer_test@gmail.com', password: 'customer123' },
        { email: 'user_test@gmail.com', password: 'user123' }
    ];

    console.log('--- Verifying All Roles ---');
    for (const user of users) {
        try {
            const data = await verify(user.email, user.password);
            console.log(`✅ ${data.role.toUpperCase()}: ${user.email} (Password: ${user.password})`);
        } catch (error) {
            console.error(`❌ FAILED ${user.email}: ${error}`);
        }
    }
};

run();
