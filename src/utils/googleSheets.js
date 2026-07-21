const { google } = require('googleapis');
require('dotenv').config();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// الاتصال المباشر عبر متغيرات Railway وحذف الاعتماد على ملف الـ JSON
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
        
        // ⚠️ تنبيه: تأكد أن اسم التبويب في أسفل جدول جوجل لديك هو Sheet1
        const range = 'Sheet1!A2:F'; 
        
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values;
        
        const dataMap = new Map();
        if (!rows || rows.length === 0) {
            console.log("⚠️ الجدول فارغ أو لم يتم العثور على بيانات.");
            return dataMap;
        }
        
        rows.forEach(row => {
            const [discord_id, name, kd, kills, games, rank] = row;
            if (discord_id) {
                dataMap.set(discord_id.trim(), {
                    id: discord_id.trim(),
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
        console.error("❌ خطأ أثناء قراءة البيانات من جوجل شيت:", error.message);
        return new Map(); // إرجاع خريطة فارغة لحماية البوت من التعليق
    }
}

module.exports = { getAllPlayerData };
