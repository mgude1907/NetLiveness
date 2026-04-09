using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Windows.Forms;
using System.Windows.Forms.DataVisualization.Charting;
using NetLiveness.Models;

#nullable enable

namespace NetLiveness
{
    public partial class Form1 : Form
    {
        // ===== Portable files =====
        private readonly string _termStorePath = Path.Combine(AppContext.BaseDirectory, "terminals.json");
        private readonly string _sslStorePath = Path.Combine(AppContext.BaseDirectory, "ssl.json");
        private readonly string _invStorePath = Path.Combine(AppContext.BaseDirectory, "inventory.json");
        private readonly string _stockStorePath = Path.Combine(AppContext.BaseDirectory, "stock.json");
        private readonly string _logStorePath = Path.Combine(AppContext.BaseDirectory, "auditlog.json");
        private readonly string _persStorePath = Path.Combine(AppContext.BaseDirectory, "personnel.json");
        private readonly string _modelsPath = Path.Combine(AppContext.BaseDirectory, "models.json");
        private readonly string _settingsPath = Path.Combine(AppContext.BaseDirectory, "settings.json");
        private readonly string _logoPath = Path.Combine(AppContext.BaseDirectory, "logo.png");
        private readonly string _mailSettingsPath = Path.Combine(AppContext.BaseDirectory, "mailsettings.json");

        // ===== SSL thresholds =====
        private const int SSL_RED_DAYS = 30;
        private const int SSL_ORANGE_DAYS = 60;

        // ===== RTT history =====
        private readonly Dictionary<string, Queue<(DateTime t, long ms)>> _rttHistory = new(StringComparer.OrdinalIgnoreCase);
        private const int RTT_HISTORY_SIZE = 60;

        // ===== Mail =====
        private MailSettings _mail = new();

        // ===== Settings =====
        private AppSettings _appSettings = new();
        private static readonly string[] Operators = { "Mustafa Güde", "Operator 2", "Operator 3", "Operator 4", "Operator 5" };
        private string ActorName() => string.IsNullOrWhiteSpace(_appSettings.OperatorName) ? Environment.UserName : _appSettings.OperatorName;

        // ===== Top Bar =====
        private readonly PictureBox _logo = new();
        private readonly Button _btnStartStop = new();
        private readonly NumericUpDown _intervalMs = new();
        private readonly Label _lblStatus = new();
        private readonly Label _lblMode = new();
        private readonly ComboBox _cmbOperator = new();
        private readonly Label _lblSignature = new();

        // ===== Tabs =====
        private readonly TabControl _tabs = new();
        private readonly TabPage _tabDashboard = new("Dashboard");
        private readonly TabPage _tabTerminals = new("Terminaller");
        private readonly TabPage _tabSsl = new("SSL Takip");
        private readonly TabPage _tabInv = new("Envanter");
        private readonly TabPage _tabStock = new("Stok");
        private readonly TabPage _tabLogs = new("Log İzleme");
        private readonly TabPage _tabPersonels = new("Personeller");
        private readonly TabPage _tabSettings = new("Ayarlar");

        // ===== State =====
        private bool _running = false;
        private int _tickInProgress = 0;
        private readonly System.Windows.Forms.Timer _timer = new();

        private List<Terminal> _terminals = new();
        private List<GridRow> _termRows = new();
        private readonly Dictionary<string, bool> _collapsedByCompany = new(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, bool> _collapsedByDepartment = new(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, bool> _collapsedByAssignedTo = new(StringComparer.OrdinalIgnoreCase);
        private Terminal? _editingTerminal;
        private bool IsTerminalEditMode => _editingTerminal != null;

        private List<SslItem> _sslItems = new();
        private List<SslRow> _sslRows = new();
        private SslItem? _editingSsl;
        private bool IsSslEditMode => _editingSsl != null;

        private List<InventoryItem> _invItems = new();
        private List<InventoryRow> _invRows = new();
        private InventoryItem? _editingInv;
        private bool IsInvEditMode => _editingInv != null;

        private List<StockItem> _stockItems = new();
        private List<StockRow> _stockRows = new();

        private List<AuditLogEntry> _logs = new();
        private List<AuditLogRow> _logRows = new();

        private List<Personnel> _personnels = new();
        private List<PersonnelRow> _personnelRows = new();
        private Personnel? _editingPersonnel;
        private bool IsPersonnelEditMode => _editingPersonnel != null;

        private Dictionary<string, HashSet<string>> _modelCatalog = new(StringComparer.OrdinalIgnoreCase);
        private bool _modelHooksWired = false;

        // ===== Constants =====
        private static readonly string[] Companies = { "RET OMERLI", "RMK", "RHA", "RSS", "RMT", "CLR", "RET BEYLERBEYI", "KARDELEN", "RUT", "RAT", "RAK", "RCC", "RET", "RET UMRANIYE" };
        private static readonly string[] DeviceTypes = { "Firewall", "Switch", "Router", "AP", "Server", "NAS", "NVR", "Printer", "Kamera", "IP Kamera", "Neat", "Kartlı Geçiş", "Yüz okuma", "Güvenlik PC", "Click Share", "Other" };
        private static readonly string[] InventoryCategories = { "Desktop", "Notebook", "Tablet", "Monitor", "Telefon", "TV", "Yazıcı", "Masaüstü PC", "Projeksiyon", "Tarayıcı", "Klavye/Mouse Set", "Kulaklık", "Webcam", "Diğer" };
        private static readonly string[] StockStatuses = { "Sağlam", "Arızalı", "Serviste", "Hurda" };
        private static readonly string[] InventoryBrands = { "Lenovo", "Dell", "HP", "Apple", "Acer", "ASUS", "MSI", "Samsung", "LG", "Huawei", "Xiaomi", "Microsoft", "Razer", "Toshiba", "Fujitsu", "Sony", "Panasonic", "Gigabyte", "Alienware", "Surface", "Philips", "AOC", "ViewSonic", "BenQ", "ASRock", "Zebra", "Honeywell", "OnePlus", "OPPO", "Vivo", "Realme", "Nokia", "Motorola", "Google", "Nothing", "Arçelik", "Vestel", "Casper", "Monster", "Hikvision", "Dahua", "Other" };

        public Form1()
        {
            InitializeComponent();
            BuildUi();

            LoadMailSettings();
            LoadSettings();
            LoadModels();
            LoadTerminals();
            LoadSslItems();
            LoadInventory();
            LoadStock();
            LoadLogs();
            LoadPersonnel();

            RebuildTermGrid();
            RefreshSslGrid();
            RefreshInvGrid();
            RefreshStockGrid();
            RefreshPersonnelGrid();
            RefreshLogGridFiltered();
            
            LoadModelCatalog();
            UpdateDashboard();
            UpdateTerminalButtons();
            // UpdateInvButtons();
            // UpdateStockButtons();

            _timer.Interval = (int)_intervalMs.Value;
            _timer.Tick += async (_, __) => await RefreshAllAsync();

            FormClosing += (_, __) =>
            {
                _timer.Stop();
                SaveTerminals(); SaveSslItems(); SaveInventory();
                SaveStock(); SaveLogs(); SaveModels(); SaveSettings(); SavePersonnel();
            };
        }
    }
}
