const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON } = require("../../utils/database");
const { formatTable } = require("../../utils/tables");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("d2table")
        .setDescription("Show the REFL Division 2 table"),

    async execute(interaction) {
        try {
            const teams = readJSON("teams.json", []);

            if (!Array.isArray(teams)) {
                return interaction.reply({
                    content: "❌ The teams database is invalid.",
                    ephemeral: true
                });
            }

            const d2Teams = teams.filter(
                team =>
                    team.league &&
                    team.league.toUpperCase() === "D2"
            );

            if (d2Teams.length === 0) {
                return interaction.reply({
                    content: "❌ There are currently no teams in D2."
                });
            }

            const table = formatTable(d2Teams);

            const embed = new EmbedBuilder()
                .setTitle("🏆 REFL — Division 2")
                .setDescription(table)
                .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("❌ Error in /d2table:");
            console.error(error);

            return interaction.reply({
                content:
                    "❌ Something went wrong while loading the D2 table.",
                ephemeral: true
            });
        }
    }
};
