using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InternScope.Migrations
{
    /// <inheritdoc />
    public partial class AddInternshipStudentYear : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "StudentYear",
                table: "Internships",
                type: "integer",
                nullable: false,
                // Mevcut kayıtlarda sınıf bilgisi yok; geçerli bir değerle (1) dolduruyoruz.
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StudentYear",
                table: "Internships");
        }
    }
}
