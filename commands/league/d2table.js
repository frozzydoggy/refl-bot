const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON } = require("../../utils/database");
const { formatTable } = require("../../utils/tables");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("d2table")
        .setDescription("Show the REFL Division 2 table"),

    async execute(interaction) {
        const teams = readJSON("teams.json", []);

        const d2Teams = teams.filter(
            team => team.division === "D2"
        );

        if (d2Teams.length === 0) {
            return interaction.reply({
                content: "❌ There are currently no teams in Division 2.",
                ephemeral: true
            });
        }

        const table = formatTable(d2Teams);

        const embed = new EmbedBuilder()
            .setTitle("🏆 REFL Division 2")
            .setDescription(table)
            .setFooter({
                text: `${d2Teams.length} team${d2Teams.length === 1 ? "" : "s"}`
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};
