using System;
using System.Collections.Generic;

#nullable enable

namespace NetLiveness.Models
{
    public class UserAccount
    {
        public string Username { get; set; } = "Operator";
    }

    public class Terminal
    {
        public string Name { get; set; } = "";
        public string Host { get; set; } = "";
        public string Company { get; set; } = "";
        public string DeviceType { get; set; } = "";
        public string Status { get; set; } = "UNK";
        public long RttMs { get; set; }
        public DateTime LastCheck { get; set; }
        public bool Maintenance { get; set; }
    }

    public class SslItem
    {
        public string Domain { get; set; } = "";
        public DateTime ExpiryDate { get; set; }
        public int DaysLeft { get; set; }
        public string Status { get; set; } = "UNK";
    }

    public class InventoryItem
    {
        public string Category { get; set; } = "";
        public string Brand { get; set; } = "";
        public string Model { get; set; } = "";
        public string SerialNo { get; set; } = "";
        public string AssignedTo { get; set; } = "";
        public string PcIsmi { get; set; } = "";
        public string EnvanterTuru { get; set; } = "Personel Envanteri";
        public DateTime AssignedAt { get; set; } = DateTime.Now;
    }

    public class StockItem
    {
        public string Category { get; set; } = "";
        public string Brand { get; set; } = "";
        public string Model { get; set; } = "";
        public string SerialNo { get; set; } = "";
        public string Status { get; set; } = "";
        public string PcIsmi { get; set; } = "";
        public string EnvanterTuru { get; set; } = "Personel Envanteri";
        public DateTime AddedAt { get; set; } = DateTime.Now;
    }

    public class AuditLogEntry
    {
        public DateTime Date { get; set; } = DateTime.Now;
        public string Action { get; set; } = "";
        public string Details { get; set; } = "";
        public string Operator { get; set; } = "";
    }

    public class MailSettings
    {
        public string SmtpServer { get; set; } = "smtp.gmail.com";
        public int Port { get; set; } = 587;
        public string User { get; set; } = "";
        public string Pass { get; set; } = "";
        public string To { get; set; } = "";
        public bool EnableSsl { get; set; } = true;
    }

    public class AppSettings
    {
        public string OperatorName { get; set; } = "";
        public string ZimmetTemplatePath { get; set; } = "";
        public string ZimmetOutputFolder { get; set; } = "";
        public string GlpiUrl { get; set; } = "";
        public string GlpiAppToken { get; set; } = "";
        public string GlpiUserToken { get; set; } = "";
        // Email settings
        public string SmtpServer { get; set; } = "smtp.gmail.com";
        public int SmtpPort { get; set; } = 587;
        public string SmtpUser { get; set; } = "";
        public string SmtpPass { get; set; } = "";
        public string SmtpTo { get; set; } = "";
        public bool SmtpEnableSsl { get; set; } = true;
    }

    public class GridRow
    {
        public string CompanyKey { get; set; } = "";
        public bool IsHeader { get; set; }
        public string HeaderText { get; set; } = "";
        public Terminal? Terminal { get; set; }

        public string Company => IsHeader ? HeaderText : Terminal?.Company ?? "";
        public string Name => IsHeader ? "" : Terminal?.Name ?? "";
        public string Host => IsHeader ? "" : Terminal?.Host ?? "";
        public string DeviceType => IsHeader ? "" : Terminal?.DeviceType ?? "";
        public string Status => IsHeader ? "" : Terminal?.Status ?? "";
        public string RttMs => IsHeader ? "" : Terminal?.RttMs.ToString() ?? "";
        public string LastCheck => IsHeader ? "" : Terminal?.LastCheck.ToString("HH:mm:ss") ?? "";
        public string Maintenance => IsHeader ? "" : (Terminal != null && Terminal.Maintenance ? "BAK" : "");
    }

    public class SslRow
    {
        public SslItem Item { get; set; }
        public SslRow(SslItem item) { Item = item; }
        public string Domain => Item.Domain;
        public string ExpiryDate => Item.ExpiryDate.ToShortDateString();
        public string DaysLeft => Item.DaysLeft.ToString();
        public string Status => Item.Status;
    }

    public class InventoryRow
    {
        public bool IsHeader { get; set; }
        public string HeaderText { get; set; } = "";
        public string AssignedToKey { get; set; } = "";

        public InventoryItem? Item { get; set; }
        public InventoryRow() { }
        public InventoryRow(InventoryItem item) { Item = item; }

        public string Category => IsHeader ? HeaderText : Item?.Category ?? "";
        public string Brand => IsHeader ? "" : Item?.Brand ?? "";
        public string Model => IsHeader ? "" : Item?.Model ?? "";
        public string SerialNo => IsHeader ? "" : Item?.SerialNo ?? "";
        public string AssignedTo => IsHeader ? "" : Item?.AssignedTo ?? "";
        public string PcIsmi => IsHeader ? "" : Item?.PcIsmi ?? "";
        public string EnvanterTuru => IsHeader ? "" : Item?.EnvanterTuru ?? "";
    }

    public class StockRow
    {
        public StockItem Item { get; set; }
        public StockRow(StockItem item) { Item = item; }
        public string Category => Item.Category;
        public string Brand => Item.Brand;
        public string Model => Item.Model;
        public string SerialNo => Item.SerialNo;
        public string Status => Item.Status;
        public string AddedAt => Item.AddedAt.ToShortDateString();
        public string PcIsmi => Item.PcIsmi;
        public string EnvanterTuru => Item.EnvanterTuru;
    }

    public class AuditLogRow
    {
        public AuditLogEntry Entry { get; set; }
        public AuditLogRow(AuditLogEntry e) { Entry = e; }
        public string Date => Entry.Date.ToString("yyyy-MM-dd HH:mm:ss");
        public string Operator => Entry.Operator;
        public string Action => Entry.Action;
        public string Details => Entry.Details;
    }
    public class Personnel
    {
        public string Ad { get; set; } = "";
        public string Soyad { get; set; } = "";
        public string Bolum { get; set; } = "";
        public string Gorev { get; set; } = "";
        public string Firma { get; set; } = "";
        public string KartNo { get; set; } = "";
        public string SicilNo { get; set; } = "";
        public string ResimYolu { get; set; } = "";
        public string Dahili { get; set; } = "";
        public string CepTelefonu { get; set; } = "";
        public string Mail { get; set; } = "";
        public string AdSoyad => $"{Ad} {Soyad}".Trim();
    }

    public class PersonnelRow
    {
        public bool IsHeader { get; set; }
        public string HeaderText { get; set; } = "";
        public string BolumKey { get; set; } = "";

        public Personnel? Item { get; set; }
        public PersonnelRow() { }
        public PersonnelRow(Personnel item) { Item = item; }

        public string AdSoyad => IsHeader ? HeaderText : (Item != null ? $"{Item.Ad} {Item.Soyad}".Trim() : "");
        public string Bolum => IsHeader ? "" : Item?.Bolum ?? "";
        public string Gorev => IsHeader ? "" : Item?.Gorev ?? "";
        public string Firma => IsHeader ? "" : Item?.Firma ?? "";
        public string KartNo => IsHeader ? "" : Item?.KartNo ?? "";
        public string SicilNo => IsHeader ? "" : Item?.SicilNo ?? "";
        public string Dahili => IsHeader ? "" : Item?.Dahili ?? "";
        public string CepTelefonu => IsHeader ? "" : Item?.CepTelefonu ?? "";
        public string Mail => IsHeader ? "" : Item?.Mail ?? "";
    }
}
