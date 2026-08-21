using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InternScope.Migrations
{
    /// <inheritdoc />
    public partial class AddPendingChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasPendingChanges",
                table: "Internships",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PendingChangesJson",
                table: "Internships",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasPendingChanges",
                table: "Internships");

            migrationBuilder.DropColumn(
                name: "PendingChangesJson",
                table: "Internships");
        }
    }
}
