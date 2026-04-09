using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NetLiveness.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPrivateChatSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatMessages_ChatChannels_ChannelId",
                table: "ChatMessages");

            migrationBuilder.AlterColumn<int>(
                name: "ChannelId",
                table: "ChatMessages",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AddColumn<int>(
                name: "RecipientId",
                table: "ChatMessages",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ChatMessages_ChatChannels_ChannelId",
                table: "ChatMessages",
                column: "ChannelId",
                principalTable: "ChatChannels",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatMessages_ChatChannels_ChannelId",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "RecipientId",
                table: "ChatMessages");

            migrationBuilder.AlterColumn<int>(
                name: "ChannelId",
                table: "ChatMessages",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ChatMessages_ChatChannels_ChannelId",
                table: "ChatMessages",
                column: "ChannelId",
                principalTable: "ChatChannels",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
