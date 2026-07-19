const { Client, GatewayIntentBits, Collection, AttachmentBuilder, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');
require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => { res.send('🚀 البوت يعمل 24/7'); });
app.listen(port, () => { console.log(`🌍 السيرفر يعمل على المنفذ ${port}`); });

const { getAllPlayerData } = require('./src/utils/googleSheets');

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const fontPath = path.join(__dirname, 'src', 'templates', 'BodoniFLF.ttf');
GlobalFonts.registerFromPath(fontPath, 'Bodoni FLF');

// ... (إعدادات rankConfigurations تبقى كما هي في كودك السابق) ...

bot.commands = new Collection();
const setupBulkCommand = require(path.join(__dirname, 'src', 'commands', 'setupbulk.js'));
bot.commands.set(setupBulkCommand.data.name, setupBulkCommand);

bot.on(Events.MessageCreate, async message => {
    if (message.content === '!setup' && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const embed = new EmbedBuilder()
            .setTitle('⚔️ ميـدان الشـرف')
            .setDescription('اضغط على الزر أدناه لمعرفة مستواك!')
            .setColor('#FF4500')
            .setThumbnail(bot.user.displayAvatarURL()); // تم التصحيح هنا من client إلى bot

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('get_my_card').setLabel('اكشف عن مستواك!').setStyle(ButtonStyle.Danger).setEmoji('🔥'),
            new ButtonBuilder().setCustomId('show_leaderboard').setLabel('لوحة الصدارة').setStyle(ButtonStyle.Secondary).setEmoji('🏆')
        );
        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete();
    }
});

bot.on(Events.InteractionCreate, async interaction => {
    // ... (هنا ضع كود معالجة الأزرار الخاص بك مع التأكد أن أي استدعاء للبوت يستخدم bot) ...
    if (interaction.isButton() && interaction.customId === 'show_leaderboard') {
        // ... (نفس منطقك السابق مع التأكد من استخدام <@${p.id}>) ...
    }
});

bot.once(Events.ClientReady, c => {
    console.log(`🚀 البوت شغال باسم: ${c.user.tag}`);
});

bot.login(process.env.DISCORD_TOKEN);
