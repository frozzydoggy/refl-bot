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
                .setDescription("Team manager (optional)")
                .setRequired(false)
        )

        .addUserOption(option =>
            option
                .setName("owner")
                .setDescription("Team owner (optional)")
                .setRequired(false)
        )

        .addStringOption(option =>
            option
                .setName("stadium")
                .setDescription("Team stadium (optional)")
                .setRequired(false)
        ),

    async execute(interaction) {

        // Acknowledge Discord immediately
        await interaction.deferReply();

        try {
            // ==============================
            // PERMISSION CHECK
            // ==============================

            const permission = requireAdmin(interaction);

            if (!permission.allowed) {
                return interaction.editReply({
                    content: permission.message
                });
            }

            // ==============================
            // LOAD DATABASE
            // ==============================

            const teams = readData("teams.json", []);

            if (!Array.isArray(teams)) {
                return interaction.editReply({
                    content:
                        "❌ `teams.json` is not formatted correctly. It must start with `[]`."
                });
            }

            // ==============================
            // GET OPTIONS
            // ==============================

            const name = interaction.options.getString("name");
            const league = interaction.options.getString("league");

            const manager =
                interaction.options.getUser("manager");

            const owner =
                interaction.options.getUser("owner");

            const stadium =
                interaction.options.getString("stadium");

            // ==============================
            // CHECK DUPLICATE
            // ==============================

            const existingTeam = teams.find(
                team =>
                    team.name &&
                    team.name.toLowerCase() === name.toLowerCase()
            );

            if (existingTeam) {
                return interaction.editReply({
                    content:
                        `❌ **${name}** already exists in REFL.`
                });
            }

            // ==============================
            // CREATE TEAM
            // ==============================

            const newTeam = {
                id: Date.now().toString(),
                name: name,
                league: league,
                managerId: manager ? manager.id : null,
                ownerId: owner ? owner.id : null,
                stadium: stadium || null
            };

            teams.push(newTeam);

            // ==============================
            // SAVE
            // ==============================

            const saved = writeData(
                "teams.json",
                teams
            );

            if (!saved) {
                return interaction.editReply({
                    content:
                        "❌ I couldn't save the team to `teams.json`."
                });
            }

            // ==============================
            // RESPONSE
            // ==============================

            const embed = new EmbedBuilder()
                .setTitle("⚽ Team Added")
                .setDescription(
                    `**${name}** has been added to REFL.`
                )
                .addFields(
                    {
                        name: "League",
                        value: league,
                        inline: true
                    },
                    {
                        name: "Manager",
                        value: manager
                            ? `<@${manager.id}>`
                            : "Not assigned",
                        inline: true
                    },
                    {
                        name: "Owner",
                        value: owner
                            ? `<@${owner.id}>`
                            : "Not assigned",
                        inline: true
                    },
                    {
                        name: "Stadium",
                        value: stadium || "Not assigned",
                        inline: true
                    }
                )
                .setTimestamp();

            return interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {

            console.error(
                "❌ ERROR IN /addteam:"
            );

            console.error(error);

            // Try to respond instead of leaving
            // Discord with "Interaction failed"

            try {
                return interaction.editReply({
                    content:
                        "❌ Something went wrong while adding the team. Check the Railway logs."
                });
            } catch (replyError) {
                console.error(
                    "❌ Could not send error response:"
                );

                console.error(replyError);
            }
        }
    }
};
