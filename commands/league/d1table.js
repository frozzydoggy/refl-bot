const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readData } = require("../../utils/database");
const { createTable } = require("../../utils/tables");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("d1table")
        .setDescription("Show the REFL Division 1 table"),

    async execute(interaction) {
        try {
            const teams = readData("teams.json", []);
            const results = readData("results.json", []);

            const d1Teams = teams.filter(
                team =>
                    team.league &&
                    team.league.toUpperCase() === "D1"
            );

            if (d1Teams.length === 0) {
                return interaction.reply({
                    content: "❌ There are currently no teams in D1."
                });
            }

            const d1Results = results.filter(result => {
                const homeTeam = d1Teams.some(
                    team => team.name === result.homeTeam
                );

                const awayTeam = d1Teams.some(
                    team => team.name === result.awayTeam
                );

                return homeTeam && awayTeam;
            });

            const table = createTable(
                d1Teams,
                d1Results
            );

            let description =
                "**#  Team                 P  W  D  L  GF  GA  GD  Pts**\n";

            description += "```";

            table.forEach((team, index) => {
                const position =
                    String(index + 1).padStart(2, " ");

                const name =
                    team.name.substring(0, 18).padEnd(18, " ");

                const played =
                    String(team.played).padStart(2, " ");

                const wins =
                    String(team.wins).padStart(2, " ");

                const draws =
                    String(team.draws).padStart(2, " ");

                const losses =
                    String(team.losses).padStart(2, " ");

                const gf =
                    String(team.goalsFor).padStart(3, " ");

                const ga =
                    String(team.goalsAgainst).padStart(3, " ");

                const gd =
                    String(team.goalDifference).padStart(3, " ");

                const points =
                    String(team.points).padStart(3, " ");

                description +=
                    `${position} ${name} ${played} ${wins} ${draws} ${losses} ${gf} ${ga} ${gd} ${points}\n`;
            });

            description += "```";

            const embed = new EmbedBuilder()
                .setTitle("🏆 REFL — Division 1")
                .setDescription(description)
                .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("❌ Error in /d1table:");
            console.error(error);

            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({
                    content:
                        "❌ Something went wrong while loading the D1 table.",
                    ephemeral: true
                });
            }

            return interaction.reply({
                content:
                    "❌ Something went wrong while loading the D1 table.",
                ephemeral: true
            });
        }
    }
};
