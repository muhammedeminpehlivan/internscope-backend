using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InternScope.Migrations
{
    /// <inheritdoc />
    public partial class EvaluationUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DifficultyLevel",
                table: "InterviewProcesses");

            migrationBuilder.DropColumn(
                name: "DurationDays",
                table: "InterviewProcesses");

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Internships",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "ReturnOfferReceived",
                table: "Internships",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "StipendMax",
                table: "Internships",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StipendMin",
                table: "Internships",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Term",
                table: "Internships",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Internships");

            migrationBuilder.DropColumn(
                name: "ReturnOfferReceived",
                table: "Internships");

            migrationBuilder.DropColumn(
                name: "StipendMax",
                table: "Internships");

            migrationBuilder.DropColumn(
                name: "StipendMin",
                table: "Internships");

            migrationBuilder.DropColumn(
                name: "Term",
                table: "Internships");

            migrationBuilder.AddColumn<int>(
                name: "DifficultyLevel",
                table: "InterviewProcesses",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DurationDays",
                table: "InterviewProcesses",
                type: "integer",
                nullable: true);
        }
    }
}
