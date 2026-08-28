const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON } = require("../../utils/database");
const { formatTable } = require("../../utils/tables");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("d1table")
        .setDescription("Show the REFL Division 1 table"),

    async execute(interaction) {
        try {
            const teams = readJSON("teams.json", []);

            if (!Array.isArray(teams)) {
                return interaction.reply({
                    content: "❌ The teams database is invalid.",
                    ephemeral: true
                });
            }

            const d1Teams = teams.filter(
                team =>
                    team.league &&
                    team.league.toUpperCase() === "D1"
            );

            if (d1Teams.length === 0) {
                return interaction.reply({
                    content: "❌ There are currently no teams in D1."
                });
            }

            const table = formatTable(d1Teams);

            const embed = new EmbedBuilder()
                .setTitle("🏆 REFL — Division 1")
                .setDescription(table)
                .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("❌ Error in /d1table:");
            console.error(error);

            return interaction.reply({
                content:
                    "❌ Something went wrong while loading the D1 table.",
                ephemeral: true
            });
        }
    }
};
