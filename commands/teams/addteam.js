const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readData, writeData } = require("../../utils/database");
const { requireAdmin } = require("../../utils/permissions");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addteam")
        .setDescription("Add a team to REFL")
        .addStringOption(option =>
            option
                .setName("name")
                .setDescription("Team name")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("league")
                .setDescription("Team's league")
                .setRequired(true)
                .addChoices(
                    { name: "D1", value: "D1" },
                    { name: "D2", value: "D2" }
                )
        )
        .addUserOption(option =>
            option
                .setName("manager")
                .setDescription("Team manager")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("stadium")
                .setDescription("Team stadium")
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

        const teams = readData("teams.json", []);

        const name = interaction.options.getString("name");
        const league = interaction.options.getString("league");
        const manager = interaction.options.getUser("manager");
        const stadium = interaction.options.getString("stadium");

        const existingTeam = teams.find(
            team => team.name.toLowerCase() === name.toLowerCase()
        );

        if (existingTeam) {
            return interaction.reply({
                content: `❌ **${name}** already exists.`,
                ephemeral: true
            });
        }

        const newTeam = {
            id: Date.now().toString(),
            name: name,
            league: league,
            managerId: manager.id,
            stadium: stadium
        };

        teams.push(newTeam);

        const saved = writeData("teams.json", teams);

        if (!saved) {
            return interaction.reply({
                content: "❌ Failed to save the team.",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("⚽ Team Added")
            .setDescription(`**${name}** has been added to REFL.`)
            .addFields(
                {
                    name: "League",
                    value: league,
                    inline: true
                },
                {
                    name: "Manager",
                    value: `<@${manager.id}>`,
                    inline: true
                },
                {
                    name: "Stadium",
                    value: stadium,
                    inline: true
                }
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }
};
