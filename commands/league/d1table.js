const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON } = require("../../utils/database");
const { formatTable } = require("../../utils/tables");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("d1table")
        .setDescription("Show the REFL D1 table"),

    async execute(interaction) {
        try {
            const teams = readJSON("teams.json", []);
            if (!Array.isArray(teams)) {
                return interaction.reply({ content: "❌ The teams database is invalid.", ephemeral: true });
            }

            const leagueTeams = teams.filter(t =>
                String(t.league || "").toUpperCase() === "D1"
            );

            if (!leagueTeams.length) {
                return interaction.reply({ content: "❌ There are currently no teams in D1." });
            }

            const embed = new EmbedBuilder()
                .setTitle("🏆 REFL — D1")
                .setDescription(formatTable(leagueTeams, "D1"))
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error("❌ /d1table error:", error);
            return interaction.reply({
                content: "❌ Something went wrong while loading the D1 table.",
                ephemeral: true
            });
        }
    }
};
