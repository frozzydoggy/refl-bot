require('dotenv').config();

const fs = require('fs');
const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ==========================================
// REFL CLUBS
// ==========================================

const clubs = [
    'Wolverhampton Wanderers',
    'Reading',
    'Rotherham United',
    'Swindon Town',
    'Bristol City',
    'Bristol Rovers',
    'Walsall',
    'Norwich City'
];

// ==========================================
// FUNDS DATABASE
// ==========================================

let funds = {};

if (fs.existsSync('./funds.json')) {
    try {
        funds = JSON.parse(fs.readFileSync('./funds.json', 'utf8'));
    } catch (error) {
        console.error('Could not read funds.json:', error);
        funds = {};
    }
}

// Give every new club £100,000
for (const club of clubs) {
    if (funds[club] === undefined) {
        funds[club] = 100000;
    }
}

// Save funds
function saveFunds() {
    fs.writeFileSync(
        './funds.json',
        JSON.stringify(funds, null, 2)
    );
}

// Save initial clubs
saveFunds();

// ==========================================
// SLASH COMMANDS
// ==========================================

const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check if REFL Bot is online'),

    new SlashCommandBuilder()
        .setName('funds')
        .setDescription('View or change a club\'s funds')
        .addStringOption(option =>
            option
                .setName('club')
                .setDescription('Select a REFL club')
                .setRequired(true)
                .addChoices(
                    ...clubs.map(club => ({
                        name: club,
                        value: club
                    }))
                )
        )
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Amount to add or remove')
                .setRequired(false)
        )
].map(command => command.toJSON());

// ==========================================
// REGISTER COMMANDS
// ==========================================

const rest = new REST({ version: '10' })
    .setToken(process.env.DISCORD_TOKEN);

// ==========================================
// BOT READY
// ==========================================

client.once('ready', async () => {
    console.log(`REFL Bot is online as ${client.user.tag}`);

    try {
        console.log('Registering slash commands...');

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );

        console.log('Slash commands registered!');
    } catch (error) {
        console.error('Command registration error:', error);
    }
});

// ==========================================
// COMMAND HANDLER
// ==========================================

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    // ======================================
    // PING
    // ======================================

    if (interaction.commandName === 'ping') {

        await interaction.reply(
            '🏓 Pong! REFL Bot is online.'
        );

        return;
    }

    // ======================================
    // FUNDS
    // ======================================

    if (interaction.commandName === 'funds') {

        const club = interaction.options.getString('club');
        const amount = interaction.options.getInteger('amount');

        // Make sure the club exists
        if (!clubs.includes(club)) {

            await interaction.reply({
                content: '❌ That is not a REFL club.',
                ephemeral: true
            });

            return;
        }

        // ==================================
        // VIEW FUNDS
        // ==================================

        if (amount === null) {

            await interaction.reply(
                `💷 **${club}** currently has **£${funds[club].toLocaleString()}**.`
            );

            return;
        }

        // ==================================
        // ADMIN CHECK
        // ==================================

        if (!interaction.member.permissions.has('Administrator')) {

            await interaction.reply({
                content:
                    '❌ You need **Administrator** permission to change club funds.',
                ephemeral: true
            });

            return;
        }

        // ==================================
        // CHANGE FUNDS
        // ==================================

        funds[club] += amount;

        // Don't allow negative balances
        if (funds[club] < 0) {
            funds[club] = 0;
        }

        // Save changes
        saveFunds();

        // ==================================
        // ADD FUNDS
        // ==================================

        if (amount > 0) {

            await interaction.reply(
                `💷 Added **£${amount.toLocaleString()}** to **${club}**.\n` +
                `New balance: **£${funds[club].toLocaleString()}**`
            );

            return;
        }

        // ==================================
        // REMOVE FUNDS
        // ==================================

        if (amount < 0) {

            await interaction.reply(
                `💷 Removed **£${Math.abs(amount).toLocaleString()}** from **${club}**.\n` +
                `New balance: **£${funds[club].toLocaleString()}**`
            );

            return;
        }

    }
});

// ==========================================
// LOGIN
// ==========================================

client.login(process.env.DISCORD_TOKEN);