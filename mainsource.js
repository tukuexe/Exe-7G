const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');

// Replace with your Telegram Bot Token
const TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN';
const bot = new TelegramBot(TOKEN, {polling: true});

// Admin information
const ADMIN_INFO = {
    telegram: 'tukuexe',
    instagram: 'tuku.exe'
};

// Terms and Conditions
const TERMS_AND_CONDITIONS = `
📜 *Terms and Conditions* 📜

1. This bot generates random passwords for personal use only.
2. The developer is not responsible for how you use these passwords.
3. Do not use this bot for illegal activities.
4. Passwords are generated randomly - we don't store them.
5. By using this bot, you agree to these terms.

⚠️ *Warning*: Always ensure you store passwords securely!
`;

// Privacy Policy
const PRIVACY_POLICY = `
🔒 *Privacy Policy* 🔒

1. We do not store any passwords generated by this bot.
2. We do not collect or store your personal data.
3. Chat interactions are processed but not stored permanently.
4. No third-party has access to your interactions with this bot.

Your privacy is important to us!
`;

// Help Information
const HELP_INFO = `
🆘 *Help Section* 🆘

*/start* - Begin interaction with the bot
*/passwords* - Start receiving passwords (one by one continuously)
*/stop* - Stop password generation
*/terms* - View terms and conditions
*/privacy_policy* - View privacy policy
*/help* - Show this help message
*/admin* - Show admin contact information

🔐 *Password Features*:
- 18-character ultra-secure passwords
- AES-999+ inspired algorithm
- Continuous generation until stopped
`;

// Store user states and agreements
const userStates = new Map();

// Password generation functions (same as before)
function generateUltraSecurePassword() {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specials = '!@#$%^&*()_+-=[]{}|;:,.<>?~';
    
    let chaoticPool = '';
    for (let i = 0; i < 4; i++) {
        chaoticPool += lowercase + uppercase + numbers + specials;
        chaoticPool = shuffleString(chaoticPool);
    }
    
    let password = '';
    for (let i = 0; i < 18; i++) {
        const randomIndex = crypto.randomInt(0, chaoticPool.length);
        password += chaoticPool[randomIndex];
    }
    
    password = applyAES999Transformations(password);
    return password;
}

function shuffleString(str) {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}

function applyAES999Transformations(password) {
    const chunks = [];
    for (let i = 0; i < password.length; i += 3) {
        chunks.push(password.slice(i, i + 3));
    }
    
    const processedChunks = chunks.map(chunk => {
        const transformType = crypto.randomInt(0, 5);
        const specials = '!@#$%^&*()_+-=[]{}|;:,.<>?~';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        switch (transformType) {
            case 0:
                return chunk.split('').reverse().join('') + specials[crypto.randomInt(0, specials.length)];
            case 1:
                return shuffleString(chunk + chunk);
            case 2:
                const pos = crypto.randomInt(0, chunk.length);
                return chunk.slice(0, pos) + uppercase[crypto.randomInt(0, uppercase.length)] + chunk.slice(pos);
            case 3:
                return chunk.split('').map(c => 
                    String.fromCharCode(c.charCodeAt(0) ^ crypto.randomInt(0, 256))
                ).join('');
            default:
                return shuffleString(chunk);
        }
    });
    
    let result = processedChunks.join('');
    if (result.length > 18) result = result.slice(0, 18);
    if (result.length < 18) result += generateRandomChars(18 - result.length);
    return shuffleString(result);
}

function generateRandomChars(length) {
    const pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?~';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += pool[crypto.randomInt(0, pool.length)];
    }
    return result;
}

// Handle /start command with terms agreement flow
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userStates.set(chatId, { agreed: false, generating: false });
    
    const welcomeMessage = `
✨ *Welcome to Ultra Secure Password Generator Bot!* ✨

This bot generates ultra-secure 18-character passwords using AES-999+ inspired algorithms.

Before using this bot, please read and agree to our Terms and Conditions.
    `;
    
    const opts = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📜 View Terms', callback_data: 'view_terms' }],
                [{ text: '✅ I Agree to Terms', callback_data: 'agree_terms' }]
            ]
        },
        parse_mode: 'Markdown'
    };
    
    bot.sendMessage(chatId, welcomeMessage, opts);
});

// Handle callback queries
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;

    if (data === 'view_terms') {
        await bot.sendMessage(chatId, TERMS_AND_CONDITIONS, {parse_mode: 'Markdown'});
        
        const opts = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📜 View Terms', callback_data: 'view_terms' }],
                    [{ text: '✅ I Agree to Terms', callback_data: 'agree_terms' }]
                ]
            }
        };
        bot.sendMessage(chatId, 'Please agree to the terms to continue:', opts);
    } 
    else if (data === 'agree_terms') {
        const userState = userStates.get(chatId) || { agreed: false, generating: false };
        userState.agreed = true;
        userStates.set(chatId, userState);
        
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'Thank you for agreeing to the terms!' });
        
        const opts = {
            reply_markup: {
                remove_keyboard: true
            },
            parse_mode: 'Markdown'
        };
        
        await bot.sendMessage(chatId, '🎉 *Thank you for agreeing to our terms!* 🎉', opts);
        
        // Send help section after agreement
        await bot.sendMessage(chatId, HELP_INFO, {parse_mode: 'Markdown'});
    }
});

// Command handlers
bot.onText(/\/terms/, (msg) => {
    bot.sendMessage(msg.chat.id, TERMS_AND_CONDITIONS, {parse_mode: 'Markdown'});
});

bot.onText(/\/privacy_policy/, (msg) => {
    bot.sendMessage(msg.chat.id, PRIVACY_POLICY, {parse_mode: 'Markdown'});
});

bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, HELP_INFO, {parse_mode: 'Markdown'});
});

bot.onText(/\/admin/, (msg) => {
    const adminMessage = `
👨‍💻 *Admin Information* 👨‍💻

Telegram: @${ADMIN_INFO.telegram}
Instagram: ${ADMIN_INFO.instagram}

For any questions or support, please contact the admin.
    `;
    bot.sendMessage(msg.chat.id, adminMessage, {parse_mode: 'Markdown'});
});

// Handle /passwords command
bot.onText(/\/passwords/, async (msg) => {
    const chatId = msg.chat.id;
    const userState = userStates.get(chatId) || { agreed: false, generating: false };
    
    if (!userState.agreed) {
        return bot.sendMessage(chatId, '⚠️ You must agree to the terms first! Please type /start and agree to the terms.');
    }
    
    if (userState.generating) {
        return bot.sendMessage(chatId, 'Password generation is already running! Type /stop to stop it.');
    }
    
    userState.generating = true;
    userStates.set(chatId, userState);
    
    bot.sendMessage(chatId, '🚀 Starting continuous password generation...\nType /stop to stop.', {parse_mode: 'Markdown'});
    
    // Start generating passwords one by one
    const generateAndSend = async () => {
        if (!userStates.get(chatId)?.generating) return;
        
        try {
            const password = generateUltraSecurePassword();
            await bot.sendMessage(chatId, `🔐 Your secure password:\n\`${password}\``, {parse_mode: 'Markdown'});
            
            // Wait 2 seconds before next password
            setTimeout(generateAndSend, 2000);
        } catch (error) {
            console.error('Error generating password:', error);
            userState.generating = false;
            userStates.set(chatId, userState);
        }
    };
    
    generateAndSend();
});

// Handle /stop command
bot.onText(/\/stop/, (msg) => {
    const chatId = msg.chat.id;
    const userState = userStates.get(chatId) || { agreed: false, generating: false };
    
    if (userState.generating) {
        userState.generating = false;
        userStates.set(chatId, userState);
        bot.sendMessage(chatId, '🛑 Password generation stopped. Type /passwords to start again.');
    } else {
        bot.sendMessage(chatId, 'No active password generation to stop.');
    }
});

console.log('Ultra Secure Password Bot is running...');
