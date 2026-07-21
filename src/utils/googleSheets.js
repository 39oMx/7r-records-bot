const { google } = require('googleapis');
require('dotenv').config();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// جلب بيانات تسجيل الدخول من متغيرات Railway مباشرة بدلاً من ملف JSON
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
    },
    scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

async function getAllPlayerData() {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const range = 'Sheet1!A2:F'; // تأكد أن اسم الشيت (Sheet1) مطابق لما لديك
        
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values;
        
        const dataMap = new Map();
        if (!rows || rows.length === 0) return dataMap;
        
        rows.forEach(row => {
            // ترتيب الأعمدة: الآيدي، الاسم، الكيلز، الألعاب، الكي دي، الرتبة
            const [discord_id, name, kd, kills, games, rank] = row;
            if (discord_id) {
                dataMap.set(discord_id.trim(), {
                    id: discord_id,
                    name: name || 'غير معروف',
                    kd: kd || '0',
                    kills: kills || '0',
                    games: games || '0',
                    rank: rank || 'silver'
                });
            }
        });
        
        return dataMap;
    } catch (error) {
        console.error("❌ خطأ في قراءة جوجل شيت:", error.message);
        throw error; // رمي الخطأ ليتم التقاطه في index.js
    }
}

module.exports = { getAllPlayerData };
