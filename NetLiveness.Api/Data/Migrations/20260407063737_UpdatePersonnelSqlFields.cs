using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NetLiveness.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePersonnelSqlFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PersonnelIntegrationSqlConn",
                table: "Settings",
                newName: "PersonnelSqlUser");

            migrationBuilder.AddColumn<string>(
                name: "PersonnelSqlAuthType",
                table: "Settings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PersonnelSqlDatabase",
                table: "Settings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PersonnelSqlHost",
                table: "Settings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PersonnelSqlPass",
                table: "Settings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "PersonnelSqlAuthType", "PersonnelSqlDatabase", "PersonnelSqlHost", "PersonnelSqlPass" },
                values: new object[] { "SQL", "", "", "" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PersonnelSqlAuthType",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "PersonnelSqlDatabase",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "PersonnelSqlHost",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "PersonnelSqlPass",
                table: "Settings");

            migrationBuilder.RenameColumn(
                name: "PersonnelSqlUser",
                table: "Settings",
                newName: "PersonnelIntegrationSqlConn");
        }
    }
}
