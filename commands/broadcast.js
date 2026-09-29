const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("broadcast")
    .setDescription("إرسال رسالة خاصة لكل الأعضاء الذين يملكون رتبة معينة")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption((opt) =>
      opt.setName("الرتبة").setDescription("الرتبة التي سيتم إرسال الرسالة لأعضائها").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("الرسالة")
        .setDescription("نص الرسالة (استخدم {name} أو {mention} بحروف إنجليزية بالضبط عشان يتبدل باسم كل شخص)")
        .setRequired(true)
    ),

  async execute(interaction) {
    const role = interaction.options.getRole("الرتبة");
    const message = interaction.options.getString("الرسالة");

    await interaction.deferReply({ ephemeral: true });

    // نتأكد من جلب كل الأعضاء (يتطلب تفعيل Server Members Intent في بوابة المطورين)
    await interaction.guild.members.fetch();
    const members = role.members;

    if (!members || members.size === 0) {
      return interaction.editReply("ما لقيت أي عضو يملك هذي الرتبة.");
    }

    let success = 0;
    let failed = 0;

    for (const member of members.values()) {
      // نستبدل الرموز بالاسم/المنشن الخاص بكل عضو
      // الرموز الإنجليزية هي الأدق (ما تتأثر بمشاكل اتجاه الكتابة أو التصحيح التلقائي)
      const personalizedText = message
        .replaceAll("{name}", member.displayName)
        .replaceAll("{Name}", member.displayName)
        .replaceAll("{NAME}", member.displayName)
        .replaceAll("{mention}", `<@${member.id}>`)
        .replaceAll("{Mention}", `<@${member.id}>`)
        .replaceAll("{MENTION}", `<@${member.id}>`)
        .replaceAll("{الاسم}", member.displayName)
        .replaceAll("{منشن}", `<@${member.id}>`);

      const embed = new EmbedBuilder()
        .setTitle(`رسالة من إدارة السيرفر`)
        .setDescription(personalizedText)
        .setColor("#6A0DAD")
        .setFooter({ text: interaction.guild.name });

      try {
        await member.send({ embeds: [embed] });
        success++;
      } catch (err) {
        failed++;
      }
    }

    await interaction.editReply(
      `تم إرسال الرسالة إلى ${members.size} عضو من رتبة **${role.name}**.\n✅ نجح: ${success}\n❌ فشل (خاص مقفول أو حظر البوت): ${failed}`
    );
  },
};
