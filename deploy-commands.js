const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // جلب بيانات السرية من ملف .env

const commands = [];
// تحديد مسار مجلد الأوامر داخل src
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// المرور على جميع ملفات الأوامر وتحويلها إلى صيغة JSON التي يفهمها ديسكورد
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`⚠️ تنبيه: الملف في المسار ${filePath} يفتقد لخصائص "data" أو "execute" الأساسية.`);
    }
}

// إعداد وحدة تشغيل واجهة برمجة التطبيقات (REST API) الخاصة بديسكورد
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// دالة الإرسال والتسجيل الفوري
(async () => {
    try {
        console.log(`⏳ جاري تسجيل ${commands.length} من أوامر السلاش (Slash Commands) في سيرفر الاختبار...`);

        // تسجيل الأوامر بشكل مخصص لسيرفر الاختبار السري الخاص بك (تحديث فوري لسرعة التطوير)
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log(`✅ تم بنجاح تسجيل (${data.length}) أمر في سيرفر الاختبار الخاص بك! يمكنك استخدامها الآن.`);
    } catch (error) {
        // طباعة الأخطاء في حال وجود مشكلة في آيدي البوت أو السيرفر
        console.error('❌ حدث خطأ أثناء تسجيل الأوامر:', error);
    }
})();