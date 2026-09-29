require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection, AttachmentBuilder } = require("discord.js");

const { getPanel } = require("./utils/panels");
const { getActiveSession, startSession, endSession } = require("./utils/sessions");
const { generateLogoutImage } = require("./utils/image");
const { formatDuration } = require("./utils/formatDuration");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // لازم تفعّل Server Members Intent في بوابة المطورين
  ],
});

// تحميل الأوامر
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once("ready", () => {
  console.log(`✅ تم تسجيل الدخول باسم ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  // تنفيذ أوامر السلاش
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(err);
      const reply = { content: "صار خطأ أثناء تنفيذ الأمر.", ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
    return;
  }

  // التعامل مع أزرار تسجيل الدخول / الخروج
  if (interaction.isButton()) {
    const [action, type] = interaction.customId.split(":");
    if (action !== "login" && action !== "logout") return;

    const panel = getPanel(type);
    if (!panel) {
      return interaction.reply({ content: "لوحة غير معروفة.", ephemeral: true });
    }

    const userId = interaction.user.id;
    const username = interaction.member?.displayName || interaction.user.username;

    if (action === "login") {
      const started = startSession(type, userId, username);
      if (!started) {
        return interaction.reply({
          content: `⚠️ أنت مسجل دخول بالفعل في لوحة **${panel.label}**.`,
          ephemeral: true,
        });
      }
      return interaction.reply({
        content: `✅ تم تسجيل دخولك في **${panel.label}**.`,
        ephemeral: true,
      });
    }

    if (action === "logout") {
      const active = getActiveSession(type, userId);
      if (!active) {
        return interaction.reply({
          content: `⚠️ ما تقدر تسجل خروج، أنت غير مسجل دخول حاليًا في **${panel.label}**.`,
          ephemeral: true,
        });
      }

      const finished = endSession(type, userId);
      const durationText = formatDuration(finished.durationMs);

      await interaction.reply({
        content: `✅ تم تسجيل خروجك من **${panel.label}**. مدة تسجيل دخولك: ${durationText}`,
        ephemeral: true,
      });

      // توليد صورة السجل وإرسالها لروم السجل
      try {
        const avatarURL = interaction.user.displayAvatarURL({ extension: "png", size: 256 });
        const imageBuffer = await generateLogoutImage({
          username,
          avatarURL,
          duration: durationText,
          panelLabel: panel.label,
        });

        const attachment = new AttachmentBuilder(imageBuffer, { name: "duty-log.png" });
        const logChannel =
          (panel.logChannelId && (await interaction.guild.channels.fetch(panel.logChannelId).catch(() => null))) ||
          interaction.channel;

        if (logChannel) {
          await logChannel.send({ files: [attachment] });
        }
      } catch (err) {
        console.error("خطأ أثناء توليد/إرسال صورة السجل:", err);
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
