const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { readData } = require("../../utils/database");
const { createTable } = require("../../utils/tables");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("d2table")
        .setDescription("Show the REFL Division 2 table"),

    async execute(interaction) {
        try {
            const teams = readData("teams.json", []);
            const results = readData("results.json", []);

            const d2Teams = teams.filter(
                team =>
                    team.league &&
                    team.league.toUpperCase() === "D2"
            );

            if (d2Teams.length === 0) {
                return interaction.reply({
                    content: "❌ There are currently no teams in D2."
                });
            }

            const d2Results = results.filter(result => {
                const homeTeam = d2Teams.some(
                    team => team.name === result.homeTeam
                );

                const awayTeam = d2Teams.some(
                    team => team.name === result.awayTeam
                );

                return homeTeam && awayTeam;
            });

            const table = createTable(
                d2Teams,
                d2Results
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
                .setTitle("🏆 REFL — Division 2")
                .setDescription(description)
                .setTimestamp();

            return interaction.reply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("❌ Error in /d2table:");
            console.error(error);

            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({
                    content:
                        "❌ Something went wrong while loading the D2 table.",
                    ephemeral: true
                });
            }

            return interaction.reply({
                content:
                    "❌ Something went wrong while loading the D2 table.",
                ephemeral: true
            });
        }
    }
};
