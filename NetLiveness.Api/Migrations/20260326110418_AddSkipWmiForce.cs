using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NetLiveness.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSkipWmiForce : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "SkipWmi",
                table: "Terminals",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppUsers");

            migrationBuilder.DropTable(
                name: "DirectoryEntries");

            migrationBuilder.DropTable(
                name: "Feedbacks");

            migrationBuilder.DropTable(
                name: "SystemUpdates");

            migrationBuilder.DropColumn(
                name: "UserName",
                table: "UserAppActivities");

            migrationBuilder.DropColumn(
                name: "SkipWmi",
                table: "Terminals");

            migrationBuilder.DropColumn(
                name: "AdminEmailTo",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "AppVersion",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "ItEmailTo",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "UpdaterUrl",
                table: "Settings");
        }
    }
}
