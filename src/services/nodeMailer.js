import nodemailer from 'nodemailer';

/**
 * Sends an email using Nodemailer.
 *
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} html - The HTML content of the email.
 * @throws Will throw an error if the email fails to send.
 */
export const sendEmail = async (to, subject, html) => {
    try {
        // Ensure required environment variables are set
        const email = process.env.NODEMAILER_EMAIL;
        const password = process.env.NODEMAILER_PASS;

        if (!email || !password) {
            throw new Error('Email credentials are not set in environment variables.');
        }

        // Configure Nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com', // Correct SMTP host for Gmail
            port: 465, // Port for secure SMTP
            secure: true, // Use SSL for secure connection
            auth: {
                user: email, // Your Gmail address
                pass: password, // App-specific password for Gmail
            },
            connectionTimeout: 10000, // Timeout in milliseconds
            greetingTimeout: 10000, // Greeting timeout in milliseconds
            socketTimeout: 10000, // Socket timeout in milliseconds
        });

        // Define email options
        const mailOptions = {
            from: email, // Sender address
            to, // Recipient address
            subject, // Email subject
            html, // HTML content of the email
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}:`, info.response);
        return info;
    } catch (error) {
        console.error('Failed to send email:', error.message);
        throw new Error(`Email sending failed: ${error.message}`);
    }
};
