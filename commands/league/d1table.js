const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readJSON } = require("../../utils/database");
const { formatTable } = require("../../utils/tables");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("d1table")
        .setDescription("Show the REFL Division 1 table"),

    async execute(interaction) {
        const teams = readJSON("teams.json", []);

        const d1Teams = teams.filter(
            team => team.division === "D1"
        );

        if (d1Teams.length === 0) {
            return interaction.reply({
                content: "❌ There are currently no teams in Division 1.",
                ephemeral: true
            });
        }

        const table = formatTable(d1Teams);

        const embed = new EmbedBuilder()
            .setTitle("🏆 REFL Division 1")
            .setDescription(table)
            .setFooter({
                text: `${d1Teams.length} team${d1Teams.length === 1 ? "" : "s"}`
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
};
