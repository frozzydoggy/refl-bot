const {
    SlashCommandBuilder
} = require("discord.js");

const { readJSON, writeJSON } = require("../../utils/database");
const { requireAdmin } = require("../../utils/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("editteaminfo")
        .setDescription("Edit information about an REFL team")
        .addStringOption(option =>
            option
                .setName("team")
                .setDescription("The team to edit")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("description")
                .setDescription("Team description")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("stadium")
                .setDescription("Team stadium")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("manager")
                .setDescription("Team manager")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("logo")
                .setDescription("Team logo URL")
                .setRequired(false)
        ),

    async execute(interaction) {
        if (!requireAdmin(interaction)) {
            return interaction.reply({
                content: "❌ You need Administrator permissions to use this command.",
                ephemeral: true
            });
        }

        const teamName = interaction.options.getString("team");

        const teams = readJSON("teams.json", []);

        const team = teams.find(
            t => t.name.toLowerCase() === teamName.toLowerCase()
        );

        if (!team) {
            return interaction.reply({
                content: `❌ Team **${teamName}** was not found.`,
                ephemeral: true
            });
        }

        const description =
            interaction.options.getString("description");

        const stadium =
            interaction.options.getString("stadium");

        const manager =
            interaction.options.getString("manager");

        const logo =
            interaction.options.getString("logo");

        if (description !== null) {
            team.description = description;
        }

        if (stadium !== null) {
            team.stadium = stadium;
        }

        if (manager !== null) {
            team.manager = manager;
        }

        if (logo !== null) {
            team.logo = logo;
        }

        writeJSON("teams.json", teams);

        await interaction.reply(
            `✅ **${team.name}** has been updated.`
        );
    }
};
