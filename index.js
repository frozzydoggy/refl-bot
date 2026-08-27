require('dotenv').config();

const fs = require('fs');
const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder
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
    'Middlesbrough',
    'Swindon Town',
    'Bristol City',
    'Bristol Rovers',
    'Walsall',
    'Norwich City'
];

// ==========================================
// FUNDS
// ==========================================

let funds = {};

if (fs.existsSync('./funds.json')) {
    try {
        funds = JSON.parse(fs.readFileSync('./funds.json', 'utf8'));
    } catch {
        funds = {};
    }
}

for (const club of clubs) {
    if (funds[club] === undefined) {
        funds[club] = 100000;
    }
}

function saveFunds() {
    fs.writeFileSync(
        './funds.json',
        JSON.stringify(funds, null, 2)
    );
}

saveFunds();

// ==========================================
// RESULTS
// ==========================================

let results = [];

if (fs.existsSync('./results.json')) {
    try {
        results = JSON.parse(
            fs.readFileSync('./results.json', 'utf8')
        );
    } catch {
        results = [];
    }
}

function saveResults() {
    fs.writeFileSync(
        './results.json',
        JSON.stringify(results, null, 2)
    );
}

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
        ),

    new SlashCommandBuilder()
        .setName('result')
        .setDescription('Record a REFL match result')
        .addStringOption(option =>
            option
                .setName('home')
                .setDescription('Home team')
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
                .setName('home_score')
                .setDescription('Home team score')
                .setRequired(true)
                .setMinValue(0)
        )
        .addStringOption(option =>
            option
                .setName('away')
                .setDescription('Away team')
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
                .setName('away_score')
                .setDescription('Away team score')
                .setRequired(true)
                .setMinValue(0)
        ),

    new SlashCommandBuilder()
        .setName('table')
        .setDescription('Show the REFL league table')

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

        if (!clubs.includes(club)) {

            await interaction.reply({
                content: '❌ That is not a REFL club.',
                ephemeral: true
            });

            return;
        }

        // View funds
        if (amount === null) {

            await interaction.reply(
                `💷 **${club}** currently has **£${funds[club].toLocaleString()}**.`
            );

            return;
        }

        // Admin only
        if (!interaction.member.permissions.has('Administrator')) {

            await interaction.reply({
                content:
                    '❌ You need **Administrator** permission to change club funds.',
                ephemeral: true
            });

            return;
        }

        funds[club] += amount;

        if (funds[club] < 0) {
            funds[club] = 0;
        }

        saveFunds();

        if (amount > 0) {

            await interaction.reply(
                `💷 Added **£${amount.toLocaleString()}** to **${club}**.\n` +
                `New balance: **£${funds[club].toLocaleString()}**`
            );

        } else {

            await interaction.reply(
                `💷 Removed **£${Math.abs(amount).toLocaleString()}** from **${club}**.\n` +
                `New balance: **£${funds[club].toLocaleString()}**`
            );
        }

        return;
    }

    // ======================================
    // RESULT
    // ======================================

    if (interaction.commandName === 'result') {

        const home = interaction.options.getString('home');
        const away = interaction.options.getString('away');

        const homeScore =
            interaction.options.getInteger('home_score');

        const awayScore =
            interaction.options.getInteger('away_score');

        if (home === away) {

            await interaction.reply({
                content: '❌ A club cannot play itself.',
                ephemeral: true
            });

            return;
        }

        // Admin only
        if (!interaction.member.permissions.has('Administrator')) {

            await interaction.reply({
                content:
                    '❌ You need **Administrator** permission to record match results.',
                ephemeral: true
            });

            return;
        }

        results.push({
            home,
            away,
            homeScore,
            awayScore,
            timestamp: new Date().toISOString()
        });

        saveResults();

        let resultText;

        if (homeScore > awayScore) {
            resultText = `🏆 **${home} win!**`;
        } else if (awayScore > homeScore) {
            resultText = `🏆 **${away} win!**`;
        } else {
            resultText = `🤝 **It's a draw!**`;
        }

        await interaction.reply(
            `⚽ **REFL Match Result**\n\n` +
            `**${home}** ${homeScore} - ${awayScore} **${away}**\n\n` +
            resultText
        );

        return;
    }

    // ======================================
    // TABLE
    // ======================================

    if (interaction.commandName === 'table') {

        const table = {};

        for (const club of clubs) {

            table[club] = {
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                gf: 0,
                ga: 0,
                gd: 0,
                points: 0
            };
        }

        // Calculate table from results
        for (const result of results) {

            const home = table[result.home];
            const away = table[result.away];

            if (!home || !away) continue;

            home.played++;
            away.played++;

            home.gf += result.homeScore;
            home.ga += result.awayScore;

            away.gf += result.awayScore;
            away.ga += result.homeScore;

            if (result.homeScore > result.awayScore) {

                home.wins++;
                away.losses++;
                home.points += 3;

            } else if (result.homeScore < result.awayScore) {

                away.wins++;
                home.losses++;
                away.points += 3;

            } else {

                home.draws++;
                away.draws++;

                home.points++;
                away.points++;
            }
        }

        // Goal difference
        for (const club of clubs) {

            table[club].gd =
                table[club].gf - table[club].ga;
        }

        // Sort table
        const sorted = [...clubs].sort((a, b) => {

            if (table[b].points !== table[a].points) {
                return table[b].points - table[a].points;
            }

            if (table[b].gd !== table[a].gd) {
                return table[b].gd - table[a].gd;
            }

            return table[b].gf - table[a].gf;
        });

        let text = '';

        sorted.forEach((club, index) => {

            const s = table[club];

            const gd =
                s.gd > 0 ? `+${s.gd}` : `${s.gd}`;

            text +=
                `**${index + 1}. ${club}**\n` +
                `P ${s.played} • W ${s.wins} • D ${s.draws} • L ${s.losses} • ` +
                `GD ${gd} • **${s.points} pts**\n\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle('🏆 REFL League Table')
            .setDescription(text)
            .setFooter({
                text: 'REFL • Official League Table'
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });

        return;
    }
});

// ==========================================
// LOGIN
// ==========================================

client.login(process.env.DISCORD_TOKEN);
