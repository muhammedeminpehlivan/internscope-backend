using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InternScope.Migrations
{
    /// <inheritdoc />
    public partial class AddCommentReplies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ParentCommentId",
                table: "InternshipComments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_InternshipComments_ParentCommentId",
                table: "InternshipComments",
                column: "ParentCommentId");

            migrationBuilder.AddForeignKey(
                name: "FK_InternshipComments_InternshipComments_ParentCommentId",
                table: "InternshipComments",
                column: "ParentCommentId",
                principalTable: "InternshipComments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InternshipComments_InternshipComments_ParentCommentId",
                table: "InternshipComments");

            migrationBuilder.DropIndex(
                name: "IX_InternshipComments_ParentCommentId",
                table: "InternshipComments");

            migrationBuilder.DropColumn(
                name: "ParentCommentId",
                table: "InternshipComments");
        }
    }
}
