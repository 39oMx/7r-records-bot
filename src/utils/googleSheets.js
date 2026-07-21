const { google } = require('googleapis');
require('dotenv').config();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// جلب البيانات مع دعم كافة الاحتمالات لأسماء المتغيرات في Railway
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.CLIENT_EMAIL || process.env.EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY || process.env.PRIVATE_KEY;
const sheetId = process.env.GOOGLE_SHEET_ID || process.env.SHEET_ID;

console.log("-----------------------------------------");
console.log("🔍 فحص الربط المحدث:");
console.log(`📧 الإيميل: ${clientEmail ? '✅ تم العثور عليه' : '❌ مفقود'}`);
console.log(`🔑 المفتاح السري: ${privateKey ? '✅ تم العثور عليه' : '❌ مفقود'}`);
console.log(`📊 آيدي الشيت: ${sheetId ? '✅ تم العثور عليه' : '❌ مفقود'}`);
console.log("-----------------------------------------");

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: clientEmail,
        private_key: privateKey ? privateKey.replace(/\\n/g, '\n') : undefined
    },
    scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

async function getAllPlayerData() {
    try {
        const range = 'Sheet1!A2:F'; 
        const response = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
        const rows = response.data.values;
        
        const dataMap = new Map();
        if (!rows || rows.length === 0) return dataMap;
        
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
        throw error;
    }
}

module.exports = { getAllPlayerData };
