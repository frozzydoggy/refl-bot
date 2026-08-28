const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

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

        // Respond immediately
        await interaction.deferReply({ ephemeral: false });

        try {

            // ==========================================
            // ADMIN CHECK
            // ==========================================

            if (
                !interaction.member ||
                !interaction.member.permissions.has("Administrator")
            ) {
                return interaction.editReply({
                    content:
                        "❌ You need Administrator permissions to use this command."
                });
            }

            // ==========================================
            // DATABASE PATH
            // ==========================================

            const filePath = path.join(
                __dirname,
                "../../data/teams.json"
            );

            // ==========================================
            // MAKE SURE DATA FOLDER EXISTS
            // ==========================================

            const dataFolder = path.dirname(filePath);

            if (!fs.existsSync(dataFolder)) {
                fs.mkdirSync(dataFolder, {
                    recursive: true
                });
            }

            // ==========================================
            // CREATE DATABASE IF MISSING
            // ==========================================

            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(
                    filePath,
                    "[]",
                    "utf8"
                );
            }

            // ==========================================
            // READ DATABASE
            // ==========================================

            let teams;

            try {
                const file = fs.readFileSync(
                    filePath,
                    "utf8"
                );

                teams = file.trim()
                    ? JSON.parse(file)
                    : [];
            } catch (error) {

                console.error(
                    "❌ teams.json could not be read:",
                    error
                );

                return interaction.editReply({
                    content:
                        "❌ `teams.json` contains invalid JSON. Make sure it only contains `[]` for now."
                });
            }

            if (!Array.isArray(teams)) {
                return interaction.editReply({
                    content:
                        "❌ `teams.json` must contain an array like `[]`."
                });
            }

            // ==========================================
            // GET OPTIONS
            // ==========================================

            const name =
                interaction.options.getString("name");

            const league =
                interaction.options.getString("league");

            const manager =
                interaction.options.getUser("manager");

            const owner =
                interaction.options.getUser("owner");

            const stadium =
                interaction.options.getString("stadium");

            // ==========================================
            // CHECK DUPLICATE
            // ==========================================

            const existingTeam = teams.find(team =>
                team.name &&
                team.name.toLowerCase() ===
                    name.toLowerCase()
            );

            if (existingTeam) {
                return interaction.editReply({
                    content:
                        `❌ **${name}** already exists.`
                });
            }

            // ==========================================
            // CREATE TEAM
            // ==========================================

            const newTeam = {
                id: Date.now().toString(),
                name: name,
                league: league,
                managerId: manager
                    ? manager.id
                    : null,
                ownerId: owner
                    ? owner.id
                    : null,
                stadium: stadium || null
            };

            // ==========================================
            // ADD TEAM
            // ==========================================

            teams.push(newTeam);

            // ==========================================
            // SAVE DATABASE
            // ==========================================

            fs.writeFileSync(
                filePath,
                JSON.stringify(
                    teams,
                    null,
                    2
                ),
                "utf8"
            );

            console.log(
                `✅ Added team: ${name} (${league})`
            );

            // ==========================================
            // SUCCESS EMBED
            // ==========================================

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
                        value: stadium ||
                            "Not assigned",
                        inline: true
                    }
                )
                .setTimestamp();

            return interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {

            console.error(
                "================================"
            );

            console.error(
                "❌ /addteam ERROR"
            );

            console.error(error);

            console.error(
                "================================"
            );

            return interaction.editReply({
                content:
                    "❌ Something went wrong while adding the team. Check the Railway logs for the exact error."
            });
        }
    }
};
