import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
const SECRET = process.env.BOT_SECRET;

async function botFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${SECRET}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function resolveUser(discordUser) {
  return botFetch(`/api/bot/user/discord/${discordUser.id}`);
}

// /recent
async function handleRecent(interaction) {
  await interaction.deferReply();
  const target = interaction.options.getUser("user") ?? interaction.user;
  const data = await resolveUser(target);

  if (!data) {
    return interaction.editReply(`${target.username} hasn't connected their game.fm account.`);
  }

  if (!data.sessions?.length) {
    return interaction.editReply(`**${data.name ?? data.username}** hasn't logged any sessions yet.`);
  }

  const lines = data.sessions.map((s) => {
    const hrs = Math.floor(s.durationMins / 60);
    const mins = s.durationMins % 60;
    const dur = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    const date = new Date(s.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `**${s.game.title}** — ${dur} · ${date}`;
  });

  const embed = new EmbedBuilder()
    .setTitle(`${data.name ?? data.username}'s recent sessions`)
    .setDescription(lines.join("\n"))
    .setColor(0x7c3aed)
    .setURL(`${BASE_URL}/users/${data.username}`);

  interaction.editReply({ embeds: [embed] });
}

// /stats
async function handleStats(interaction) {
  await interaction.deferReply();
  const target = interaction.options.getUser("user") ?? interaction.user;
  const data = await resolveUser(target);

  if (!data) {
    return interaction.editReply(`${target.username} hasn't connected their game.fm account.`);
  }

  const embed = new EmbedBuilder()
    .setTitle(`${data.name ?? data.username}'s stats`)
    .addFields(
      { name: "Games logged", value: String(data.gamesLogged ?? 0), inline: true },
      { name: "Hours played", value: String(data.totalHours ?? 0), inline: true },
      { name: "Now playing", value: data.nowPlaying ?? "Nothing", inline: true }
    )
    .setColor(0x7c3aed)
    .setURL(`${BASE_URL}/users/${data.username}`);

  interaction.editReply({ embeds: [embed] });
}

// /profile
async function handleProfile(interaction) {
  const target = interaction.options.getUser("user") ?? interaction.user;
  const data = await resolveUser(target);

  if (!data) {
    return interaction.reply({ content: `${target.username} hasn't connected their game.fm account.`, ephemeral: true });
  }

  interaction.reply(`**${data.name ?? data.username}** on game.fm: ${BASE_URL}/users/${data.username}`);
}

export const commands = [
  new SlashCommandBuilder()
    .setName("recent")
    .setDescription("Show recently played games")
    .addUserOption((o) => o.setName("user").setDescription("Discord user (defaults to you)")),
  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show game.fm stats")
    .addUserOption((o) => o.setName("user").setDescription("Discord user (defaults to you)")),
  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Get a link to a game.fm profile")
    .addUserOption((o) => o.setName("user").setDescription("Discord user (defaults to you)")),
];

export async function handleCommand(interaction) {
  if (!interaction.isChatInputCommand()) return;
  switch (interaction.commandName) {
    case "recent": return handleRecent(interaction);
    case "stats": return handleStats(interaction);
    case "profile": return handleProfile(interaction);
  }
}
