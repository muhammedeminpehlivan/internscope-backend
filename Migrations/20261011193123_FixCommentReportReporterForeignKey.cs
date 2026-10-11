using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InternScope.Migrations
{
    /// <inheritdoc />
    public partial class FixCommentReportReporterForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CommentReports_Users_ReportedById",
                table: "CommentReports");

            migrationBuilder.DropIndex(
                name: "IX_CommentReports_ReportedById",
                table: "CommentReports");

            migrationBuilder.DropColumn(
                name: "ReportedById",
                table: "CommentReports");

            migrationBuilder.CreateIndex(
                name: "IX_CommentReports_ReportedByUserId",
                table: "CommentReports",
                column: "ReportedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_CommentReports_Users_ReportedByUserId",
                table: "CommentReports",
                column: "ReportedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CommentReports_Users_ReportedByUserId",
                table: "CommentReports");

            migrationBuilder.DropIndex(
                name: "IX_CommentReports_ReportedByUserId",
                table: "CommentReports");

            migrationBuilder.AddColumn<Guid>(
                name: "ReportedById",
                table: "CommentReports",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_CommentReports_ReportedById",
                table: "CommentReports",
                column: "ReportedById");

            migrationBuilder.AddForeignKey(
                name: "FK_CommentReports_Users_ReportedById",
                table: "CommentReports",
                column: "ReportedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
