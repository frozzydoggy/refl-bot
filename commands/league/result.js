const { SlashCommandBuilder } = require("discord.js");

const { readJSON, writeJSON } = require("../../utils/database");
const { requireAdmin } = require("../../utils/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("result")
        .setDescription("Add an REFL match result")

        .addStringOption(option =>
            option
                .setName("home")
                .setDescription("Home team")
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName("away")
                .setDescription("Away team")
                .setRequired(true)
        )

        .addIntegerOption(option =>
            option
                .setName("homegoals")
                .setDescription("Home team goals")
                .setRequired(true)
                .setMinValue(0)
        )

        .addIntegerOption(option =>
            option
                .setName("awaygoals")
                .setDescription("Away team goals")
                .setRequired(true)
                .setMinValue(0)
        ),

    async execute(interaction) {
        // Permission check
        if (!requireAdmin(interaction)) {
            return interaction.reply({
                content: "❌ You need Administrator permissions to add a result.",
                ephemeral: true
            });
        }

        const homeName = interaction.options
            .getString("home")
            .trim();

        const awayName = interaction.options
            .getString("away")
            .trim();

        const homeGoals = interaction.options
            .getInteger("homegoals");

        const awayGoals = interaction.options
            .getInteger("awaygoals");

        // Teams cannot play themselves
        if (homeName.toLowerCase() === awayName.toLowerCase()) {
            return interaction.reply({
                content: "❌ A team cannot play against itself.",
                ephemeral: true
            });
        }

        const teams = readJSON("teams.json", []);

        // Find home team
        const homeTeam = teams.find(
            team =>
                team.name.toLowerCase() === homeName.toLowerCase() ||
                team.shortName.toLowerCase() === homeName.toLowerCase()
        );

        // Find away team
        const awayTeam = teams.find(
            team =>
                team.name.toLowerCase() === awayName.toLowerCase() ||
                team.shortName.toLowerCase() === awayName.toLowerCase()
        );

        // Check home team
        if (!homeTeam) {
            return interaction.reply({
                content: `❌ Home team **${homeName}** was not found.`,
                ephemeral: true
            });
        }

        // Check away team
        if (!awayTeam) {
            return interaction.reply({
                content: `❌ Away team **${awayName}** was not found.`,
                ephemeral: true
            });
        }

        // Teams must be in the same division
        if (homeTeam.division !== awayTeam.division) {
            return interaction.reply({
                content:
                    `❌ These teams are in different divisions.\n\n` +
                    `**${homeTeam.name}:** ${homeTeam.division}\n` +
                    `**${awayTeam.name}:** ${awayTeam.division}`,
                ephemeral: true
            });
        }

        // Make sure stats exist
        if (!homeTeam.stats) {
            homeTeam.stats = {
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                points: 0
            };
        }

        if (!awayTeam.stats) {
            awayTeam.stats = {
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                points: 0
            };
        }

        // Update games played
        homeTeam.stats.played++;
        awayTeam.stats.played++;

        // Update goals
        homeTeam.stats.goalsFor += homeGoals;
        homeTeam.stats.goalsAgainst += awayGoals;

        awayTeam.stats.goalsFor += awayGoals;
        awayTeam.stats.goalsAgainst += homeGoals;

        // Determine result
        if (homeGoals > awayGoals) {
            // Home win
            homeTeam.stats.wins++;
            homeTeam.stats.points += 3;

            awayTeam.stats.losses++;
        } else if (homeGoals < awayGoals) {
            // Away win
            awayTeam.stats.wins++;
            awayTeam.stats.points += 3;

            homeTeam.stats.losses++;
        } else {
            // Draw
            homeTeam.stats.draws++;
            awayTeam.stats.draws++;

            homeTeam.stats.points++;
            awayTeam.stats.points++;
        }

        // Save teams
        const teamsSaved = writeJSON("teams.json", teams);

        if (!teamsSaved) {
            return interaction.reply({
                content: "❌ The result could not be saved.",
                ephemeral: true
            });
        }

        // Save match result
        const results = readJSON("results.json", []);

        const result = {
            id: `result_${Date.now()}`,

            division: homeTeam.division,

            homeTeamId: homeTeam.id,
            homeTeam: homeTeam.name,

            awayTeamId: awayTeam.id,
            awayTeam: awayTeam.name,

            homeGoals,
            awayGoals,

            date: new Date().toISOString(),

            addedBy: interaction.user.id
        };

        results.push(result);

        const resultsSaved = writeJSON("results.json", results);

        if (!resultsSaved) {
            return interaction.reply({
                content:
                    "⚠️ The match was added to the league table, " +
                    "but the result history could not be saved.",
                ephemeral: true
            });
        }

        // Result text
        let resultText;

        if (homeGoals > awayGoals) {
            resultText = `🏆 **${homeTeam.name} won!**`;
        } else if (awayGoals > homeGoals) {
            resultText = `🏆 **${awayTeam.name} won!**`;
        } else {
            resultText = "🤝 **It's a draw!**";
        }

        await interaction.reply(
            [
                "✅ **Result added!**",
                "",
                `🏆 **${homeTeam.name} ${homeGoals}–${awayGoals} ${awayTeam.name}**`,
                "",
                resultText,
                `📊 Division: **${homeTeam.division}**`
            ].join("\n")
        );
    }
};
