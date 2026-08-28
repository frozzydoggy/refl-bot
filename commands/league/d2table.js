const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON } = require("../../utils/database");
const { formatTable } = require("../../utils/tables");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("d2table")
        .setDescription("Show the REFL D2 table"),

    async execute(interaction) {
        try {
            const teams = readJSON("teams.json", []);
            if (!Array.isArray(teams)) {
                return interaction.reply({ content: "❌ The teams database is invalid.", ephemeral: true });
            }

            const leagueTeams = teams.filter(t =>
                String(t.league || "").toUpperCase() === "D2"
            );

            if (!leagueTeams.length) {
                return interaction.reply({ content: "❌ There are currently no teams in D2." });
            }

            const embed = new EmbedBuilder()
                .setTitle("🏆 REFL — D2")
                .setDescription(formatTable(leagueTeams, "D2"))
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error("❌ /d2table error:", error);
            return interaction.reply({
                content: "❌ Something went wrong while loading the D2 table.",
                ephemeral: true
            });
        }
    }
};
