const { Client, GatewayIntentBits, Collection, AttachmentBuilder, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
require('dotenv').config();

const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(process.env.PORT || 3000);

const { getAllPlayerData } = require('./src/utils/googleSheets');
const bot = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers]
});

// إعدادات الخط
const fontPath = path.join(__dirname, 'src', 'templates', 'BodoniFLF.ttf');
GlobalFonts.registerFromPath(fontPath, 'Bodoni FLF');

// متغيرات من الـ Environment
const OWNER_ID = process.env.OWNER_ID;
const TEAM_ROLE_ID = process.env.TEAM_ROLE_ID;

bot.on(Events.MessageCreate, async message => {
    const hasPermission = message.member.permissions.has(PermissionFlagsBits.Administrator) || message.member.id === OWNER_ID;
    
    if (message.content === '!setup' && hasPermission) {
        const embed = new EmbedBuilder()
            .setTitle('⚔️ ميـدان الشـرف')
            .setDescription('استخدم الأزرار أدناه لعرض بطاقتك أو قائمة الفريق.')
            .setColor('#FF4500');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('get_my_card').setLabel('بطاقتي').setStyle(ButtonStyle.Danger).setEmoji('🔥'),
            new ButtonBuilder().setCustomId('show_roster').setLabel('الروستر').setStyle(ButtonStyle.Secondary).setEmoji('📋')
        );
        
        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete().catch(() => {});
    }
});

bot.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    // --- منطق الروستر ---
    if (interaction.customId === 'show_roster') {
        await interaction.deferReply({ ephemeral: true });
        const role = interaction.guild.roles.cache.get(TEAM_ROLE_ID);
        if (!role) return interaction.editReply('❌ لم يتم العثور على رتبة الفريق.');

        const members = role.members.map(m => `• ${m.user.username}`).join('\n') || 'لا يوجد أعضاء حالياً.';
        const embed = new EmbedBuilder()
            .setTitle(`📋 روستر فريق: ${role.name}`)
            .setDescription(members)
            .setColor(role.hexColor);
        await interaction.editReply({ embeds: [embed] });
    }

    // --- منطق البطاقة ---
    if (interaction.customId === 'get_my_card') {
        await interaction.deferReply({ ephemeral: true });
        const playerDataMap = await getAllPlayerData();
        const data = playerDataMap.get(interaction.user.id);
        if (!data) return interaction.editReply('❌ لم يتم العثور على بياناتك في الشيت.');

        // [أضف هنا كود رسم البطاقة باستخدام rankConfigurations كما اتفقنا سابقاً]
        // تأكد من استخدام data.rank لتحديد الملف الصحيح
        await interaction.editReply('✅ جارٍ رسم بطاقتك...'); 
    }
});

bot.login(process.env.DISCORD_TOKEN);
