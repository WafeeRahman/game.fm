import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";
import { handlePresenceUpdate } from "./presence.js";
import { commands, handleCommand } from "./commands.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,  // privileged — must be enabled in Dev Portal
  ],
});

// Register slash commands on startup
async function registerCommands() {
  const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);
  try {
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands.map((c) => c.toJSON()) }
    );
    console.log("[bot] Slash commands registered");
  } catch (err) {
    console.error("[bot] Failed to register commands:", err.message);
  }
}

client.once("ready", async () => {
  console.log(`[bot] Logged in as ${client.user.tag}`);
  await registerCommands();
});

client.on("presenceUpdate", handlePresenceUpdate);
client.on("interactionCreate", handleCommand);

client.login(process.env.DISCORD_BOT_TOKEN);
