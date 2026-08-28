const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON, writeJSON } = require("../../utils/database");
const { requireAdmin } = require("../../utils/permissions");
const { findByName } = require("../../utils/helpers");
const { ensureTeamStats } = require("../../utils/tables");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("result")
        .setDescription("Add an REFL match result")
        .addStringOption(o => o.setName("home").setDescription("Home team").setRequired(true))
        .addStringOption(o => o.setName("away").setDescription("Away team").setRequired(true))
        .addIntegerOption(o => o.setName("homegoals").setDescription("Home goals").setMinValue(0).setRequired(true))
        .addIntegerOption(o => o.setName("awaygoals").setDescription("Away goals").setMinValue(0).setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        if (!requireAdmin(interaction)) {
            return interaction.editReply("❌ You need Administrator permissions.");
        }

        const homeName = interaction.options.getString("home").trim();
        const awayName = interaction.options.getString("away").trim();
        const homeGoals = interaction.options.getInteger("homegoals");
        const awayGoals = interaction.options.getInteger("awaygoals");

        if (homeName.toLowerCase() === awayName.toLowerCase()) {
            return interaction.editReply("❌ A team cannot play itself.");
        }

        const teams = readJSON("teams.json", []);
        const home = findByName(teams, homeName);
        const away = findByName(teams, awayName);

        if (!home) return interaction.editReply(`❌ Home team **${homeName}** was not found.`);
        if (!away) return interaction.editReply(`❌ Away team **${awayName}** was not found.`);

        if (!home.league || !away.league || home.league !== away.league) {
            return interaction.editReply(
                `❌ Both teams must be in the same league.\n**${home.name}:** ${home.league || "Not set"}\n**${away.name}:** ${away.league || "Not set"}`
            );
        }

        const homeStats = ensureTeamStats(home);
        const awayStats = ensureTeamStats(away);

        homeStats.played++;
        awayStats.played++;
        homeStats.goalsFor += homeGoals;
        homeStats.goalsAgainst += awayGoals;
        awayStats.goalsFor += awayGoals;
        awayStats.goalsAgainst += homeGoals;

        if (homeGoals > awayGoals) {
            homeStats.wins++;
            awayStats.losses++;
        } else if (homeGoals < awayGoals) {
            awayStats.wins++;
            homeStats.losses++;
        } else {
            homeStats.draws++;
            awayStats.draws++;
        }

        if (!writeJSON("teams.json", teams)) {
            return interaction.editReply("❌ Failed to save the updated league table.");
        }

        const results = readJSON("results.json", []);
        results.push({
            id: `result_${Date.now()}`,
            league: home.league,
            homeTeamId: home.id,
            homeTeam: home.name,
            awayTeamId: away.id,
            awayTeam: away.name,
            homeGoals,
            awayGoals,
            date: new Date().toISOString(),
            addedBy: interaction.user.id
        });

        if (!writeJSON("results.json", results)) {
            return interaction.editReply("⚠️ The table was updated, but result history could not be saved.");
        }

        const outcome = homeGoals > awayGoals
            ? `🏆 **${home.name} won!**`
            : awayGoals > homeGoals
                ? `🏆 **${away.name} won!**`
                : "🤝 **It's a draw!**";

        const embed = new EmbedBuilder()
            .setTitle("⚽ Result Added")
            .setDescription(`**${home.name} ${homeGoals}–${awayGoals} ${away.name}**`)
            .addFields(
                { name: "League", value: home.league, inline: true },
                { name: "Outcome", value: outcome, inline: true }
            )
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
