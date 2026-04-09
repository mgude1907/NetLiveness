using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NetLiveness.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOnboardings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // migrationBuilder.AddColumn<string>(
            //     name: "Group",
            //     table: "UserActivityTargets",
            //     type: "TEXT",
            //     nullable: false,
            //     defaultValue: "");

            // migrationBuilder.CreateTable(
            //     name: "Onboardings",
            //     columns: table => new
            //     {
            //         Id = table.Column<int>(type: "INTEGER", nullable: false)
            //             .Annotation("Sqlite:Autoincrement", true),
            //         FirstName = table.Column<string>(type: "TEXT", nullable: false),
            //         LastName = table.Column<string>(type: "TEXT", nullable: false),
            //         Company = table.Column<string>(type: "TEXT", nullable: false),
            //         Manager = table.Column<string>(type: "TEXT", nullable: false),
            //         StartDate = table.Column<DateTime>(type: "TEXT", nullable: false),
            //         HomeAddress = table.Column<string>(type: "TEXT", nullable: false),
            //         MobilePhone = table.Column<string>(type: "TEXT", nullable: false),
            //         Email = table.Column<string>(type: "TEXT", nullable: false),
            //         Status = table.Column<string>(type: "TEXT", nullable: false),
            //         CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
            //     },
            //     constraints: table =>
            //     {
            //         table.PrimaryKey("PK_Onboardings", x => x.Id);
            //     });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Onboardings");

            migrationBuilder.DropColumn(
                name: "Group",
                table: "UserActivityTargets");
        }
    }
}
