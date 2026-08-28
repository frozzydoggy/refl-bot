const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readData, writeData } = require("../../utils/database");
const { requireAdmin } = require("../../utils/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("editteaminfo")
        .setDescription("Edit REFL team information")
        .addStringOption(option =>
            option
                .setName("team")
                .setDescription("Team to edit")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("name")
                .setDescription("New team name")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("league")
                .setDescription("New league")
                .setRequired(false)
                .addChoices(
                    { name: "D1", value: "D1" },
                    { name: "D2", value: "D2" }
                )
        )
        .addUserOption(option =>
            option
                .setName("manager")
                .setDescription("New manager")
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName("stadium")
                .setDescription("New stadium")
                .setRequired(false)
        ),

    async execute(interaction) {
        const permission = requireAdmin(interaction);

        if (!permission.allowed) {
            return interaction.reply({
                content: permission.message,
                ephemeral: true
            });
        }

        const teams = readData("teams.json", []);

        const teamName = interaction.options.getString("team");

        const team = teams.find(
            t => t.name.toLowerCase() === teamName.toLowerCase()
        );

        if (!team) {
            return interaction.reply({
                content: `❌ **${teamName}** was not found.`,
                ephemeral: true
            });
        }

        const newName = interaction.options.getString("name");
        const newLeague = interaction.options.getString("league");
        const newManager = interaction.options.getUser("manager");
        const newStadium = interaction.options.getString("stadium");

        // Make sure at least one change was provided
        if (!newName && !newLeague && !newManager && !newStadium) {
            return interaction.reply({
                content: "❌ You need to provide something to change.",
                ephemeral: true
            });
        }

        // Prevent duplicate team names
        if (newName) {
            const duplicate = teams.find(
                t =>
                    t.id !== team.id &&
                    t.name.toLowerCase() === newName.toLowerCase()
            );

            if (duplicate) {
                return interaction.reply({
                    content: `❌ **${newName}** already exists.`,
                    ephemeral: true
                });
            }

            team.name = newName;
        }

        if (newLeague) {
            team.league = newLeague;
        }

        if (newManager) {
            team.managerId = newManager.id;
        }

        if (newStadium) {
            team.stadium = newStadium;
        }

        const saved = writeData("teams.json", teams);

        if (!saved) {
            return interaction.reply({
                content: "❌ Failed to save the team changes.",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("🛠️ Team Updated")
            .setDescription(`**${team.name}** has been updated.`)
            .addFields(
                {
                    name: "League",
                    value: team.league || "Not set",
                    inline: true
                },
                {
                    name: "Manager",
                    value: team.managerId
                        ? `<@${team.managerId}>`
                        : "Not set",
                    inline: true
                },
                {
                    name: "Stadium",
                    value: team.stadium || "Not set",
                    inline: true
                }
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};
