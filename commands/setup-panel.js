const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const { updatePanel, getPanel } = require("../utils/panels");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-panel")
    .setDescription("إرسال لوحة تسجيل الدخول/الخروج (إدارة أو رقابة) إلى روم محدد")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) =>
      opt
        .setName("النوع")
        .setDescription("نوع اللوحة")
        .setRequired(true)
        .addChoices({ name: "الإدارة", value: "admin" }, { name: "الرقابة", value: "oversight" })
    )
    .addChannelOption((opt) =>
      opt
        .setName("روم_اللوحة")
        .setDescription("الروم اللي بينزل فيه زر تسجيل الدخول/الخروج")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption((opt) =>
      opt
        .setName("روم_السجل")
        .setDescription("الروم اللي بترسل فيه صورة تسجيل الخروج (اختياري، الافتراضي نفس روم اللوحة)")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction) {
    const type = interaction.options.getString("النوع");
    const panelChannel = interaction.options.getChannel("روم_اللوحة");
    const logChannel = interaction.options.getChannel("روم_السجل") || panelChannel;

    const panel = getPanel(type);
    if (!panel) {
      return interaction.reply({ content: "نوع لوحة غير معروف.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`لوحة تسجيل الدخول والخروج - ${panel.label}`)
      .setDescription(
        "اضغط **تسجيل دخول** عند بداية مناوبتك، واضغط **تسجيل خروج** عند انتهائها.\n" +
          "لا يمكنك تسجيل الخروج إلا إذا كنت مسجل دخول مسبقًا."
      )
      .setColor(panel.color)
      .setFooter({ text: panel.label });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`login:${type}`)
        .setLabel("تسجيل دخول")
        .setStyle(ButtonStyle.Success)
        .setEmoji("🟢"),
      new ButtonBuilder()
        .setCustomId(`logout:${type}`)
        .setLabel("تسجيل خروج")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🔴")
    );

    const sentMessage = await panelChannel.send({ embeds: [embed], components: [row] });

    updatePanel(type, {
      panelChannelId: panelChannel.id,
      logChannelId: logChannel.id,
      messageId: sentMessage.id,
    });

    await interaction.reply({
      content: `تم إرسال لوحة **${panel.label}** إلى <#${panelChannel.id}>، وسيتم إرسال سجلات تسجيل الخروج إلى <#${logChannel.id}>.`,
      ephemeral: true,
    });
  },
};
