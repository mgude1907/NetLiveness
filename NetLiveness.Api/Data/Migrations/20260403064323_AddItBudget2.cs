using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NetLiveness.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddItBudget2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ItBudgetCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Year = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    OrderIndex = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItBudgetCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ItBudgetItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CategoryId = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Jan = table.Column<decimal>(type: "TEXT", nullable: false),
                    Feb = table.Column<decimal>(type: "TEXT", nullable: false),
                    Mar = table.Column<decimal>(type: "TEXT", nullable: false),
                    Apr = table.Column<decimal>(type: "TEXT", nullable: false),
                    May = table.Column<decimal>(type: "TEXT", nullable: false),
                    Jun = table.Column<decimal>(type: "TEXT", nullable: false),
                    Jul = table.Column<decimal>(type: "TEXT", nullable: false),
                    Aug = table.Column<decimal>(type: "TEXT", nullable: false),
                    Sep = table.Column<decimal>(type: "TEXT", nullable: false),
                    Oct = table.Column<decimal>(type: "TEXT", nullable: false),
                    Nov = table.Column<decimal>(type: "TEXT", nullable: false),
                    Dec = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItBudgetItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItBudgetItems_ItBudgetCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "ItBudgetCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ItBudgetItems_CategoryId",
                table: "ItBudgetItems",
                column: "CategoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ItBudgetItems");

            migrationBuilder.DropTable(
                name: "ItBudgetCategories");
        }
    }
}
