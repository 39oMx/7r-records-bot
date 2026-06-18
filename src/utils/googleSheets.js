const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const KEYFILE_PATH = path.join(__dirname, '..', '..', 'google-credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILE_PATH,
    scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

async function getAllPlayerData() {
    try {
        const range = 'Sheet1!A2:E';
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values;
        
        if (!rows || rows.length === 0) return new Map();

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