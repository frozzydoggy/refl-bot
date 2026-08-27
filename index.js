require('dotenv').config();

const fs = require('fs');

const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const {
    TROPHIES,
    addPlayer,
    addPlayerStats,
    getPlayer,
    getAllPlayers,
    removePlayer,
    editPlayerClub
} = require('./commands/players');

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
// FUNDS DATABASE
// ==========================================

let funds = {};

if (fs.existsSync('./funds.json')) {
    try {
        funds = JSON.parse(
            fs.readFileSync('./funds.json', 'utf8')
        );
    } catch (error) {
        console.error('Could not read funds.json:', error);
        funds = {};
    }
}

// Add missing clubs with £100,000
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
// RESULTS DATABASE
// ==========================================

let results = [];

if (fs.existsSync('./results.json')) {
    try {
        results = JSON.parse(
            fs.readFileSync('./results.json', 'utf8')
        );

        if (!Array.isArray(results)) {
            results = [];
        }

    } catch (error) {
        console.error('Could not read results.json:', error);
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
// PERMISSIONS
// ==========================================

function isAdmin(interaction) {
    return interaction.member.permissions.has('Administrator');
}

function isFABoard(interaction) {
    return interaction.member.roles.cache.some(
        role => role.name === 'FA Board'
    );
}

function hasTeamRole(interaction) {
    return interaction.member.roles.cache.some(
        role =>
            role.name === 'Team Owner' ||
            role.name === 'Team Manager'
    );
}

// Funds + table
function canManageClub(interaction) {
    return (
        isAdmin(interaction) ||
        isFABoard(interaction) ||
        hasTeamRole(interaction)
    );
}

// Player management + results
function canManageLeague(interaction) {
    return (
        isAdmin(interaction) ||
        isFABoard(interaction)
    );
}

// ==========================================
// SLASH COMMANDS
// ==========================================

const commands = [

    // ======================================
    // PING
    // ======================================

    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check if REFL Bot is online'),

    // ======================================
    // FUNDS
    // ======================================

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

    // ======================================
    // RESULT
    // ======================================

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

    // ======================================
    // TABLE
    // ======================================

    new SlashCommandBuilder()
        .setName('table')
        .setDescription('Show the REFL league table'),

    // ======================================
    // RESET TABLE
    // ======================================

    new SlashCommandBuilder()
        .setName('resettable')
        .setDescription('Reset the REFL league table'),

    // ======================================
    // ADD PLAYERS
    // ======================================

    new SlashCommandBuilder()
        .setName('addplayers')
        .setDescription('Add a player to the REFL database')

        .addStringOption(option =>
            option
                .setName('username')
                .setDescription('The player username')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('club')
                .setDescription('The player club')
                .setRequired(true)
                .addChoices(
                    ...clubs.map(club => ({
                        name: club,
                        value: club
                    }))
                )
        ),

    // ======================================
    // ADD PLAYER STATS
    // ======================================

    new SlashCommandBuilder()
        .setName('addplayerstats')
        .setDescription('Add goals, assists or trophies to a player')

        .addStringOption(option =>
            option
                .setName('username')
                .setDescription('The player username')
                .setRequired(true)
        )

        .addIntegerOption(option =>
            option
                .setName('goals')
                .setDescription('Goals to add')
                .setRequired(false)
                .setMinValue(0)
        )

        .addIntegerOption(option =>
            option
                .setName('assists')
                .setDescription('Assists to add')
                .setRequired(false)
                .setMinValue(0)
        )

        .addStringOption(option =>
            option
                .setName('trophy')
                .setDescription('Trophy to add')
                .setRequired(false)
                .addChoices(
                    ...TROPHIES.map(trophy => ({
                        name: trophy,
                        value: trophy
                    }))
                )
        ),

    // ======================================
    // CHECK PLAYER STATS
    // ======================================

    new SlashCommandBuilder()
        .setName('checkplayerstats')
        .setDescription('Check a player\'s REFL statistics')

        .addStringOption(option =>
            option
                .setName('username')
                .setDescription('The player username')
                .setRequired(true)
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

    console.log(
        `REFL Bot is online as ${client.user.tag}`
    );

    try {

        console.log('Registering slash commands...');

        await rest.put(
            Routes.applicationCommands(client.user.id),
            {
                body: commands
            }
        );

        console.log('Slash commands registered!');

    } catch (error) {

        console.error(
            'Command registration error:',
            error
        );
    }
});

// ==========================================
// INTERACTIONS
// ==========================================

client.on('interactionCreate', async interaction => {

    // ======================================
    // BUTTONS
    // ======================================

    if (interaction.isButton()) {

        // ----------------------------------
        // CONFIRM RESET
        // ----------------------------------

        if (interaction.customId === 'confirm_reset') {

            if (!isAdmin(interaction)) {

                await interaction.reply({
                    content:
                        '❌ Only **Administrators** can reset the table.',
                    ephemeral: true
                });

                return;
            }

            results = [];

            saveResults();

            await interaction.update({
                content:
                    '✅ **REFL league table has been reset.**\n\n' +
                    'All clubs are back to **0 matches and 0 points**.',
                embeds: [],
                components: []
            });

            return;
        }

        // ----------------------------------
        // CANCEL RESET
        // ----------------------------------

        if (interaction.customId === 'cancel_reset') {

            await interaction.update({
                content:
                    '❌ Table reset cancelled.',
                embeds: [],
                components: []
            });

            return;
        }

        return;
    }

    // ======================================
    // SLASH COMMANDS
    // ======================================

    if (!interaction.isChatInputCommand()) {
        return;
    }

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

        const club =
            interaction.options.getString('club');

        const amount =
            interaction.options.getInteger('amount');

        if (!clubs.includes(club)) {

            await interaction.reply({
                content:
                    '❌ That is not a REFL club.',
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

        // Permission
        if (!canManageClub(interaction)) {

            await interaction.reply({
                content:
                    '❌ You need **Administrator**, **FA Board**, **Team Owner**, or **Team Manager** to change club funds.',
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

        } else if (amount < 0) {

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

        if (!canManageLeague(interaction)) {

            await interaction.reply({
                content:
                    '❌ Only **Administrators** or the **FA Board** can add match results.',
                ephemeral: true
            });

            return;
        }

        const home =
            interaction.options.getString('home');

        const away =
            interaction.options.getString('away');

        const homeScore =
            interaction.options.getInteger('home_score');

        const awayScore =
            interaction.options.getInteger('away_score');

        if (home === away) {

            await interaction.reply({
                content:
                    '❌ A club cannot play itself.',
                ephemeral: true
            });

            return;
        }

        results.push({
            home: home,
            away: away,
            homeScore: homeScore,
            awayScore: awayScore,
            recordedBy: interaction.user.tag,
            timestamp: new Date().toISOString()
        });

        saveResults();

        let resultText;

        if (homeScore > awayScore) {

            resultText =
                `🏆 **${home} win!**`;

        } else if (awayScore > homeScore) {

            resultText =
                `🏆 **${away} win!**`;

        } else {

            resultText =
                `🤝 **It's a draw!**`;
        }

        await interaction.reply(
            `⚽ **REFL Match Result**\n\n` +
            `🔴 **${home}** ${homeScore} - ${awayScore} **${away}** 🔵\n\n` +
            resultText
        );

        return;
    }

    // ======================================
    // TABLE
    // ======================================

    if (interaction.commandName === 'table') {

        if (!canManageClub(interaction)) {

            await interaction.reply({
                content:
                    '❌ You need **Administrator**, **FA Board**, **Team Owner**, or **Team Manager** to view the table.',
                ephemeral: true
            });

            return;
        }

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

        // Calculate standings
        for (const result of results) {

            const home =
                table[result.home];

            const away =
                table[result.away];

            if (!home || !away) {
                continue;
            }

            home.played++;
            away.played++;

            home.gf += result.homeScore;
            home.ga += result.awayScore;

            away.gf += result.awayScore;
            away.ga += result.homeScore;

            if (result.homeScore > result.awayScore) {

                home.wins++;
                home.points += 3;

                away.losses++;

            } else if (result.awayScore > result.homeScore) {

                away.wins++;
                away.points += 3;

                home.losses++;

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
                table[club].gf -
                table[club].ga;
        }

        // Sort
        const sortedClubs =
            [...clubs].sort((a, b) => {

                if (
                    table[b].points !==
                    table[a].points
                ) {
                    return (
                        table[b].points -
                        table[a].points
                    );
                }

                if (
                    table[b].gd !==
                    table[a].gd
                ) {
                    return (
                        table[b].gd -
                        table[a].gd
                    );
                }

                return (
                    table[b].gf -
                    table[a].gf
                );
            });

        let tableText = '';

        sortedClubs.forEach(
            (club, index) => {

                const stats =
                    table[club];

                const gd =
                    stats.gd > 0
                        ? `+${stats.gd}`
                        : `${stats.gd}`;

                tableText +=
                    `**${index + 1}. ${club}**\n` +
                    `P ${stats.played} • ` +
                    `W ${stats.wins} • ` +
                    `D ${stats.draws} • ` +
                    `L ${stats.losses} • ` +
                    `GF ${stats.gf} • ` +
                    `GA ${stats.ga} • ` +
                    `GD ${gd} • ` +
                    `**${stats.points} pts**\n\n`;
            }
        );

        const embed =
            new EmbedBuilder()
                .setTitle('🏆 REFL League Table')
                .setDescription(tableText)
                .setFooter({
                    text:
                        'REFL • Official League Table'
                })
                .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });

        return;
    }

    // ======================================
    // RESET TABLE
    // ======================================

    if (interaction.commandName === 'resettable') {

        if (!isAdmin(interaction)) {

            await interaction.reply({
                content:
                    '❌ Only **Administrators** can reset the table.',
                ephemeral: true
            });

            return;
        }

        const embed =
            new EmbedBuilder()
                .setTitle(
                    '⚠️ Reset REFL League Table?'
                )
                .setDescription(
                    'This will permanently delete **ALL recorded match results**.\n\n' +
                    'Club funds and player statistics will **NOT** be affected.'
                );

        const buttons =
            new ActionRowBuilder()
                .addComponents(

                    new ButtonBuilder()
                        .setCustomId(
                            'confirm_reset'
                        )
                        .setLabel(
                            'Confirm Reset'
                        )
                        .setStyle(
                            ButtonStyle.Danger
                        ),

                    new ButtonBuilder()
                        .setCustomId(
                            'cancel_reset'
                        )
                        .setLabel(
                            'Cancel'
                        )
                        .setStyle(
                            ButtonStyle.Secondary
                        )
                );

        await interaction.reply({
            embeds: [embed],
            components: [buttons]
        });

        return;
    }

    // ======================================
    // ADD PLAYERS
    // ======================================

    if (interaction.commandName === 'addplayers') {

        if (!canManageLeague(interaction)) {

            await interaction.reply({
                content:
                    '❌ Only **Administrators** or the **FA Board** can add players.',
                ephemeral: true
            });

            return;
        }

        const username =
            interaction.options.getString('username');

        const club =
            interaction.options.getString('club');

        const result =
            addPlayer(username, club);

        if (!result.success) {

            await interaction.reply({
                content:
                    `❌ ${result.message}`,
                ephemeral: true
            });

            return;
        }

        await interaction.reply(
            `✅ Added **${username}** to **${club}**.\n\n` +
            `⚽ Goals: **0**\n` +
            `🎯 Assists: **0**\n` +
            `🏆 Trophies: **0**`
        );

        return;
    }

    // ======================================
    // ADD PLAYER STATS
    // ======================================

    if (interaction.commandName === 'addplayerstats') {

        if (!canManageLeague(interaction)) {

            await interaction.reply({
                content:
                    '❌ Only **Administrators** or the **FA Board** can add player stats.',
                ephemeral: true
            });

            return;
        }

        const username =
            interaction.options.getString('username');

        const goals =
            interaction.options.getInteger('goals') || 0;

        const assists =
            interaction.options.getInteger('assists') || 0;

        const trophy =
            interaction.options.getString('trophy');

        if (
            goals === 0 &&
            assists === 0 &&
            !trophy
        ) {

            await interaction.reply({
                content:
                    '❌ You need to add at least one goal, assist, or trophy.',
                ephemeral: true
            });

            return;
        }

        const result =
            addPlayerStats(
                username,
                goals,
                assists,
                trophy
            );

        if (!result.success) {

            await interaction.reply({
                content:
                    `❌ ${result.message}`,
                ephemeral: true
            });

            return;
        }

        const player =
            result.player;

        let message =
            `✅ Updated stats for **${player.username}**.\n\n`;

        if (goals > 0) {

            message +=
                `⚽ Goals: **+${goals}** → **${player.goals}**\n`;
        }

        if (assists > 0) {

            message +=
                `🎯 Assists: **+${assists}** → **${player.assists}**\n`;
        }

        if (trophy) {

            message +=
                `🏆 ${trophy}: **${player.trophies[trophy]}**\n`;
        }

        await interaction.reply(message);

        return;
    }

    // ======================================
    // CHECK PLAYER STATS
    // ======================================

    if (interaction.commandName === 'checkplayerstats') {

        if (!canManageLeague(interaction)) {

            await interaction.reply({
                content:
                    '❌ Only **Administrators** or the **FA Board** can view player stats.',
                ephemeral: true
            });

            return;
        }

        const username =
            interaction.options.getString('username');

        const player =
            getPlayer(username);

        if (!player) {

            await interaction.reply({
                content:
                    `❌ No player named **${username}** exists.`,
                ephemeral: true
            });

            return;
        }

        const embed =
            new EmbedBuilder()

                .setTitle(
                    `👤 ${player.username}`
                )

                .setDescription(
                    `🏟️ **Club:** ${player.club}\n\n` +

                    `⚽ **Goals:** ${player.goals}\n` +
                    `🎯 **Assists:** ${player.assists}\n\n` +

                    `🏆 **Trophies**\n` +
                    `D1: **${player.trophies['D1']}**\n` +
                    `National Cup: **${player.trophies['National Cup']}**\n` +
                    `Pre-Season Cup: **${player.trophies['Pre-Season Cup']}**\n` +
                    `Super Cup: **${player.trophies['Super Cup']}**`
                )

                .setFooter({
                    text:
                        'REFL • Player Statistics'
                });

        await interaction.reply({
            embeds: [embed]
        });

        return;
    }
});

// ==========================================
// ERROR HANDLING
// ==========================================

client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// ==========================================
// LOGIN
// ==========================================

if (!process.env.DISCORD_TOKEN) {

    console.error(
        '❌ DISCORD_TOKEN is missing from environment variables.'
    );

    process.exit(1);
}

client.login(
    process.env.DISCORD_TOKEN
);
