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

// ==============================
// CLIENT
// ==============================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

// ==============================
// COMMAND COLLECTION
// ==============================

client.commands = new Collection();

const commands = [];

// ==============================
// LOAD COMMANDS
// ==============================

const commandsPath = path.join(__dirname, "commands");

function loadCommands(directory) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        // If it's a folder, search inside it
        if (stat.isDirectory()) {
            loadCommands(fullPath);
            continue;
        }

        // Only load JavaScript files
        if (!file.endsWith(".js")) {
            continue;
        }

        try {
            const command = require(fullPath);

            if (!command.data || !command.execute) {
                console.log(
                    `⚠️ Skipping ${fullPath} - missing data or execute`
                );
                continue;
            }

            const commandData = command.data.toJSON();

            commands.push(commandData);
            client.commands.set(command.data.name, command);

            console.log(`✅ Loaded command: /${command.data.name}`);
        } catch (error) {
            console.error(
                `❌ Failed to load command ${fullPath}:`,
                error
            );
        }
    }
}

loadCommands(commandsPath);

// ==============================
// REGISTER SLASH COMMANDS
// ==============================

async function registerCommands() {
    if (!process.env.TOKEN) {
        console.error("❌ TOKEN is missing from .env");
        return;
    }

    if (!process.env.CLIENT_ID) {
        console.error("❌ CLIENT_ID is missing from .env");
        return;
    }

    if (!process.env.GUILD_ID) {
        console.error("❌ GUILD_ID is missing from .env");
        return;
    }

    const rest = new REST({ version: "10" })
        .setToken(process.env.TOKEN);

    try {
        console.log("🔄 Registering REFL slash commands...");

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log(
            `✅ Registered ${commands.length} slash commands.`
        );
    } catch (error) {
        console.error(
            "❌ Failed to register slash commands:",
            error
        );
    }
}

// ==============================
// INTERACTION HANDLER
// ==============================

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const command = client.commands.get(
        interaction.commandName
    );

    if (!command) {
        console.error(
            `❌ Command not found: ${interaction.commandName}`
        );

        return interaction.reply({
            content: "❌ That command could not be found.",
            ephemeral: true
        });
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(
            `❌ Error executing /${interaction.commandName}:`,
            error
        );

        const errorMessage = {
            content:
                "❌ Something went wrong while running this command.",
            ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

// ==============================
// BOT READY
// ==============================

client.once("ready", async () => {
    console.log("");
    console.log("================================");
    console.log("        REFL BOT ONLINE");
    console.log("================================");
    console.log(`🤖 Logged in as: ${client.user.tag}`);
    console.log(`📋 Commands loaded: ${commands.length}`);
    console.log(`🌐 Servers: ${client.guilds.cache.size}`);
    console.log("================================");
    console.log("");

    await registerCommands();
});

// ==============================
// LOGIN
// ==============================

if (!process.env.TOKEN) {
    console.error("❌ No TOKEN found in .env");
    process.exit(1);
}

client.login(process.env.TOKEN);
