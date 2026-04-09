using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NetLiveness.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTerminalHealthFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CpuUsage",
                table: "Terminals",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<double>(
                name: "DiskFreeGb",
                table: "Terminals",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "DiskSizeGb",
                table: "Terminals",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "RamUsage",
                table: "Terminals",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            /*
            migrationBuilder.CreateTable(
                name: "Iso9001Requirements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RequirementId = table.Column<string>(type: "TEXT", nullable: false),
                    Family = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    Comments = table.Column<string>(type: "TEXT", nullable: false),
                    DocumentPath = table.Column<string>(type: "TEXT", nullable: true),
                    LastUpdated = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Iso9001Requirements", x => x.Id);
                });
            */
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Iso9001Requirements");

            migrationBuilder.DropColumn(
                name: "CpuUsage",
                table: "Terminals");

            migrationBuilder.DropColumn(
                name: "DiskFreeGb",
                table: "Terminals");

            migrationBuilder.DropColumn(
                name: "DiskSizeGb",
                table: "Terminals");

            migrationBuilder.DropColumn(
                name: "RamUsage",
                table: "Terminals");
        }
    }
}
