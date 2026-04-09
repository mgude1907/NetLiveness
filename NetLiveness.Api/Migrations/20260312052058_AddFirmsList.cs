using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NetLiveness.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFirmsList : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FirmsList",
                table: "Settings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Settings",
                keyColumn: "Id",
                keyValue: 1,
                column: "FirmsList",
                value: "Merkez,Şube-1,RET,RMK,RUT,RSS,RMT,RPT,CLR,KARDELN,RET BEYLERBEYI,RET UMRANIYE,RET OMERLI");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FirmsList",
                table: "Settings");
        }
    }
}
