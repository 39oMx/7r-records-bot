const { google } = require('googleapis');
require('dotenv').config();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// استخدام متغيرات البيئة بدلاً من الملف وحل مشكلة الأسطر في المفتاح السري
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
    },
    scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

async function getAllPlayerData() {
    try {
        const range = 'Sheet1!A2:E'; // تأكد أن اسم الشيت لديك صحيح
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values;

        if (!rows || rows.length === 0) return new Map();

        // 👇=== اترك بقية الكود الموجود عندك بالأسفل كما هو ===👇
        const playerDataMap = new Map();
        rows.forEach(row => {
            const [discordId, rankStatus, kd, kills, games] = row;
            if (discordId) {
                playerDataMap.set(discordId, {
                    rankStatus: rankStatus.toLowerCase().trim(), 
                    kd: kd.toString().trim(),
                    kills: parseInt(kills) || 0,
                    games: parseInt(games) || 0
                });
            }
        });
        return playerDataMap;
    } catch (error) {
        console.error('❌ خطأ في قراءة الجوجل شيت:', error.message);
        return new Map();
    }
}

module.exports = { getAllPlayerData };
