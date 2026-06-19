import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from "discord.js";

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
const SECRET = process.env.BOT_SECRET;

// ─── Helpers ────────────────────────────────────────────────────────────────

async function botFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SECRET}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) return null;
  return res.json();
}

async function resolveUser(discordUser) {
  return botFetch(`/api/bot/user/discord/${discordUser.id}`);
}

function formatDur(mins) {
  if (!mins) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function notLinked(username) {
  return `**${username}** hasn't connected their game.fm account.\nSign up at ${BASE_URL}`;
}

function embed(title, url) {
  return new EmbedBuilder().setColor(0x7c3aed).setTitle(title).setURL(url);
}

function profileUrl(username) {
  return `${BASE_URL}/users/${username}`;
}

// ─── /fm — now playing or last played (the core Last.fm command) ─────────────

async function handleFm(interaction) {
  const target = interaction.options.getUser("user") ?? interaction.user;
  const data = await resolveUser(target);

  if (!data) return interaction.reply({ content: notLinked(target.username), ephemeral: true });

  const displayName = data.name ?? data.username;

  if (data.nowPlaying) {
    const elapsed = formatDur(Math.round((Date.now() - new Date(data.nowPlaying.startedAt).getTime()) / 60000));
    const e = embed(`▶ ${data.nowPlaying.title}`, `${BASE_URL}/games/${data.nowPlaying.slug}`)
      .setDescription(`**${displayName}** is playing · ${elapsed} into session`)
      .setFooter({ text: `game.fm · ${profileUrl(data.username)}` });
    if (data.nowPlaying.coverUrl) e.setThumbnail(data.nowPlaying.coverUrl);
    return interaction.reply({ embeds: [e] });
  }

  if (data.lastSession) {
    const ago = timeAgo(data.lastSession.startedAt);
    const dur = formatDur(data.lastSession.durationMins);
    const e = embed(data.lastSession.title, `${BASE_URL}/games/${data.lastSession.slug}`)
      .setDescription(`**${displayName}** last played · ${ago} · ${dur}`)
      .setFooter({ text: `game.fm · ${profileUrl(data.username)}` });
    if (data.lastSession.coverUrl) e.setThumbnail(data.lastSession.coverUrl);
    return interaction.reply({ embeds: [e] });
  }

  interaction.reply(`**${displayName}** hasn't played anything yet.`);
}

// ─── /np — alias for /fm ─────────────────────────────────────────────────────

async function handleNp(interaction) {
  return handleFm(interaction);
}

// ─── /recent ────────────────────────────────────────────────────────────────

async function handleRecent(interaction) {
  await interaction.deferReply();
  const target = interaction.options.getUser("user") ?? interaction.user;
  const data = await resolveUser(target);

  if (!data) return interaction.editReply(notLinked(target.username));
  if (!data.sessions?.length) return interaction.editReply(`**${data.name ?? data.username}** hasn't logged any sessions yet.`);

  const lines = data.sessions.map((s) => {
    const dur = s.durationMins ? formatDur(s.durationMins) : "in progress";
    const ago = timeAgo(s.startedAt);
    return `**${s.game.title}** — ${dur} · ${ago}`;
  });

  interaction.editReply({
    embeds: [embed(`${data.name ?? data.username}'s recent sessions`, profileUrl(data.username))
      .setDescription(lines.join("\n"))],
  });
}

// ─── /stats ──────────────────────────────────────────────────────────────────

async function handleStats(interaction) {
  await interaction.deferReply();
  const target = interaction.options.getUser("user") ?? interaction.user;
  const period = interaction.options.getString("period") ?? "alltime";
  const data = await resolveUser(target);

  if (!data) return interaction.editReply(notLinked(target.username));

  // For period-filtered stats, get top games in that period
  const top = await botFetch(`/api/bot/user/discord/${target.id}/top?period=${period}`);
  const periodHours = Math.floor((top?.reduce((sum, g) => sum + g.totalMins, 0) ?? 0) / 60);

  const nowPlayingText = data.nowPlaying
    ? `▶ ${data.nowPlaying.title} (${formatDur(Math.round((Date.now() - new Date(data.nowPlaying.startedAt).getTime()) / 60000))})`
    : data.lastSession
    ? `${data.lastSession.title} · ${timeAgo(data.lastSession.startedAt)}`
    : "Nothing";

  const hoursValue = period === "alltime"
    ? String(data.totalHours ?? 0)
    : `${periodHours} (${PERIOD_LABEL[period]})`;

  interaction.editReply({
    embeds: [embed(`${data.name ?? data.username}'s stats · ${PERIOD_LABEL[period]}`, profileUrl(data.username))
      .addFields(
        { name: "Games logged", value: String(data.gamesLogged ?? 0), inline: true },
        { name: "Hours played", value: hoursValue, inline: true },
        { name: "Last played", value: nowPlayingText, inline: false }
      )],
  });
}

const PERIOD_LABEL = { week: "this week", month: "this month", year: "this year", alltime: "all time" };

// ─── /top ────────────────────────────────────────────────────────────────────

async function handleTop(interaction) {
  await interaction.deferReply();
  const target = interaction.options.getUser("user") ?? interaction.user;
  const period = interaction.options.getString("period") ?? "alltime";
  const data = await resolveUser(target);
  if (!data) return interaction.editReply(notLinked(target.username));

  const top = await botFetch(`/api/bot/user/discord/${target.id}/top?period=${period}`);
  if (!top?.length) return interaction.editReply(`**${data.name ?? data.username}** hasn't logged any playtime ${PERIOD_LABEL[period]}.`);

  const lines = top.map((g, i) =>
    `**${i + 1}.** ${g.title} — ${formatDur(g.totalMins)} · ${g.sessions} session${g.sessions !== 1 ? "s" : ""}`
  );

  interaction.editReply({
    embeds: [embed(`${data.name ?? data.username}'s top games · ${PERIOD_LABEL[period]}`, profileUrl(data.username))
      .setDescription(lines.join("\n"))],
  });
}

// ─── /backlog ────────────────────────────────────────────────────────────────

async function handleBacklog(interaction) {
  await interaction.deferReply();
  const target = interaction.options.getUser("user") ?? interaction.user;
  const data = await resolveUser(target);
  if (!data) return interaction.editReply(notLinked(target.username));

  const backlog = await botFetch(`/api/bot/user/discord/${target.id}/backlog`);
  if (!backlog?.length) return interaction.editReply(`**${data.name ?? data.username}**'s backlog is empty.`);

  interaction.editReply({
    embeds: [embed(`${data.name ?? data.username}'s backlog`, profileUrl(data.username))
      .setDescription(backlog.map((l) => `• ${l.game.title}`).join("\n"))],
  });
}

// ─── /whoknows ───────────────────────────────────────────────────────────────

async function handleWhoKnows(interaction) {
  await interaction.deferReply();
  const gameName = interaction.options.getString("game");

  const members = await interaction.guild.members.fetch().catch(() => null);
  if (!members) return interaction.editReply("Couldn't fetch server members.");

  const discordIds = members.filter((m) => !m.user.bot).map((m) => m.user.id);

  const result = await botFetch(`/api/bot/whoknows`, {
    method: "POST",
    body: JSON.stringify({ gameName, discordIds }),
  });

  if (!result) return interaction.editReply("Something went wrong.");
  if (!result.game) return interaction.editReply(`No game found matching **${gameName}**.`);
  if (!result.players?.length) return interaction.editReply(`Nobody in this server has played **${result.game.title}** yet.`);

  const lines = result.players.map((p, i) =>
    `**${i + 1}.** ${p.name} — ${formatDur(p.totalMins)}`
  );

  interaction.editReply({
    embeds: [embed(`Who knows ${result.game.title}?`, `${BASE_URL}/games/${result.game.slug}`)
      .setDescription(lines.join("\n"))
      .setFooter({ text: `${result.players.length} player${result.players.length !== 1 ? "s" : ""} in this server` })],
  });
}

// ─── /globalwhoknows ─────────────────────────────────────────────────────────

async function handleGlobalWhoKnows(interaction) {
  await interaction.deferReply();
  const gameName = interaction.options.getString("game");

  // Collect Discord IDs from ALL guilds the bot is in
  const discordIds = [];
  for (const guild of interaction.client.guilds.cache.values()) {
    const members = await guild.members.fetch().catch(() => null);
    if (members) {
      members.filter((m) => !m.user.bot).forEach((m) => {
        if (!discordIds.includes(m.user.id)) discordIds.push(m.user.id);
      });
    }
  }

  const result = await botFetch(`/api/bot/whoknows`, {
    method: "POST",
    body: JSON.stringify({ gameName, discordIds }),
  });

  if (!result) return interaction.editReply("Something went wrong.");
  if (!result.game) return interaction.editReply(`No game found matching **${gameName}**.`);
  if (!result.players?.length) return interaction.editReply(`Nobody on game.fm has played **${result.game.title}** yet.`);

  const lines = result.players.map((p, i) =>
    `**${i + 1}.** ${p.name} — ${formatDur(p.totalMins)}`
  );

  interaction.editReply({
    embeds: [embed(`[Global] Who knows ${result.game.title}?`, `${BASE_URL}/games/${result.game.slug}`)
      .setDescription(lines.join("\n"))
      .setFooter({ text: `${result.players.length} player${result.players.length !== 1 ? "s" : ""} across all servers` })],
  });
}

// ─── /compare ────────────────────────────────────────────────────────────────

async function handleCompare(interaction) {
  await interaction.deferReply();
  const target = interaction.options.getUser("user");
  const self = interaction.user;

  if (target.id === self.id) return interaction.editReply("You can't compare yourself to yourself.");

  const result = await botFetch(`/api/bot/compare`, {
    method: "POST",
    body: JSON.stringify({ discordId1: self.id, discordId2: target.id }),
  });

  if (!result || result.error) return interaction.editReply("One or both users haven't connected their game.fm account.");

  const compat = result.sharedCount === 0 ? "0%" :
    `${Math.round((result.sharedCount / Math.min(result.totalGames1, result.totalGames2)) * 100)}%`;

  const sharedLines = result.shared.map((g) =>
    `• **${g.title}** — you: ${formatDur(g.mins1)} · them: ${formatDur(g.mins2)}`
  );

  interaction.editReply({
    embeds: [embed(`${result.user1.name} vs ${result.user2.name}`, profileUrl(result.user1.username))
      .addFields(
        { name: "Compatibility", value: compat, inline: true },
        { name: "Games in common", value: String(result.sharedCount), inline: true },
      )
      .addFields(
        result.shared.length
          ? { name: "Top shared games", value: sharedLines.join("\n") }
          : { name: "Shared games", value: "None yet — play some games together!" }
      )],
  });
}

// ─── /streak ─────────────────────────────────────────────────────────────────

async function handleStreak(interaction) {
  await interaction.deferReply();
  const target = interaction.options.getUser("user") ?? interaction.user;
  const data = await resolveUser(target);
  if (!data) return interaction.editReply(notLinked(target.username));

  const streak = await botFetch(`/api/bot/user/discord/${target.id}/streak`);
  if (!streak) return interaction.editReply("Couldn't fetch streak data.");

  const currentStr = streak.current > 0
    ? `🔥 **${streak.current}** day${streak.current !== 1 ? "s" : ""}`
    : "No active streak";

  interaction.editReply({
    embeds: [embed(`${data.name ?? data.username}'s streak`, profileUrl(data.username))
      .addFields(
        { name: "Current streak", value: currentStr, inline: true },
        { name: "Best streak", value: `${streak.best} day${streak.best !== 1 ? "s" : ""}`, inline: true },
        { name: "Last played", value: streak.lastGame ?? "Nothing", inline: false }
      )],
  });
}

// ─── /chart ─────────────────────────────────────────────────────────────────

async function handleChart(interaction) {
  await interaction.deferReply();
  const target = interaction.options.getUser("user") ?? interaction.user;
  const period = interaction.options.getString("period") ?? "alltime";
  const size = interaction.options.getString("size") ?? "3x3";

  const data = await resolveUser(target);
  if (!data) return interaction.editReply(notLinked(target.username));

  // Fetch chart image from the web API
  const res = await fetch(
    `${BASE_URL}/api/bot/chart?discordId=${target.id}&period=${period}&size=${size}`,
    {
      headers: {
        Authorization: `Bearer ${SECRET}`,
      },
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    if (errText.includes("No data")) {
      return interaction.editReply(`**${data.name ?? data.username}** hasn't logged any playtime ${PERIOD_LABEL[period] ?? "yet"}.`);
    }
    return interaction.editReply("Couldn't generate chart — try again later.");
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const attachment = new AttachmentBuilder(buffer, { name: "chart.png" });

  interaction.editReply({ files: [attachment] });
}

// ─── /register ──────────────────────────────────────────────────────────────

async function handleRegister(interaction) {
  const data = await resolveUser(interaction.user);
  if (data) {
    return interaction.reply({
      content: `You're already signed up! View your profile: ${profileUrl(data.username)}`,
      ephemeral: true,
    });
  }

  interaction.reply({
    embeds: [embed("Join game.fm", BASE_URL)
      .setDescription(
        `Track the games you play, write reviews, and see what your friends are playing.\n\n` +
        `**[Sign up with Discord](${BASE_URL}/api/auth/signin)** to get started.`
      )
      .setFooter({ text: "game.fm — like Last.fm, but for games" })],
  });
}

// ─── /profile ────────────────────────────────────────────────────────────────

async function handleProfile(interaction) {
  const target = interaction.options.getUser("user") ?? interaction.user;
  const data = await resolveUser(target);
  if (!data) return interaction.reply({ content: notLinked(target.username), ephemeral: true });
  interaction.reply(`**${data.name ?? data.username}** on game.fm: ${profileUrl(data.username)}`);
}

// ─── Command definitions ─────────────────────────────────────────────────────

export const commands = [
  new SlashCommandBuilder()
    .setName("fm")
    .setDescription("Show what you or someone else is playing right now")
    .addUserOption((o) => o.setName("user").setDescription("Discord user (defaults to you)")),
  new SlashCommandBuilder()
    .setName("np")
    .setDescription("Now playing — alias for /fm")
    .addUserOption((o) => o.setName("user").setDescription("Discord user (defaults to you)")),
  new SlashCommandBuilder()
    .setName("recent")
    .setDescription("Show recent play sessions")
    .addUserOption((o) => o.setName("user").setDescription("Discord user (defaults to you)")),
  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show game.fm stats")
    .addStringOption((o) =>
      o.setName("period").setDescription("Time period").addChoices(
        { name: "This week", value: "week" },
        { name: "This month", value: "month" },
        { name: "This year", value: "year" },
        { name: "All time (default)", value: "alltime" }
      ))
    .addUserOption((o) => o.setName("user").setDescription("Discord user (defaults to you)")),
  new SlashCommandBuilder()
    .setName("top")
    .setDescription("Show top games by playtime")
    .addStringOption((o) =>
      o.setName("period").setDescription("Time period").addChoices(
        { name: "This week", value: "week" },
        { name: "This month", value: "month" },
        { name: "This year", value: "year" },
        { name: "All time (default)", value: "alltime" }
      ))
    .addUserOption((o) => o.setName("user").setDescription("Discord user (defaults to you)")),
  new SlashCommandBuilder()
    .setName("backlog")
    .setDescription("Show a user's backlog")
    .addUserOption((o) => o.setName("user").setDescription("Discord user (defaults to you)")),
  new SlashCommandBuilder()
    .setName("whoknows")
    .setDescription("See who in this server has played a game, ranked by hours")
    .addStringOption((o) => o.setName("game").setDescription("Game name").setRequired(true)),
  new SlashCommandBuilder()
    .setName("globalwhoknows")
    .setDescription("See who across all servers has played a game")
    .addStringOption((o) => o.setName("game").setDescription("Game name").setRequired(true)),
  new SlashCommandBuilder()
    .setName("compare")
    .setDescription("Compare your gaming history with someone else")
    .addUserOption((o) => o.setName("user").setDescription("Who to compare with").setRequired(true)),
  new SlashCommandBuilder()
    .setName("streak")
    .setDescription("Show gaming streak (consecutive days played)")
    .addUserOption((o) => o.setName("user").setDescription("Discord user (defaults to you)")),
  new SlashCommandBuilder()
    .setName("chart")
    .setDescription("Generate a collage of your most played games")
    .addStringOption((o) =>
      o.setName("size").setDescription("Grid size").addChoices(
        { name: "3x3 (default)", value: "3x3" },
        { name: "4x4", value: "4x4" },
        { name: "5x5", value: "5x5" }
      ))
    .addStringOption((o) =>
      o.setName("period").setDescription("Time period").addChoices(
        { name: "This week", value: "week" },
        { name: "This month", value: "month" },
        { name: "This year", value: "year" },
        { name: "All time (default)", value: "alltime" }
      ))
    .addUserOption((o) => o.setName("user").setDescription("Discord user (defaults to you)")),
  new SlashCommandBuilder()
    .setName("register")
    .setDescription("Get a link to sign up for game.fm"),
  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Get a link to a game.fm profile")
    .addUserOption((o) => o.setName("user").setDescription("Discord user (defaults to you)")),
];

export async function handleCommand(interaction) {
  if (!interaction.isChatInputCommand()) return;
  switch (interaction.commandName) {
    case "fm":              return handleFm(interaction);
    case "np":              return handleNp(interaction);
    case "recent":          return handleRecent(interaction);
    case "stats":           return handleStats(interaction);
    case "top":             return handleTop(interaction);
    case "backlog":         return handleBacklog(interaction);
    case "whoknows":        return handleWhoKnows(interaction);
    case "globalwhoknows":  return handleGlobalWhoKnows(interaction);
    case "compare":         return handleCompare(interaction);
    case "streak":          return handleStreak(interaction);
    case "chart":           return handleChart(interaction);
    case "register":        return handleRegister(interaction);
    case "profile":         return handleProfile(interaction);
  }
}
