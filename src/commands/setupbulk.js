const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupbulk')
        .setDescription('🛠️ إعداد لوحة إصدار البطاقات الجماعية (للإدارة فقط)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const generateButton = new ButtonBuilder()
            .setCustomId('generate_all_cards')
            .setLabel('🚀 إصدار كافة بطاقات 7R الآن')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👑');

        const row = new ActionRowBuilder().addComponents(generateButton);

        const embed = new EmbedBuilder()
            .setColor('#CB041C')
            .setTitle('لوحة تحكم بطاقات الأداء 7R')
            .setDescription('اضغط على الزر أدناه لبدء تصدير بطاقات الأداء المحدثة لكافة اللاعبين في ملف جوجل شيت.');

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};