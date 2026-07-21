const { google } = require('googleapis');
require('dotenv').config();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// بيانات حساب الخدمة الجديد
const clientEmail = "Records-bot@r-cards-bot.iam.gserviceaccount.com";
const privateKey = `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDbSraNPRRVZLcB\nFMY6q1mcA4jj8ImPdcbyMjnZ55vi9okKoEwoyehe4Ok8r9ov8rbY6547yRDiMBSX\n8E4uRTmziuu/k+DaUPOt1XnTTa2j0NL9ZnDjMIbFgIMBateD/VoKRjHxl3TGoVzj\nejHmZPGWUKey4CgDStJXwq4tyTay8rP6XGTqT+oAcRIpBnVpJWmTr8Ylih49v2W5\nfUM27hIq41vupR6GlP7Ktsf6l2/UreqZxrF5Zf3Fmuq1wSQVaqfLxShgUZdTgVmL\nK8aVqdfDoZAZG764mwQM/ADYCSg+5cW1b6vm7BNVWv9J8+JifkE1CXfNXNtl+sWV\nPW9ik2mzAgMBAAECggEAHQOKma9OJGo56FO2UobfSUwSbY4itS9xDhRlIRaKwoG5\n6gUBbpggPYVmdpgRtyxW0uaBvglBSZvw7ZVm0qpoEwA7ZtKK+nehdgt7neB2K+ly\nMQK/xt9hxXnWW3amYxk/M4LMEtnmIm2xG4vMVF5gtHGhboJH6P+aSvBAGWC48v34\n3Md3aFJo0sBz9LGwRxPVMZO72Xb4yVDi0LQsWUYvJYo9k5Qt6NQe4D6HTLMhoooW\nFqYlO2DMo1GzcvollX07VH7yVqcqXYzcO9RLK4lj+MQWJxV+5C+PkHL2I8ROGGBA\novFedBawU1qtBWGQrfhWuhBlR6aBOXPjrHLSLC+VuQKBgQD4AQQhwMnFponALzSF\AeD2fnKhzc1eRwwNNamKNu7GrUSAGGZeyjiMaCs2AxzLL9Qf3QpoSjjOnVYrnrqu\nOSlHVYuO2soBb1FnKLGiIUWFiXP3cNqv8gu6SPSlfsA1wgT3YzLby+FAwMhTPYK4\nvXFe7gvupQp1DIVuGVaTE1GFfQKBgQDiXLY7FDaZ0jvqDE/6AWhIhvddZ/sJllhK\ncbq2640VtOgxMfuCU4WF46t/r094OHKtOKtIoyyX39Y+/wE/Zl9oYdhxLK2NbSus\nGjDNRrPBJKdTLtVisP57VfLot10lP5swTfxo90FewfNo/6QW2hMIpW7d+k0AK085\nEIn9fnkS7wKBgQD3+EwhU5prvfDN8GUa+J3u2M/VaOmG8pLiQl2ajQKCNIzhZ4Q0\nEw4nlaBfCQ2pO9FlaqYVUOEr9bVLOBKAUTcs1CQOWkTQ2nUSKGY0LgBNXPpO1tBS\nTDndsUSslOeq2KwOj2kyy9AV5qxmToJ+JS1ONcZIf0zNbA+d3kfqFs7UIQKBgGfu\n37ESn9tSvzXAf3wv5zzd03gsxQPq5xEPVQal8rqTvMTRyURWqwkFtvnCeb+eU3Eb\ngvGwEkqNeOal2WHN1GKuAl48gFdeV94GCEPogaJd/QHhkBJnaAEjPowBnR/8K3or\nZIihdn9WmDeOoT3o1TJ0GwqK4Y4BVLfD00f0KQ07AoGAP8za7RdAG2TFAOymT3+9\nR9gmzFCpkUZojJ0d4PxOytu24WxVQk2Oa0itj4G+T/RIbXidYWmQbdqtDdlXShq0\nu7cUkN+0CwUOoviSeWaldcehIUbH1ZKtdo11Qo2L2RDLUIt/GWzbVPWAfkknHjT/\n3/wR4vq9EYK07pgi8JmX9Lo=\n-----END PRIVATE KEY-----`;

const sheetId = process.env.GOOGLE_SHEET_ID;

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
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
