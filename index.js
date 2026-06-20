const { Client, GatewayIntentBits, Collection, AttachmentBuilder, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
require('dotenv').config();

// --- [إعداد سيرفر الويب للاستضافة 24/7] ---
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('🚀 البوت يعمل بنجاح ومستعد لتلقي الأوامر 24/7!');
});

app.listen(port, () => {
    console.log(`🌍 السيرفر الوهمي شغال على المنفذ ${port}`);
});
// -------------------------------------

const { getAllPlayerData } = require('./src/utils/googleSheets');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// تحميل الخط
const fontPath = path.join(__dirname, 'src', 'templates', 'BodoniFLF.ttf');
GlobalFonts.registerFromPath(fontPath, 'Bodoni FLF');

// إعدادات إحداثيات وألوان البطاقات
const rankConfigurations = {
    silver: {
        fileName: 'silver.png', textColor: '#FFFFFF', idColor: '#CCCCCC',
        avatar: { x: 280, y: 411, r: 131 },    
        username: { x: 720, y: 610, maxWidth: 450 }, userId: { x: 720, y: 700 },            
        kd: { x: 256, y: 995 }, kills: { x: 513, y: 995 }, games: { x: 774, y: 995 }              
    },
    gold: { 
        fileName: 'gold.png', textColor: '#FFFFFF', idColor: '#FFD700',
        avatar: { x: 319, y: 401, r: 127 }, 
        username: { x: 685, y: 690, maxWidth: 450 }, userId: { x: 690, y: 760 },            
        kd: { x: 283, y: 995 }, kills: { x: 513, y: 995 }, games: { x: 745, y: 995 }
    },
    platinum: {
        fileName: 'platinum.png', textColor: '#FFFFFF', idColor: '#D1E8E2',
        avatar: { x: 313, y: 424, r: 113 },    
        username: { x: 700, y: 590, maxWidth: 450 }, userId: { x: 700, y: 670 },            
        kd: { x: 285, y: 960 }, kills: { x: 513, y: 960 }, games: { x: 740, y: 960 } 
    },
    crimson: {
        fileName: 'crimson.png', textColor: '#FFFFFF', idColor: '#A0A0A0',
        avatar: { x: 309, y: 472, r: 97 },    
        username: { x: 650, y: 630, maxWidth: 380 }, userId: { x: 650, y: 685 },            
        kd: { x: 305, y: 900 }, kills: { x: 505, y: 900 }, games: { x: 705, y: 900 } 
    },
    iridescent: {
        fileName: 'iridescent.png', textColor: '#FFFFFF', idColor: '#E0B0FF',
        avatar: { x: 312, y: 477, r: 91 }, 
        username: { x: 630, y: 600, maxWidth: 380 }, userId: { x: 645, y: 660 }, 
        kd: { x: 315, y: 858 }, kills: { x: 510, y: 858 }, games: { x: 700, y: 858 }
    },
    top: { 
        fileName: 'top.png', textColor: '#FFFFFF', idColor: '#FF4500',
        avatar: { x: 350, y: 459, r: 120 }, 
        username: { x: 680, y: 640, maxWidth: 450 }, userId: { x: 695, y: 708 },            
        kd: { x: 325, y: 890 }, kills: { x: 513, y: 890 }, games: { x: 700, y: 890 }
    }
};

// إعداد الأوامر المتاحة 
client.commands = new Collection();
const setupBulkCommand = require(path.join(__dirname, 'src', 'commands', 'setupbulk.js'));
client.commands.set(setupBulkCommand.data.name, setupBulkCommand);

// 1. أمر إنشاء واجهة التفاعل للإدارة (!setup)
client.on(Events.MessageCreate, async message => {
    if (message.content === '!setup' && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        
        const embed = new EmbedBuilder()
            .setTitle('⚔️ ميـدان الشـرف: بطاقـة المقاتـل')
            .setDescription(`**هل تعتقد أن إنجازاتك في الميدان تتحدث عن نفسها؟**\n\nالوقت قد حان لتعرف تصنيفك الحقيقي بين النخبة. لا مكان للصدفة، الأرقام هي التي تقرر من يستحق التاج ومن سيبقى في الظل.\n\n🛡️ **اضغط على الزر أدناه** لتكشف عن بطاقة إحصائياتك الشخصية، وتعرف ما إذا كان اسمك محفوراً ضمن أساطير القمة، أم أنك بحاجة للعودة للميدان وإثبات قوتك!`)
            .setColor('#FF4500') 
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'إدارة السيرفر - نظام الإحصائيات الذكي' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('get_my_card')
                    .setLabel('اكشف عن مستواك!')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔥'),
                new ButtonBuilder()
                    .setCustomId('show_leaderboard')
                    .setLabel('لوحة الصدارة')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏆')
            );

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete(); 
    }
});

// 2. التفاعل مع الأزرار والأوامر
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try { await command.execute(interaction); } 
        catch (error) { console.error(error); }
    }

    // ==========================================
    // زر استخراج البطاقة الفردية
    // ==========================================
    if (interaction.isButton() && interaction.customId === 'get_my_card') {
        await interaction.deferReply({ ephemeral: true });
        
        const discordId = interaction.user.id;
        const playerDataMap = await getAllPlayerData();
        
        if (playerDataMap.size === 0) {
            return interaction.editReply('❌ النظام غير قادر على جلب البيانات حالياً. تواصل مع الإدارة.');
        }

        const data = playerDataMap.get(discordId);
        if (!data) {
            return interaction.editReply('❌ عذراً، لم أتمكن من العثور على إحصائياتك في قاعدة البيانات. تأكد من تسجيلك.');
        }

        try {
            const killsCount = parseInt(data.kills) || 0;
            const gamesPlayed = parseInt(data.games) || 0;
            
            let kdValue = 0;
            if (gamesPlayed > 0) kdValue = killsCount / gamesPlayed; 

            let determinedRank = 'silver'; 
            if (gamesPlayed > 5) {
                if (kdValue >= 30.0) determinedRank = 'top';
                else if (kdValue >= 20.0) determinedRank = 'iridescent';
                else if (kdValue >= 15.0) determinedRank = 'crimson';
                else if (kdValue >= 10.0) determinedRank = 'platinum';
                else determinedRank = 'gold';
            }

            const currentRank = rankConfigurations[determinedRank];
            const nickname = interaction.user.globalName || interaction.user.username;
            const avatarUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 256 });

            const templatePath = path.join(__dirname, 'src', 'templates', currentRank.fileName);
            const background = await loadImage(templatePath);
            const canvas = createCanvas(background.width, background.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            let avatar;
            try { avatar = await loadImage(avatarUrl); } 
            catch (e) { avatar = await loadImage('https://discord.com/assets/6f26effa10b40736e3e5.png'); }

            const avCoords = currentRank.avatar;
            ctx.save(); 
            ctx.beginPath(); 
            ctx.arc(avCoords.x, avCoords.y, avCoords.r, 0, Math.PI * 2, true); 
            ctx.closePath(); 
            ctx.clip();
            ctx.drawImage(avatar, avCoords.x - avCoords.r, avCoords.y - avCoords.r, avCoords.r * 2, avCoords.r * 2); 
            ctx.restore();

            ctx.textAlign = 'center';  
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'; 
            ctx.shadowBlur = 4; 
            ctx.shadowOffsetX = 2; 
            ctx.shadowOffsetY = 2;

            ctx.fillStyle = currentRank.textColor; 
            let fontSize = 38; 
            ctx.font = `bold ${fontSize}px "Bodoni FLF"`;
            while (ctx.measureText(nickname).width > currentRank.username.maxWidth && fontSize > 18) {
                fontSize -= 2; 
                ctx.font = `bold ${fontSize}px "Bodoni FLF"`;
            }
            ctx.fillText(nickname, currentRank.username.x, currentRank.username.y); 

            ctx.fillStyle = currentRank.idColor; 
            ctx.font = '18px "Bodoni FLF"'; 
            ctx.fillText(`ID: ${discordId}`, currentRank.userId.x, currentRank.userId.y); 

            ctx.fillStyle = currentRank.textColor; 
            ctx.font = 'bold 52px "Bodoni FLF"'; 
            
            let displayKD = kdValue.toFixed(1); 
            ctx.fillText(displayKD, currentRank.kd.x, currentRank.kd.y); 
            ctx.fillText(killsCount.toString(), currentRank.kills.x, currentRank.kills.y); 
            ctx.fillText(gamesPlayed.toString(), currentRank.games.x, currentRank.games.y); 

            const buffer = canvas.toBuffer('image/png');
            const attachment = new AttachmentBuilder(buffer, { name: `${nickname}-${determinedRank}.png` });

            await interaction.editReply({ content: `👑 تم استخراج بطاقتك بنجاح!`, files: [attachment] });

        } catch (singleError) {
            console.error(`❌ خطأ أثناء توليد البطاقة:`, singleError);
            return interaction.editReply('❌ حدث خطأ أثناء تجهيز بطاقتك. حاول مرة أخرى لاحقاً.');
        }
    }

    // ==========================================
    // زر التفاعل مع "لوحة الصدارة" (> 5 أقيام حصرياً)
    // ==========================================
    if (interaction.isButton() && interaction.customId === 'show_leaderboard') {
        await interaction.deferReply({ ephemeral: true });

        const playerDataMap = await getAllPlayerData();
        if (playerDataMap.size === 0) return interaction.editReply('❌ لا توجد بيانات متاحة حالياً.');

        let players = [];
        for (const [id, data] of playerDataMap) {
            const gamesPlayed = parseInt(data.games) || 0;
            
            if (gamesPlayed > 5) {
                const kills = parseInt(data.kills) || 0;
                const kd = kills / gamesPlayed;
                players.push({ id, kd }); 
            }
        }

        if (players.length === 0) {
            return interaction.editReply('❌ لا يوجد لاعبون مؤهلون للوحة الصدارة حالياً (يجب لعب أكثر من 5 أقيام).');
        }

        players.sort((a, b) => b.kd - a.kd);
        const top10 = players.slice(0, 10);

        let lbDescription = '🏆 **أفضل 10 مقاتلين في السيرفر:**\n*(حصرياً للمقاتلين الذين خاضوا أكثر من 5 معارك)*\n\n';
        
        // التعديل تم هنا: استخدام <@ID> لعمل المنشن بشكل مباشر
        for (let i = 0; i < top10.length; i++) {
            const p = top10[i];
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🔹';
            lbDescription += `${medal} **${i + 1}.** <@${p.id}> | KD: **${p.kd.toFixed(2)}**\n`;
        }

        const lbEmbed = new EmbedBuilder()
            .setTitle('📊 لوحة صدارة الأساطير')
            .setDescription(lbDescription)
            .setColor('#FFD700')
            .setFooter({ text: 'استمر في القتال لتصعد للقمة!' });

        await interaction.editReply({ embeds: [lbEmbed] });
    }
});

client.once(Events.ClientReady, c => {
    console.log(`🚀 البوت شغال ومستعد للأتمتة باسم: ${c.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
