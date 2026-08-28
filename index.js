const {
    Client,
    GatewayIntentBits,
    Collection,
    REST,
    Routes
} = require("discord.js");

const fs = require("fs");
const path = require("path");
require("dotenv").config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();
const commands = [];

function loadCommands(directory) {
    if (!fs.existsSync(directory)) {
        console.error(`❌ Commands folder not found: ${directory}`);
        return;
    }

    for (const file of fs.readdirSync(directory)) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            loadCommands(fullPath);
            continue;
        }

        if (!file.endsWith(".js")) continue;

        try {
            const command = require(fullPath);

            if (!command.data || !command.execute) {
                console.error(`⚠️ Skipped ${fullPath}: missing data/execute.`);
                continue;
            }

            const data = command.data.toJSON();

            if (client.commands.has(data.name)) {
                console.error(`❌ Duplicate command name: /${data.name}`);
                continue;
            }

            client.commands.set(data.name, command);
            commands.push(data);
            console.log(`✅ Loaded command: /${data.name}`);
        } catch (error) {
            console.error(`❌ Failed to load ${fullPath}:`, error);
        }
    }
}

loadCommands(path.join(__dirname, "commands"));

function missingEnvironmentVariables() {
    return ["TOKEN", "CLIENT_ID", "GUILD_ID"]
        .filter(name => !process.env[name]);
}

async function registerCommands() {
    const missing = missingEnvironmentVariables();

    if (missing.length) {
        console.error(`⚠️ Cannot register commands. Missing: ${missing.join(", ")}`);
        return false;
    }

    try {
        const rest = new REST({ version: "10" }).setToken(TOKEN);

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );

        console.log(`✅ Registered ${commands.length} slash commands.`);
        return true;
    } catch (error) {
        console.error("❌ Failed to register slash commands:", error);
        return false;
    }
}

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        return interaction.reply({
            content: "❌ That command is not available.",
            ephemeral: true
        }).catch(() => {});
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`❌ /${interaction.commandName} failed:`, error);

        const response = {
            content: "❌ Something went wrong while running this command.",
            ephemeral: true
        };

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(response);
            } else {
                await interaction.reply(response);
            }
        } catch (replyError) {
            console.error("❌ Could not send error response:", replyError);
        }
    }
});

client.once("ready", async () => {
    console.log("==========================================");
    console.log("             REFL BOT ONLINE");
    console.log("==========================================");
    console.log(`🤖 ${client.user.tag}`);
    console.log(`📋 ${commands.length} commands loaded`);
    console.log(`🌐 ${client.guilds.cache.size} server(s)`);
    console.log("==========================================");

    await registerCommands();
});

client.on("error", error => console.error("❌ Discord client error:", error));
client.on("warn", warning => console.warn("⚠️ Discord warning:", warning));

process.on("unhandledRejection", error =>
    console.error("⚠️ Unhandled promise rejection:", error)
);

process.on("uncaughtException", error =>
    console.error("⚠️ Uncaught exception:", error)
);

const missing = missingEnvironmentVariables();

if (missing.length) {
    console.error(`❌ Missing Railway variables: ${missing.join(", ")}`);
    console.error("⚠️ Bot will remain alive, but cannot log in until they are added.");
} else {
    client.login(TOKEN).catch(error =>
        console.error("❌ Discord login failed:", error)
    );
}
