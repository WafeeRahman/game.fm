import "dotenv/config";
import { Client, GatewayIntentBits, REST, Routes, GatewayDispatchEvents } from "discord.js";
import { handlePresenceUpdate } from "./presence.js";
import { commands, handleCommand } from "./commands.js";

// --- Env check ---
const required = ["DISCORD_BOT_TOKEN", "DISCORD_CLIENT_ID", "BOT_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`[bot] Missing required env var: ${key}`);
    process.exit(1);
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
console.log(`[bot] Connecting to game.fm at ${BASE_URL}`);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

async function registerCommands() {
  const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);
  try {
    const route = process.env.DISCORD_GUILD_ID
      ? Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID)
      : Routes.applicationCommands(process.env.DISCORD_CLIENT_ID);
    await rest.put(route, { body: commands.map((c) => c.toJSON()) });
    console.log(`[bot] Slash commands registered ${process.env.DISCORD_GUILD_ID ? "(guild)" : "(global)"}`);
  } catch (err) {
    console.error("[bot] Failed to register commands:", err.message);
  }
}

client.once("clientReady", async () => {
  console.log(`[bot] Logged in as ${client.user.tag}`);
  await client.guilds.fetch();
  console.log(`[bot] Ready — watching ${client.guilds.cache.size} guild(s)`);
  await registerCommands();
});

client.on("presenceUpdate", handlePresenceUpdate);
client.on("interactionCreate", handleCommand);

process.on("SIGINT", () => { client.destroy(); process.exit(0); });
process.on("SIGTERM", () => { client.destroy(); process.exit(0); });

client.login(process.env.DISCORD_BOT_TOKEN);
