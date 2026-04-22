const nodemailer = require('nodemailer');

const test = async () => {
    const user = 'azizenurkurumsalpazarlama@gmail.com';
    const pass = 'fhvb uyru dahz okmc'; // Provided by user
    
    console.log('--- Testing Port 587 (secure: false) ---');
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // TLS
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
    });

    try {
        await transporter.verify();
        console.log('✅ Port 587 (TLS) Successful!');
    } catch (err) {
        console.log('❌ Port 587 Failed:', err.message);
    }

    console.log('\n--- Testing Port 465 (secure: true) ---');
    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // SSL
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
    });

    try {
        await transporter.verify();
        console.log('✅ Port 465 (SSL) Successful!');
    } catch (err) {
        console.log('❌ Port 465 Failed:', err.message);
    }
};

test();
