using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NetLiveness.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonnelIntegration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "PersonnelIntegrationLastSync",
                table: "Settings",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PersonnelIntegrationSqlConn",
                table: "Settings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PersonnelIntegrationSqlQuery",
                table: "Settings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PersonnelIntegrationType",
                table: "Settings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Personnels",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResignedAt",
                table: "Personnels",
                type: "TEXT",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "PersonnelIntegrationLastSync", "PersonnelIntegrationSqlConn", "PersonnelIntegrationSqlQuery", "PersonnelIntegrationType" },
                values: new object[] { null, "", "SELECT SicilNo, Ad, Soyad, Bolum, Gorev, KartNo FROM Employees WHERE Active=1", "None" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PersonnelIntegrationLastSync",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "PersonnelIntegrationSqlConn",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "PersonnelIntegrationSqlQuery",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "PersonnelIntegrationType",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Personnels");

            migrationBuilder.DropColumn(
                name: "ResignedAt",
                table: "Personnels");
        }
    }
}
