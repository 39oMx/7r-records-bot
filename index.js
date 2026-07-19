const { Client, GatewayIntentBits, Collection, AttachmentBuilder, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
require('dotenv').config();

const { getAllPlayerData } = require('./src/utils/googleSheets');
const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });

// إعدادات الخط والصور
GlobalFonts.registerFromPath(path.join(__dirname, 'src', 'templates', 'BodoniFLF.ttf'), 'Bodoni FLF');
const rankConfigurations = { /* ... (نفس الإعدادات السابقة) ... */ };
const TEAM_ROLE_ID = process.env.TEAM_ROLE_ID;

bot.on(Events.MessageCreate, async message => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator) && message.member.id !== process.env.OWNER_ID) return;

    // 1. أمر البطاقات
    if (message.content === '!setupcard') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('get_my_card').setLabel('استخراج بطاقتي').setStyle(ButtonStyle.Danger)
        );
        await message.channel.send({ embeds: [new EmbedBuilder().setTitle('🔥 بطاقات اللاعبين').setDescription('اضغط للبطاقة').setColor('#FF4500')], components: [row] });
        await message.delete();
    }

    // 2. أمر الروستر (رسالة ثابتة)
    if (message.content === '!setuproster') {
        const role = message.guild.roles.cache.get(TEAM_ROLE_ID);
        const members = role ? role.members.map(m => `• ${m.user.username}`).join('\n') : 'لا يوجد أعضاء.';
        await message.channel.send({ embeds: [new EmbedBuilder().setTitle(`📋 ${role?.name || 'الفريق'}`).setDescription(members).setColor(role?.hexColor || '#FFFFFF')] });
        await message.delete();
    }
});

bot.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    // منطق البطاقة
    if (interaction.customId === 'get_my_card') {
        await interaction.deferReply({ ephemeral: true });
        const dataMap = await getAllPlayerData();
        const data = dataMap.get(interaction.user.id);
        
        if (!data) return interaction.editReply('❌ لم يتم العثور على بياناتك.');

        const config = rankConfigurations[data.rank.toLowerCase()] || rankConfigurations.silver;
        const canvas = createCanvas(1200, 1200);
        const ctx = canvas.getContext('2d');
        const bg = await loadImage(path.join(__dirname, 'src', 'templates', config.fileName));
        ctx.drawImage(bg, 0, 0);

        // رسم الأفاتار
        const avatar = await loadImage(interaction.user.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(config.avatar.x, config.avatar.y, config.avatar.r, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, config.avatar.x - config.avatar.r, config.avatar.y - config.avatar.r, config.avatar.r * 2, config.avatar.r * 2);
        ctx.restore();

        // رسم النصوص
        ctx.fillStyle = config.textColor;
        ctx.font = '50px "Bodoni FLF"';
        ctx.fillText(interaction.user.username, config.username.x, config.username.y);
        ctx.fillStyle = config.idColor;
        ctx.fillText(data.id, config.userId.x, config.userId.y);
        ctx.fillStyle = config.textColor;
        ctx.fillText(data.kd.toString(), config.kd.x, config.kd.y);
        ctx.fillText(data.kills.toString(), config.kills.x, config.kills.y);
        ctx.fillText(data.games.toString(), config.games.x, config.games.y);

        await interaction.editReply({ files: [new AttachmentBuilder(canvas.toBuffer(), { name: 'card.png' })] });
    }
});

bot.login(process.env.DISCORD_TOKEN);
