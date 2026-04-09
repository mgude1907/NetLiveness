using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NetLiveness.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGirisTarih : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "GirisTarih",
                table: "Personnels",
                type: "TEXT",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 1,
                column: "PersonnelIntegrationSqlQuery",
                value: "SELECT PersonelNo, Ad, Soyad, Bolum, Firma, UserID, GirisTarih, CikisTarih FROM [dbo].[Sicil] WHERE Active=1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GirisTarih",
                table: "Personnels");

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 1,
                column: "PersonnelIntegrationSqlQuery",
                value: "SELECT SicilNo, Ad, Soyad, Bolum, Gorev, KartNo FROM Employees WHERE Active=1");
        }
    }
}
