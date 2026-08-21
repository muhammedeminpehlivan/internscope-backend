using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InternScope.Migrations
{
    /// <inheritdoc />
    public partial class EvaluationAndCity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CityId",
                table: "Internships",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "Cities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cities", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Internships_CityId",
                table: "Internships",
                column: "CityId");

            migrationBuilder.AddForeignKey(
                name: "FK_Internships_Cities_CityId",
                table: "Internships",
                column: "CityId",
                principalTable: "Cities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Internships_Cities_CityId",
                table: "Internships");

            migrationBuilder.DropTable(
                name: "Cities");

            migrationBuilder.DropIndex(
                name: "IX_Internships_CityId",
                table: "Internships");

            migrationBuilder.DropColumn(
                name: "CityId",
                table: "Internships");
        }
    }
}
