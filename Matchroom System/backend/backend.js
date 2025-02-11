require('dotenv').config(); // Load environment variables
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const email = process.env.EMAIL;
const emailPassword = process.env.EMAIL_PASSWORD;
const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
