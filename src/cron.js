// jobs/emailReminderJob.js
import cron from "node-cron";
import sendMail from "../services/nodeMailer.js";
import logger from "../utils/logger.js"; // optional structured logger

/**
 * Initializes the daily email reminder job.
 */
export const initEmailReminderJob = () => {
    cron.schedule("0 0 * * *", async () => {
        const timestamp = new Date().toISOString();
        logger.info(`[${timestamp}] 🕛 Running scheduled email reminder task`);

        try {
            await sendMail();
            logger.info(`[${timestamp}] ✅ Email reminders sent successfully`);
        } catch (error) {
            logger.error(`[${timestamp}] ❌ Failed to send email reminders`, {
                error: error.stack || error.message,
            });
        }
    });

    logger.info("✅ Cron job for daily email reminders initialized");
};
