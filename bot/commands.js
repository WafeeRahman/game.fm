import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { prisma } from "./lib/db.js";

async function getUserByDiscordId(discordId) {
  const account = await prisma.account.findFirst({
    where: { provider: "discord", providerAccountId: discordId },
    select: { userId: true },
  });
  if (!account) return null;
  return prisma.user.findUnique({
    where: { id: account.userId },
    select: { id: true, username: true, name: true, _count: { select: { logs: true } } },
  });
}

// /recent — show what a user recently played
async function handleRecent(interaction) {
  await interaction.deferReply();

  const target = interaction.options.getUser("user") ?? interaction.user;
  const user = await getUserByDiscordId(target.id);

  if (!user) {
    return interaction.editReply("That user hasn't connected their game.fm account yet.");
  }

  const sessions = await prisma.gameSession.findMany({
    where: { userId: user.id, durationMins: { not: null } },
    orderBy: { startedAt: "desc" },
    take: 5,
    include: { game: { select: { title: true, slug: true } } },
  });

  if (sessions.length === 0) {
    return interaction.editReply(`**${user.name ?? user.username}** hasn't logged any sessions yet.`);
  }

  const lines = sessions.map((s) => {
    const hrs = Math.floor(s.durationMins / 60);
    const mins = s.durationMins % 60;
    const dur = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    const date = s.startedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `**${s.game.title}** — ${dur} · ${date}`;
  });

  const embed = new EmbedBuilder()
    .setTitle(`${user.name ?? user.username}'s recent sessions`)
    .setDescription(lines.join("\n"))
    .setColor(0x7c3aed)
    .setURL(`${process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"}/users/${user.username}`);

  interaction.editReply({ embeds: [embed] });
}

// /stats — quick stats for a user
async function handleStats(interaction) {
  await interaction.deferReply();

  const target = interaction.options.getUser("user") ?? interaction.user;
  const user = await getUserByDiscordId(target.id);

  if (!user) {
    return interaction.editReply("That user hasn't connected their game.fm account yet.");
  }

  const [totalMins, logCount, nowPlaying] = await Promise.all([
    prisma.gameSession.aggregate({
      where: { userId: user.id },
      _sum: { durationMins: true },
    }),
    prisma.gameLog.count({ where: { userId: user.id } }),
    prisma.gameSession.findFirst({
      where: { userId: user.id, isNowPlaying: true },
      include: { game: { select: { title: true } } },
    }),
  ]);

  const totalHours = Math.floor((totalMins._sum.durationMins ?? 0) / 60);

  const embed = new EmbedBuilder()
    .setTitle(`${user.name ?? user.username}'s stats`)
    .addFields(
      { name: "Games logged", value: String(logCount), inline: true },
      { name: "Hours played", value: String(totalHours), inline: true },
      { name: "Now playing", value: nowPlaying?.game.title ?? "Nothing", inline: true }
    )
    .setColor(0x7c3aed)
    .setURL(`${process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"}/users/${user.username}`);

  interaction.editReply({ embeds: [embed] });
}

// /profile — link to game.fm profile
async function handleProfile(interaction) {
  const target = interaction.options.getUser("user") ?? interaction.user;
  const user = await getUserByDiscordId(target.id);

  if (!user) {
    return interaction.reply({ content: "That user hasn't connected their game.fm account yet.", ephemeral: true });
  }

  const url = `${process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"}/users/${user.username}`;
  interaction.reply(`**${user.name ?? user.username}** on game.fm: ${url}`);
}

// Command definitions
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
