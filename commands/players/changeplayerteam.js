const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readData, writeData } = require("../../utils/database");
const { requireAdmin } = require("../../utils/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("changeplayerteam")
        .setDescription("Change a player's REFL team")
        .addStringOption(option =>
            option
                .setName("player")
                .setDescription("Player name")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("team")
                .setDescription("New team")
                .setRequired(true)
        ),

    async execute(interaction) {
        const permission = requireAdmin(interaction);

        if (!permission.allowed) {
            return interaction.reply({
                content: permission.message,
                ephemeral: true
            });
        }

        const players = readData("players.json", []);

        const playerName = interaction.options.getString("player");
        const newTeam = interaction.options.getString("team");

        const player = players.find(
            p => p.name.toLowerCase() === playerName.toLowerCase()
        );

        if (!player) {
            return interaction.reply({
                content: `❌ Player **${playerName}** was not found.`,
                ephemeral: true
            });
        }

        const oldTeam = player.team || "No team";

        player.team = newTeam;

        const saved = writeData("players.json", players);

        if (!saved) {
            return interaction.reply({
                content: "❌ Failed to save the team change.",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("🔄 Player Team Changed")
            .setDescription(`**${player.name}** has changed teams.`)
            .addFields(
                {
                    name: "Previous Team",
                    value: oldTeam,
                    inline: true
                },
                {
                    name: "New Team",
                    value: newTeam,
                    inline: true
                }
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};
