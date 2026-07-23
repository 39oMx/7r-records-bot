const { 
    Client, GatewayIntentBits, Collection, AttachmentBuilder, Events, 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits,
    UserSelectMenuBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle 
} = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');
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

// --- [إدارة بيانات الروستر المحفوظة محلياً] ---
const rosterDataPath = path.join(__dirname, 'roster_data.json');

function getRosterData() {
    if (!fs.existsSync(rosterDataPath)) {
        fs.writeFileSync(rosterDataPath, JSON.stringify({}));
    }
    try {
        return JSON.parse(fs.readFileSync(rosterDataPath, 'utf8'));
    } catch (e) {
        return {};
    }
}

function saveRosterData(data) {
    fs.writeFileSync(rosterDataPath, JSON.stringify(data, null, 2));
}

// --- [تسجيل الخطوط] ---
// 1. خط بطاقات المستوى والإحصائيات Bodoni FLF
const cardFontPath = path.join(__dirname, 'src', 'templates', 'BodoniFLF.ttf');
GlobalFonts.registerFromPath(cardFontPath, 'Bodoni FLF');

// 2. خط الروستر العربي/القياسي
const rosterFontPath = path.join(__dirname, 'src', 'templates', 'PlayfairDisplay-VariableFont_wght.ttf');
if (fs.existsSync(rosterFontPath)) {
    GlobalFonts.registerFromPath(rosterFontPath, 'Playfair Display');
}

// ⬇️ === [ أضف أيديهات الرتب والأسماء المخصصة هنا بالترتيب ] === ⬇️
const CUSTOM_ROLES = [
    { id: '1150626780550533141', displayName: 'OWNER' },
    { id: '1212529351396954162', displayName: 'CEO' },
    { id: '1448335233278542027', displayName: 'RIGHT HAND' },
    { id: '1400698234669633637', displayName: 'CLAN LEADER' },
    { id: '1405670992025616394', displayName: 'ADMIN' },
    { id: '1408511418478755850', displayName: 'HIGH STAFF' },
    { id: '1515054401881112606', displayName: 'QUALITY CONTROL' },
    { id: '1495722899204472872', displayName: 'RG LEADER' },
    { id: '1524770799888633886', displayName: 'AMBASSADOR' },
    { id: '1416430043655176262', displayName: '7R MEMBER' }    
];

// إعدادات إحداثيات البطاقات
const rankConfigurations = {
    silver: { fileName: 'silver.png', textColor: '#FFFFFF', idColor: '#CCCCCC', avatar: { x: 280, y: 411, r: 131 }, username: { x: 720, y: 610, maxWidth: 450 }, userId: { x: 720, y: 700 }, kd: { x: 256, y: 995 }, kills: { x: 513, y: 995 }, games: { x: 774, y: 995 } },
    gold: { fileName: 'gold.png', textColor: '#FFFFFF', idColor: '#FFD700', avatar: { x: 319, y: 401, r: 127 }, username: { x: 685, y: 690, maxWidth: 450 }, userId: { x: 690, y: 760 }, kd: { x: 283, y: 995 }, kills: { x: 513, y: 995 }, games: { x: 745, y: 995 } },
    platinum: { fileName: 'platinum.png', textColor: '#FFFFFF', idColor: '#D1E8E2', avatar: { x: 313, y: 424, r: 113 }, username: { x: 700, y: 590, maxWidth: 450 }, userId: { x: 700, y: 670 }, kd: { x: 285, y: 960 }, kills: { x: 513, y: 960 }, games: { x: 740, y: 960 } },
    crimson: { fileName: 'crimson.png', textColor: '#FFFFFF', idColor: '#A0A0A0', avatar: { x: 309, y: 472, r: 97 }, username: { x: 650, y: 630, maxWidth: 380 }, userId: { x: 650, y: 685 }, kd: { x: 305, y: 900 }, kills: { x: 505, y: 900 }, games: { x: 705, y: 900 } },
    iridescent: { fileName: 'iridescent.png', textColor: '#FFFFFF', idColor: '#E0B0FF', avatar: { x: 312, y: 477, r: 91 }, username: { x: 630, y: 600, maxWidth: 380 }, userId: { x: 645, y: 660 }, kd: { x: 315, y: 858 }, kills: { x: 510, y: 858 }, games: { x: 700, y: 858 } },
    top: { fileName: 'top.png', textColor: '#FFFFFF', idColor: '#FF4500', avatar: { x: 350, y: 459, r: 120 }, username: { x: 680, y: 640, maxWidth: 450 }, userId: { x: 695, y: 708 }, kd: { x: 325, y: 890 }, kills: { x: 513, y: 890 }, games: { x: 700, y: 890 } }
};

client.commands = new Collection();

// --- [دالة تحديث لوحة التحكم] ---
async function updateControlPanel(guild) {
    try {
        const controlChannelId = process.env.ROSTER_CONTROL_CHANNEL_ID;
        const controlMessageId = process.env.ROSTER_CONTROL_MESSAGE_ID;
        const teamRoleId = process.env.TEAM_ROLE_ID;

        if (!controlChannelId || !controlMessageId || !teamRoleId) return;

        const channel = await client.channels.fetch(controlChannelId).catch(() => null);
        if (!channel) return;

        const message = await channel.messages.fetch(controlMessageId).catch(() => null);
        if (!message) return;

        const role = guild.roles.cache.get(teamRoleId);
        if (!role) return;

        const rosterData = getRosterData();
        const teamMembers = Array.from(role.members.values());

        const unregistered = teamMembers.filter(m => !rosterData[m.id]);
        const registered = teamMembers.filter(m => rosterData[m.id]);

        let unregisteredText = unregistered.length > 0 
            ? unregistered.map(m => `<@${m.id}>`).join(' • ') 
            : '✅ جميع أعضاء الفريق مسجلون بالكامل!';

        if (unregisteredText.length > 950) {
            unregisteredText = unregisteredText.substring(0, 900) + `\n...وغيرهم (**+${unregistered.length}** لاعب)`;
        }

        let registeredText = registered.length > 0 
            ? registered.map(m => `<@${m.id}> ➔ **${rosterData[m.id]}**`).join('\n') 
            : '⚠️ لا يوجد أعضاء مسجلون حالياً.';

        if (registeredText.length > 950) {
            registeredText = registeredText.substring(0, 900) + `\n...وغيرهم (**+${registered.length}** لاعب)`;
        }

        const embed = new EmbedBuilder()
            .setTitle('⚙️ لوحة تحكم الروستر (Roster Management)')
            .setDescription('يمكنك التحكم بالأعضاء الظاهرين في صورة الروستر لتفادي مشكلة المربعات والأسماء المزخرفة.')
            .addFields(
                { name: `📌 الأسماء الغير مسجلة في الروستر (${unregistered.length})`, value: unregisteredText },
                { name: `✅ الأسماء المسجلة حالياً (${registered.length})`, value: registeredText }
            )
            .setColor('#FF4500')
            .setFooter({ text: `آخر تحديث: ${new Date().toLocaleTimeString('ar-EG')}` });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_roster_add')
                .setLabel('إضافة إلى الروستر')
                .setStyle(ButtonStyle.Success)
                .setEmoji('➕'),
            new ButtonBuilder()
                .setCustomId('btn_roster_remove')
                .setLabel('حذف من الروستر')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️'),
            new ButtonBuilder()
                .setCustomId('btn_roster_refresh')
                .setLabel('تحديث اللوحة')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄')
        );

        await message.edit({ embeds: [embed], components: [row] });

    } catch (error) {
        console.error("❌ خطأ أثناء تحديث لوحة التحكم:", error);
    }
}

// --- [دالة رسم وتحديث صورة الروستر المباشرة] ---
async function updateRosterLive() {
    try {
        const channelId = process.env.ROSTER_CHANNEL_ID;
        const messageId = process.env.ROSTER_MESSAGE_ID;
        const teamRoleId = process.env.TEAM_ROLE_ID;

        if (!channelId || !messageId || !teamRoleId) return;

        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel) return;

        const role = channel.guild.roles.cache.get(teamRoleId);
        if (!role) return;

        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message) return;

        const rosterData = getRosterData();

        const membersProcessed = [];
        Array.from(role.members.values()).forEach(member => {
            if (rosterData[member.id]) {
                let matchedCustomRole = null;
                let priorityIndex = 999; 

                for (let i = 0; i < CUSTOM_ROLES.length; i++) {
                    const roleConfig = CUSTOM_ROLES[i];
                    if (member.roles.cache.has(roleConfig.id)) {
                        matchedCustomRole = roleConfig;
                        priorityIndex = i; 
                        break;
                    }
                }

                let roleNameToShow = 'عضو';
                if (matchedCustomRole) {
                    roleNameToShow = matchedCustomRole.displayName;
                } else {
                    const highestNormalRole = member.roles.cache
                        .filter(r => r.id !== channel.guild.id && !r.managed)
                        .sort((a, b) => b.position - a.position)
                        .first();
                    if (highestNormalRole) roleNameToShow = highestNormalRole.name;
                }

                membersProcessed.push({
                    member,
                    displayName: rosterData[member.id], 
                    roleName: roleNameToShow,
                    priorityIndex: priorityIndex
                });
            }
        });

        membersProcessed.sort((a, b) => a.priorityIndex - b.priorityIndex);

        const chunkSize = 20;
        const chunks = [];
        for (let i = 0; i < membersProcessed.length; i += chunkSize) {
            chunks.push(membersProcessed.slice(i, i + chunkSize));
        }

        if (chunks.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`📋 قائمة أبطال فريق: ${role.name}`)
                .setDescription('لا يوجد أعضاء مسجلين في الروستر حالياً.')
                .setColor(role.hexColor || '#FF4500')
                .setThumbnail(channel.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `آخر تحديث: ${new Date().toLocaleTimeString('ar-EG')}` });
            await message.edit({ embeds: [embed], files: [] });
            return;
        }

        const templatePath = path.join(__dirname, 'src', 'templates', 'roster_bg.png');
        const background = await loadImage(templatePath);
        
        const attachments = []; 
        const embeds = [];

        for (let c = 0; c < chunks.length; c++) {
            const currentChunk = chunks[c];
            const canvas = createCanvas(background.width, background.height);
            const ctx = canvas.getContext('2d');
            
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
            ctx.font = 'bold 22px "Playfair Display", sans-serif'; 
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            const leftColumnX_Num = 100, leftColumnX_Name = 230, leftColumnX_Role = 600;  
            const rightColumnX_Num = 910, rightColumnX_Name = 1010, rightColumnX_Role = 1420; 
            const startY = 405, rowHeight = 42.5;        

            currentChunk.forEach((item, index) => {
                let xNum, xName, xRole, y;
                const globalIndex = (c * 20) + index + 1;

                if (index < 10) {
                    xNum = leftColumnX_Num; xName = leftColumnX_Name; xRole = leftColumnX_Role;
                    y = startY + (index * rowHeight);
                } else {
                    xNum = rightColumnX_Num; xName = rightColumnX_Name; xRole = rightColumnX_Role;
                    y = startY + ((index - 10) * rowHeight);
                }

                ctx.fillStyle = '#FF4444'; 
                ctx.textAlign = 'right';
                ctx.fillText(`${globalIndex}-`, xNum, y);

                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'left';
                let formattedName = item.displayName.length > 17 ? item.displayName.substring(0, 15) + '...' : item.displayName;
                ctx.fillText(formattedName, xName, y);

                ctx.fillStyle = '#CCCCCC'; 
                let formattedRole = item.roleName.length > 15 ? item.roleName.substring(0, 13) + '...' : item.roleName;
                ctx.fillText(formattedRole, xRole, y);
            });

            const fileName = `roster_part_${c + 1}.png`;
            const buffer = await canvas.toBuffer('image/png');
            attachments.push(new AttachmentBuilder(buffer, { name: fileName }));

            const imgEmbed = new EmbedBuilder()
                .setColor(role.hexColor || '#8B0000')
                .setImage(`attachment://${fileName}`);

            if (c === 0) {
                imgEmbed.setTitle(`📋 قائمة أبطال فريق: ${role.name}`)
                        .setDescription(`إجمالي الأعضاء المسجلين: **${membersProcessed.length}** لاعب`)
                        .setThumbnail(channel.guild.iconURL({ dynamic: true }));
            }

            if (c === chunks.length - 1) {
                imgEmbed.setFooter({ text: `آخر تحديث تلقائي: ${new Date().toLocaleTimeString('ar-EG')}` })
                        .setTimestamp();
            }

            embeds.push(imgEmbed);
        }

        await message.edit({ embeds: embeds, files: attachments });
        console.log("✅ تم تحديث صورة الروستر بنجاح!");

        await updateControlPanel(channel.guild);

    } catch (error) {
        console.error("❌ خطأ أثناء تحديث الروستر:", error);
    }
}

// --- [استقبال الأوامر النصية] ---
client.on(Events.MessageCreate, async message => {
    if (!message.member || !message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    if (message.content === '!setup') {
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
        await message.delete().catch(() => {}); 
    }

    if (message.content === '!setuprostercontrol') {
        const embed = new EmbedBuilder()
            .setTitle('⚙️ لوحة تحكم الروستر')
            .setDescription('جاري إعداد اللوحة...')
            .setColor('#FF4500');

        const msg = await message.channel.send({ embeds: [embed] });
        process.env.ROSTER_CONTROL_CHANNEL_ID = message.channel.id;
        process.env.ROSTER_CONTROL_MESSAGE_ID = msg.id;

        console.log(`📌 أضف هذه القيم في متغيرات الاستضافة:
ROSTER_CONTROL_CHANNEL_ID=${message.channel.id}
ROSTER_CONTROL_MESSAGE_ID=${msg.id}`);

        await updateControlPanel(message.guild);
        await message.delete().catch(() => {});
    }

    if (message.content === '!setuproster') {
        await updateRosterLive(); 
        message.reply('✅ تم تحديث الروستر بالكامل!').then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
        await message.delete().catch(() => {});
    }
});

// --- [معالجة الأزرار والقوائم والتفاعلات] ---
client.on(Events.InteractionCreate, async interaction => {

    // 1. زر "كشف البطاقة"
    if (interaction.isButton() && interaction.customId === 'get_my_card') {
        await interaction.deferReply({ ephemeral: true });
        
        const discordId = interaction.user.id;
        const playerDataMap = await getAllPlayerData();
        
        if (!playerDataMap || playerDataMap.size === 0) {
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
            if (gamesPlayed >= 5) {
                if (kdValue >= 30.0) determinedRank = 'top';
                else if (kdValue >= 20.0) determinedRank = 'iridescent';
                else if (kdValue >= 15.0) determinedRank = 'crimson';
                else if (kdValue >= 10.0) determinedRank = 'platinum';
                else determinedRank = 'gold';
            }

            const currentRank = rankConfigurations[determinedRank];
            
            // 💡 أخذ الاسم من الروستر أولاً، وإذا لم يكن مسجلاً يأخذ اسم حسابه الشخصي
            const rosterData = getRosterData();
            const nickname = rosterData[discordId] || interaction.user.globalName || interaction.user.username;
            
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

            // 💡 طباعة اسم الروستر باستخدام خط Bodoni FLF
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

    // 2. زر "لوحة الصدارة"
    if (interaction.isButton() && interaction.customId === 'show_leaderboard') {
        await interaction.deferReply({ ephemeral: true });

        const playerDataMap = await getAllPlayerData();
        if (!playerDataMap || playerDataMap.size === 0) return interaction.editReply('❌ لا توجد بيانات متاحة حالياً.');

        let players = [];
        for (const [id, data] of playerDataMap) {
            const gamesPlayed = parseInt(data.games) || 0;
            if (gamesPlayed > 4) {
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

    // 3. زر "إضافة إلى الروستر"
    if (interaction.isButton() && interaction.customId === 'btn_roster_add') {
        const userSelect = new UserSelectMenuBuilder()
            .setCustomId('select_user_to_add')
            .setPlaceholder('اختر العضو المراد إضافته للروستر')
            .setMinValues(1)
            .setMaxValues(1);

        const row = new ActionRowBuilder().addComponents(userSelect);
        await interaction.reply({ content: '👇 اختر العضو من القائمة التالية:', components: [row], ephemeral: true });
    }

    // 4. اختيار العضو من القائمة
    if (interaction.isUserSelectMenu() && interaction.customId === 'select_user_to_add') {
        const selectedUserId = interaction.values[0];

        const modal = new ModalBuilder()
            .setCustomId(`modal_add_roster_${selectedUserId}`)
            .setTitle('تسجيل اسم اللاعب في الروستر');

        const nameInput = new TextInputBuilder()
            .setCustomId('input_roster_name')
            .setLabel('الاسم الذي سيظهر في الروستر (بدون رموز)')
            .setPlaceholder('مثال: PlayerOne')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(nameInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    // 5. استقبال إدخال الاسم المخصص (Modal)
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_add_roster_')) {
        await interaction.deferReply({ ephemeral: true });
        const targetUserId = interaction.customId.replace('modal_add_roster_', '');
        const customName = interaction.fields.getTextInputValue('input_roster_name').trim();

        const data = getRosterData();
        data[targetUserId] = customName;
        saveRosterData(data);

        await interaction.editReply({ content: `✅ تم تسجيل اللاعب <@${targetUserId}> باسم **${customName}** وتحديث الروستر!` });
        
        await updateRosterLive();
    }

    // 6. زر "حذف من الروستر"
    if (interaction.isButton() && interaction.customId === 'btn_roster_remove') {
        const data = getRosterData();
        const keys = Object.keys(data);

        if (keys.length === 0) {
            return interaction.reply({ content: '❌ لا يوجد أعضاء مسجلون في الروستر حالياً.', ephemeral: true });
        }

        const options = keys.slice(0, 25).map(id => ({
            label: data[id],
            description: `ID: ${id}`,
            value: id
        }));

        const stringSelect = new StringSelectMenuBuilder()
            .setCustomId('select_user_to_remove')
            .setPlaceholder('اختر الاسم المراد حذفه من الروستر')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(stringSelect);
        await interaction.reply({ content: '👇 اختر الاسم المراد حذفه:', components: [row], ephemeral: true });
    }

    // 7. حذف العضو المحدد
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_user_to_remove') {
        await interaction.deferReply({ ephemeral: true });
        const userIdToRemove = interaction.values[0];

        const data = getRosterData();
        const removedName = data[userIdToRemove];
        delete data[userIdToRemove];
        saveRosterData(data);

        await interaction.editReply({ content: `🗑️ تم حذف **${removedName}** من الروستر وإعادته لقائمة غير المسجلين.` });

        await updateRosterLive();
    }

    // 8. زر تحديث اللوحة يدويًا
    if (interaction.isButton() && interaction.customId === 'btn_roster_refresh') {
        await interaction.deferUpdate();
        await updateRosterLive();
    }
});

// --- [جاهزية البوت والتحديث التلقائي] ---
client.once(Events.ClientReady, async c => {
    console.log(`🚀 البوت شغال ومستعد للأتمتة باسم: ${c.user.tag}`);

    for (const guild of c.guilds.cache.values()) {
        await guild.members.fetch().catch(() => {});
    }

    await updateRosterLive();
    
    // تحديث دوري كل 5 دقائق
    setInterval(async () => {
        await updateRosterLive();
    }, 5 * 60 * 1000); 
});

let rosterUpdateTimeout = null;

client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
    const teamRoleId = process.env.TEAM_ROLE_ID;
    if (!teamRoleId) return;

    const hadRole = oldMember.roles.cache.has(teamRoleId);
    const hasRole = newMember.roles.cache.has(teamRoleId);

    if (hadRole !== hasRole) {
        clearTimeout(rosterUpdateTimeout);
        rosterUpdateTimeout = setTimeout(() => updateRosterLive(), 3000);
    }
});

client.login(process.env.DISCORD_TOKEN);
