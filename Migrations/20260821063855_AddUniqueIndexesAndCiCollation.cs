using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InternScope.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueIndexesAndCiCollation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:CollationDefinition:ci_collation", "und-u-ks-level2,und-u-ks-level2,icu,False");

            migrationBuilder.AlterColumn<string>(
                name: "StudentEmail",
                table: "Users",
                type: "text",
                nullable: true,
                collation: "ci_collation",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Departments",
                type: "text",
                nullable: false,
                collation: "ci_collation",
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Companies",
                type: "text",
                nullable: false,
                collation: "ci_collation",
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateIndex(
                name: "IX_Users_LinkedInId",
                table: "Users",
                column: "LinkedInId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Universities_Name",
                table: "Universities",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Internships_Status_CreatedAt",
                table: "Internships",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Departments_Name",
                table: "Departments",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Companies_Name",
                table: "Companies",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Companies_Slug",
                table: "Companies",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_LinkedInId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Universities_Name",
                table: "Universities");

            migrationBuilder.DropIndex(
                name: "IX_Internships_Status_CreatedAt",
                table: "Internships");

            migrationBuilder.DropIndex(
                name: "IX_Departments_Name",
                table: "Departments");

            migrationBuilder.DropIndex(
                name: "IX_Companies_Name",
                table: "Companies");

            migrationBuilder.DropIndex(
                name: "IX_Companies_Slug",
                table: "Companies");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:CollationDefinition:ci_collation", "und-u-ks-level2,und-u-ks-level2,icu,False");

            migrationBuilder.AlterColumn<string>(
                name: "StudentEmail",
                table: "Users",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true,
                oldCollation: "ci_collation");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Departments",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldCollation: "ci_collation");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Companies",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldCollation: "ci_collation");
        }
    }
}
