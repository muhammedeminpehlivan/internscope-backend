using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InternScope.Migrations
{
    /// <inheritdoc />
    public partial class AddSgkVerificationCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SgkVerificationCode",
                table: "Internships",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SgkVerificationCode",
                table: "Internships");
        }
    }
}
