const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const { readJSON } = require("../../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("checkteaminfo")
        .setDescription("Check information about an REFL team")
        .addStringOption(option =>
            option
                .setName("team")
                .setDescription("The team to check")
                .setRequired(true)
        ),

    async execute(interaction) {
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

        const embed = new EmbedBuilder()
            .setTitle(`${team.name}`)
            .setDescription(team.description || "No team description.")
            .addFields(
                {
                    name: "🏟️ Stadium",
                    value: team.stadium || "Not set",
                    inline: true
                },
                {
                    name: "👤 Manager",
                    value: team.manager || "Not set",
                    inline: true
                },
                {
                    name: "💰 Funds",
                    value: `${team.funds ?? 0}`,
                    inline: true
                }
            )
            .setTimestamp();

        if (team.logo) {
            embed.setThumbnail(team.logo);
        }

        await interaction.reply({
            embeds: [embed]
        });
    }
};
