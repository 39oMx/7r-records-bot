const { google } = require('googleapis');
require('dotenv').config();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// 🔒 وضع بيانات الاتصال مباشرة هنا لتجاوز مشاكل Railway نهائياً
const clientEmail = "id-r-sheets-reader@r-cards-bot.iam.gserviceaccount.com"
const privateKey = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDqPYqznCO1csnQ\nuQ7t0xMB8nb+rQboK02HDyRX1ddt/iUpRRobGX1cHBND8q5SoFwSp9IJHGFqnKsV\nPmMupr2tj0djn+YlZ2inaoUf4lsoafG8ROk4QYS48VgdczwHMTSeieT+nrCOEQXf\nRqUlyroferRpMbjeTsKnT/aQ+1F+Phaez1Jfbs9KKah+40yvMUroDbXPLhjhkJzJ\nCzCfiClVDwLq2ryXqmI+HgCnUcwMnfmFuVctip4U1ZmgQK7bmBTANBPeDUqTiG0j\nLxO323nSvTjfp6QjzepJqJe+4XgnZ7ZyqPf/5qbbMk5YWNqjjs9hv/kBboPeKZl5\nq/U75YfNAgMBAAECggEAAJXSHGm7kRtqbI6FqSNFBBwxO4xA+WLbfv1L/elft0T4\nW+jju7JqMv0yYCmj6TEpAW85Fzq8lvq/rALqcqumbGk3kLQea+/yY7HgjDvh/Zus\nYJw6IfrsXuS8XLKfakDjjWWN/M1Qn6+TuIMgVwXLkesCTmJPh6yWLvQETacrY7t2\niMP+iVTlQ+hBf9hFtDsKddf8SXwS2veAz2RspnjDv75LkM0wK1QfjIP55KK9dGdp\nY84jyCUzCqQplDqCpDaA7XD8Gz1Te77Apz6ig/AoW7YjMiAIaj4EgP26TeVf+yVV\ngdYUr1KnvWLos/g6E64XLvD/L9da2dciivXzM+HUBQKBgQD3yuAKs8oaIp9DGmfT\nZfXa0TqmyKOxRVxl0+RYGLrCdwifXneVpB7USkov0Z9cc1w6ZW+bWurHvkJt5PvB\ntxkPBcYznvArmIs/IsCadXWon4C8keZ8qmlb3GEaxk/Fy3pSpeoKPIEYnr/qak8e\n46bxg4aqZKQWBBOEcUNMNmRptwKBgQDx/8DjgXMiRF+a6dkeDS2AqCo7zd3HNOtQ\nIuC2ssx6SDZfZtgb5OaoV9HnJ/miVI7o04vBKubTolf+l0k9qJVT/JQbEz11yP7B\n1rHJmt4HX2VWi0xEZvCBYm+tCqyGhWqLfQRpSAwq3P0bnzj4LLzh/L9yej4kaXt0\nXo3tcEqqmwKBgQC6Ulta0Mv0EPqOW4mchLt0WQVwKcgkYNJUYxr9P0MXPKhIJaFn\n7Oudl2rnQAlDXB8KbgGY4KlPnnmW5qqDg+kcyau6XxWawm5aAAixXAcnzx/fKxoT\nvZPRlgmSN3H+eb017jnojoxH9f67BksOIAIE8nBNKbXUNCZ03THMWc3xSwKBgB/M\n3+gFhr+mBHoy6JkOWkBh2MrrDo2y4okxTB41+LDI9Hws45Emzzin8alSk3dFbVIj\nGmZT4OlGmBGYh8NWd+kFc+Dq8lScCP4n3E0F0M9fNc3dmDQU4t3dtZcjo/A5b/rM\nftvm39JyH8CVd8ME/f0kXXQJpEjco6BzHGtrKiSpAoGBAOUyUmfF5hAMEitcAH6z\nq2SFSP7mbEA5uf8xFXSAmqob4043QDARivCBzLFdgJjdZLy7dV5tnL09pjFAs+YD\nEgF6JrTz+rktQG5qZnIBLF3Q83MoBMod8phlcI5LRJ2Fym5k+wRi/Zy1wzn/KEg0\nkTcUKnX6ch8ES0LQ9JdJcwpR\n-----END PRIVATE KEY-----\n'

const sheetId = process.env.GOOGLE_SHEET_ID || process.env.SHEET_ID;

console.log("-----------------------------------------");
console.log("🔍 فحص الربط المباشر:");
console.log(`📧 الإيميل: ${clientEmail ? '✅ موجود' : '❌ مفقود'}`);
console.log(`🔑 المفتاح السري: ${privateKey ? '✅ موجود' : '❌ مفقود'}`);
console.log(`📊 آيدي الشيت: ${sheetId ? '✅ موجود' : '❌ مفقود'}`);
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
