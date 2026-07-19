const { Client, GatewayIntentBits, AttachmentBuilder, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('🚀 البوت يعمل 24/7'));
app.listen(port, () => console.log(`🌍 السيرفر الوهمي يعمل على المنفذ ${port}`));

const { getAllPlayerData } = require('./src/utils/googleSheets');
const bot = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]
});

GlobalFonts.registerFromPath(path.join(__dirname, 'src', 'templates', 'BodoniFLF.ttf'), 'Bodoni FLF');

const OWNER_ID = process.env.OWNER_ID;
const TEAM_ROLE_ID = process.env.TEAM_ROLE_ID;

const rankConfigurations = {
    silver: { fileName: 'silver.png', textColor: '#FFFFFF', idColor: '#CCCCCC', avatar: { x: 280, y: 411, r: 131 }, username: { x: 720, y: 610, maxWidth: 450 }, userId: { x: 720, y: 700 }, kd: { x: 256, y: 995 }, kills: { x: 513, y: 995 }, games: { x: 774, y: 995 } },
    gold: { fileName: 'gold.png', textColor: '#FFFFFF', idColor: '#FFD700', avatar: { x: 319, y: 401, r: 127 }, username: { x: 685, y: 690, maxWidth: 450 }, userId: { x: 690, y: 760 }, kd: { x: 283, y: 995 }, kills: { x: 513, y: 995 }, games: { x: 745, y: 995 } },
    platinum: { fileName: 'platinum.png', textColor: '#FFFFFF', idColor: '#D1E8E2', avatar: { x: 313, y: 424, r: 113 }, username: { x: 700, y: 590, maxWidth: 450 }, userId: { x: 700, y: 670 }, kd: { x: 285, y: 960 }, kills: { x: 513, y: 960 }, games: { x: 740, y: 960 } },
    crimson: { fileName: 'crimson.png', textColor: '#FFFFFF', idColor: '#A0A0A0', avatar: { x: 309, y: 472, r: 97 }, username: { x: 650, y: 630, maxWidth: 380 }, userId: { x: 650, y: 685 }, kd: { x: 305, y: 900 }, kills: { x: 505, y: 900 }, games: { x: 705, y: 900 } },
    iridescent: { fileName: 'iridescent.png', textColor: '#FFFFFF', idColor: '#E0B0FF', avatar: { x: 312, y: 477, r: 91 }, username: { x: 630, y: 600, maxWidth: 380 }, userId: { x: 645, y: 660 }, kd: { x: 315, y: 858 }, kills: { x: 510, y: 858 }, games: { x: 700, y: 858 } },
    top: { fileName: 'top.png', textColor: '#FFFFFF', idColor: '#FF4500', avatar: { x: 350, y: 459, r: 120 }, username: { x: 680, y: 640, maxWidth: 450 }, userId: { x: 695, y: 708 }, kd: { x: 325, y: 890 }, kills: { x: 513, y: 890 }, games: { x: 700, y: 890 } }
};

bot.on(Events.MessageCreate, async message => {
    if (!message.member || (!message.member.permissions.has(PermissionFlagsBits.Administrator) && message.member.id !== OWNER_ID)) return;

    if (message.content === '!setupcard') {
        const dataMap = await getAllPlayerData();
        console.log("البيانات المستلمة:", dataMap.size);
        
        const topPlayers = Array.from(dataMap.values())
            .sort((a, b) => parseFloat(b.kd || 0) - parseFloat(a.kd || 0))
            .slice(0, 5)
            .map((p, i) => `${i + 1}. ${p.name || 'لاعب'} | KD: ${p.kd || '0'}`)
            .join('\n');

        const embed = new EmbedBuilder()
            .setTitle('🔥 بطاقات اللاعبين ولوحة الصدارة')
            .setDescription(`**أفضل 5 لاعبين:**\n\n${topPlayers || 'لا توجد بيانات.'}`)
            .setColor('#FF4500');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('get_my_card').setLabel('استخراج بطاقتي').setStyle(ButtonStyle.Danger).setEmoji('🔥')
        );
        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete().catch(() => {});
    }

    if (message.content === '!setuproster') {
        const role = message.guild.roles.cache.get(TEAM_ROLE_ID);
        if (!role) return message.reply('❌ الرتبة غير موجودة.');
        
        // جلب الأعضاء مباشرة من الرتبة لضمان الدقة
        await role.members.fetch();
        const membersList = role.members.map(m => `• ${m.user.username}`).join('\n');
        
        await message.channel.send({ embeds: [new EmbedBuilder().setTitle(`📋 روستر: ${role.name}`).setDescription(membersList || 'لا يوجد أعضاء.').setColor(role.hexColor)] });
        await message.delete().catch(() => {});
    }
});

bot.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton() || interaction.customId !== 'get_my_card') return;
    await interaction.deferReply({ ephemeral: true });
    try {
        const dataMap = await getAllPlayerData();
        const data = dataMap.get(interaction.user.id);
        if (!data) return interaction.editReply('❌ بياناتك غير موجودة في الشيت.');

        const config = rankConfigurations[data.rank?.toLowerCase()] || rankConfigurations.silver;
        const canvas = createCanvas(1200, 1200);
        const ctx = canvas.getContext('2d');
        const bg = await loadImage(path.join(__dirname, 'src', 'templates', config.fileName));
        ctx.drawImage(bg, 0, 0);

        const avatar = await loadImage(interaction.user.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(config.avatar.x, config.avatar.y, config.avatar.r, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, config.avatar.x - config.avatar.r, config.avatar.y - config.avatar.r, config.avatar.r * 2, config.avatar.r * 2);
        ctx.restore();

        ctx.fillStyle = config.textColor;
        ctx.font = '50px "Bodoni FLF"';
        ctx.fillText(interaction.user.username, config.username.x, config.username.y);
        ctx.fillStyle = config.idColor;
        ctx.fillText(data.id || 'N/A', config.userId.x, config.userId.y);
        ctx.fillStyle = config.textColor;
        ctx.fillText(data.kd?.toString() || '0', config.kd.x, config.kd.y);
        ctx.fillText(data.kills?.toString() || '0', config.kills.x, config.kills.y);
        ctx.fillText(data.games?.toString() || '0', config.games.x, config.games.y);

        await interaction.editReply({ files: [new AttachmentBuilder(canvas.toBuffer(), { name: 'card.png' })] });
    } catch (e) {
        console.error(e);
        interaction.editReply('❌ خطأ أثناء التصميم.');
    }
});

bot.login(process.env.DISCORD_TOKEN);
