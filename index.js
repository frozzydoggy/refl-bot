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

// ==========================================
// CONFIGURATION
// ==========================================

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// ==========================================
// CLIENT
// ==========================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

// ==========================================
// COMMAND COLLECTION
// ==========================================

client.commands = new Collection();
const commands = [];

// ==========================================
// LOAD COMMANDS
// ==========================================

const commandsPath = path.join(__dirname, "commands");

function loadCommands(directory) {
    if (!fs.existsSync(directory)) {
        console.error(`❌ Commands folder not found: ${directory}`);
        return;
    }

    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        // Search inside subfolders
        if (stat.isDirectory()) {
            loadCommands(fullPath);
            continue;
        }

        // Only JavaScript files
        if (!file.endsWith(".js")) {
            continue;
        }

        try {
            const command = require(fullPath);

            if (!command.data || !command.execute) {
                console.error(
                    `⚠️ Skipping ${file}: missing "data" or "execute".`
                );
                continue;
            }

            const commandData = command.data.toJSON();

            commands.push(commandData);
            client.commands.set(command.data.name, command);

            console.log(`✅ Loaded command: /${command.data.name}`);
        } catch (error) {
            console.error(`❌ Failed to load ${file}:`);
            console.error(error);
        }
    }
}

// Load all command folders
loadCommands(commandsPath);

// ==========================================
// ENVIRONMENT CHECK
// ==========================================

function checkEnvironment() {
    const missing = [];

    if (!TOKEN) {
        missing.push("TOKEN");
    }

    if (!CLIENT_ID) {
        missing.push("CLIENT_ID");
    }

    if (!GUILD_ID) {
        missing.push("GUILD_ID");
    }

    if (missing.length > 0) {
        console.error("");
        console.error("==========================================");
        console.error("❌ MISSING RAILWAY ENVIRONMENT VARIABLES");
        console.error("==========================================");
        console.error(`Missing: ${missing.join(", ")}`);
        console.error("");
        console.error("Add these variables in Railway:");
        console.error("TOKEN");
        console.error("CLIENT_ID");
        console.error("GUILD_ID");
        console.error("");
        console.error("The bot will stay running safely.");
        console.error("==========================================");
        console.error("");

        return false;
    }

    return true;
}

// ==========================================
// REGISTER SLASH COMMANDS
// ==========================================

async function registerCommands() {
    if (!CLIENT_ID || !GUILD_ID || !TOKEN) {
        console.error(
            "⚠️ Cannot register commands because environment variables are missing."
        );

        return false;
    }

    const rest = new REST({
        version: "10"
    }).setToken(TOKEN);

    try {
        console.log("🔄 Registering REFL slash commands...");

        await rest.put(
            Routes.applicationGuildCommands(
                CLIENT_ID,
                GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log(
            `✅ Registered ${commands.length} slash commands.`
        );

        return true;
    } catch (error) {
        console.error("❌ Failed to register slash commands:");
        console.error(error);

        return false;
    }
}

// ==========================================
// INTERACTION HANDLER
// ==========================================

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const command = client.commands.get(
        interaction.commandName
    );

    if (!command) {
        console.error(
            `❌ Command not found: /${interaction.commandName}`
        );

        try {
            await interaction.reply({
                content: "❌ That command could not be found.",
                ephemeral: true
            });
        } catch (error) {
            console.error("❌ Could not send error message.");
        }

        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(
            `❌ Error while executing /${interaction.commandName}:`
        );

        console.error(error);

        const errorMessage = {
            content:
                "❌ Something went wrong while running this command.",
            ephemeral: true
        };

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        } catch (replyError) {
            console.error(
                "❌ Could not send command error message."
            );
        }
    }
});

// ==========================================
// CLIENT ERRORS
// ==========================================

client.on("error", error => {
    console.error("❌ Discord client error:");
    console.error(error);
});

client.on("warn", warning => {
    console.warn("⚠️ Discord warning:");
    console.warn(warning);
});

// ==========================================
// READY
// ==========================================

client.once("ready", async () => {
    console.log("");
    console.log("==========================================");
    console.log("             REFL BOT ONLINE");
    console.log("==========================================");
    console.log(`🤖 Logged in as: ${client.user.tag}`);
    console.log(`📋 Commands loaded: ${commands.length}`);
    console.log(`🌐 Servers: ${client.guilds.cache.size}`);
    console.log("==========================================");
    console.log("");

    await registerCommands();
});

// ==========================================
// START BOT
// ==========================================

const environmentOK = checkEnvironment();

if (environmentOK) {
    client.login(TOKEN).catch(error => {
        console.error("");
        console.error("❌ DISCORD LOGIN FAILED");
        console.error(error);
        console.error("");
        console.error(
            "Check that your TOKEN in Railway is correct."
        );
    });
} else {
    console.log(
        "⚠️ REFL Bot is waiting for the missing Railway variables."
    );
}

// ==========================================
// PROCESS ERROR PROTECTION
// ==========================================

process.on("unhandledRejection", error => {
    console.error("⚠️ Unhandled promise rejection:");
    console.error(error);
});

process.on("uncaughtException", error => {
    console.error("⚠️ Uncaught exception:");
    console.error(error);
});
