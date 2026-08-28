const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readData, writeData } = require("../../utils/database");
const { requireAdmin } = require("../../utils/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addplayer")
        .setDescription("Add a player to REFL")
        .addStringOption(option =>
            option
                .setName("name")
                .setDescription("Player name")
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Discord account of the player")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("team")
                .setDescription("Player's team")
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

        const name = interaction.options.getString("name");
        const user = interaction.options.getUser("user");
        const team = interaction.options.getString("team");

        const existingPlayer = players.find(
            player =>
                player.name.toLowerCase() === name.toLowerCase() ||
                player.discordId === user.id
        );

        if (existingPlayer) {
            return interaction.reply({
                content: "❌ That player already exists.",
                ephemeral: true
            });
        }

        const player = {
            id: Date.now().toString(),
            name: name,
            discordId: user.id,
            team: team,
            stats: {
                goals: 0,
                assists: 0,
                trophies: 0
            }
        };

        players.push(player);

        const saved = writeData("players.json", players);

        if (!saved) {
            return interaction.reply({
                content: "❌ Failed to save the player.",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("⚽ Player Added")
            .setDescription(`**${name}** has been added to REFL.`)
            .addFields(
                {
                    name: "Team",
                    value: team,
                    inline: true
                },
                {
                    name: "Discord",
                    value: `<@${user.id}>`,
                    inline: true
                }
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};
