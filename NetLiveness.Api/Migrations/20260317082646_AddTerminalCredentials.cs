using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NetLiveness.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTerminalCredentials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Password",
                table: "Terminals",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Username",
                table: "Terminals",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Password",
                table: "Terminals");

            migrationBuilder.DropColumn(
                name: "Username",
                table: "Terminals");
        }
    }
}
