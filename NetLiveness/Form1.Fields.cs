using System.Windows.Forms;
using System.Windows.Forms.DataVisualization.Charting;

namespace NetLiveness
{
    public partial class Form1
    {
        // Dashboard
        private readonly TableLayoutPanel _dashGrid = new();
        private readonly Panel _cardTotal = new();
        private readonly Panel _cardUp = new();
        private readonly Panel _cardDown = new();
        private readonly Panel _cardUnk = new();
        private readonly Panel _cardLast = new();
        private readonly Panel _cardAvgRtt = new();
        private readonly Panel _cardTopDownCompany = new();
        private readonly Panel _cardRunning = new();
        private readonly Label _lblTotalVal = new();
        private readonly Label _lblUpVal = new();
        private readonly Label _lblDownVal = new();
        private readonly Label _lblUnkVal = new();
        private readonly Label _lblLastVal = new();
        private readonly Label _lblAvgRttVal = new();
        private readonly Label _lblTopDownCompanyVal = new();
        private readonly Label _lblRunningVal = new();
        private readonly GroupBox _grpSummary = new();
        private readonly ListView _lvSummary = new();

        private readonly Chart _chartPie = new();
        private readonly Chart _chartBar = new();
        private readonly Chart _chartSsl = new();
        private readonly Chart _chartRtt = new();

        // Terminals
        private readonly GroupBox _grpTerminal = new();
        private readonly TextBox _txtName = new();
        private readonly TextBox _txtHost = new();
        private readonly ComboBox _cmbCompany = new();
        private readonly ComboBox _cmbType = new();
        private readonly Button _btnAdd = new();
        private readonly Button _btnEdit = new();
        private readonly Button _btnSave = new();
        private readonly Button _btnCancel = new();
        private readonly Button _btnRemove = new();
        private readonly Button _btnToggleMaint = new();
        private readonly DataGridView _gridTerm = new();

        // SSL
        private readonly GroupBox _grpSsl = new();
        private readonly TextBox _txtDomain = new();
        private readonly NumericUpDown _numMonths = new();
        private readonly CheckBox _chkUseExpiry = new();
        private readonly DateTimePicker _dtpExpiry = new();
        private readonly Button _btnSslAdd = new();
        private readonly Button _btnSslEdit = new();
        private readonly Button _btnSslSave = new();
        private readonly Button _btnSslCancel = new();
        private readonly Button _btnSslRemove = new();
        private readonly DataGridView _gridSsl = new();

        // Inventory
        private readonly GroupBox _grpInv = new();
        private readonly ComboBox _cmbInvCategory = new();
        private readonly ComboBox _cmbInvBrand = new();
        private readonly TextBox _txtInvModel = new();
        private readonly TextBox _txtInvSerial = new();
        private readonly ComboBox _cmbInvAssignedTo = new();
        private readonly TextBox _txtInvPcIsmi = new();
        private readonly DataGridView _gridInv = new();
        private readonly TextBox _txtInvSearch = new();
        private readonly RadioButton _rbInvAll = new() { Text = "Tümü", Checked = true };
        private readonly RadioButton _rbInvInfra = new() { Text = "Altyapı Envanteri" };
        private readonly RadioButton _rbInvPers = new() { Text = "Personel Envanteri" };
        private readonly DataGridView _gridInvSummary = new();
        private readonly Button _btnExportInvSummaryCsv = new();

        // Stock
        private readonly GroupBox _grpStock = new();
        private readonly ComboBox _cmbStockCategory = new();
        private readonly ComboBox _cmbStockBrand = new();
        private readonly TextBox _txtStockModel = new();
        private readonly TextBox _txtStockSerial = new();
        private readonly ComboBox _cmbStockStatus = new();
        private readonly ComboBox _cmbStockAssignTo = new();
        private readonly TextBox _txtStockPcIsmi = new();
        private readonly ComboBox _cmbStockEnvType = new();
        private readonly DataGridView _gridStock = new();
        private readonly Button _btnStockAdd = new();
        private readonly Button _btnStockRemove = new();
        private readonly Button _btnStockAssign = new();
        private readonly Button _btnStockImportCsv = new();

        // Logs
        private readonly GroupBox _grpLog = new();
        private readonly Panel _logFilterBar = new();
        private readonly TextBox _txtLogSearch = new();
        private readonly ComboBox _cmbLogAction = new();
        private readonly DateTimePicker _dtLogFrom = new();
        private readonly DateTimePicker _dtLogTo = new();
        private readonly Button _btnLogApply = new();
        private readonly Button _btnLogExport = new();
        private readonly DataGridView _gridLogs = new();
        // Personnel
        private readonly GroupBox _grpPers = new();
        private readonly TextBox _txtPersAd = new();
        private readonly TextBox _txtPersSoyad = new();
        private readonly ComboBox _cmbPersBolum = new();
        private readonly TextBox _txtPersGorev = new();
        private readonly ComboBox _cmbPersFirma = new();
        private readonly TextBox _txtPersKartNo = new();
        private readonly TextBox _txtPersSicilNo = new();
        private readonly TextBox _txtPersDahili = new();
        private readonly TextBox _txtPersCep = new();
        private readonly TextBox _txtPersMail = new();
        private readonly Button _btnPersAdd = new();
        private readonly Button _btnPersEdit = new();
        private readonly Button _btnPersSave = new();
        private readonly Button _btnPersCancel = new();
        private readonly Button _btnPersRemove = new();
        private readonly Button _btnPersImportCsv = new();
        private readonly Button _btnPersExportCsv = new();
        private readonly DataGridView _gridPers = new();
        private readonly DataGridView _gridPersItems = new();
        private readonly TextBox _txtPersSearch = new();
        
        // Settings
        private readonly GroupBox _grpSettings = new();
        private readonly TextBox _txtZimmetTemplate = new();
        private readonly Button _btnBrowseZimmet = new();
        private readonly TextBox _txtGlpiUrl = new();
        private readonly TextBox _txtGlpiAppToken = new();
        private readonly TextBox _txtGlpiUserToken = new();
        private readonly Button _btnSettingsSave = new();
        private readonly TextBox _txtZimmetOutputFolder = new();
        private readonly Button _btnBrowseZimmetOutput = new();
        // Email Settings
        private readonly GroupBox _grpEmailSettings = new();
        private readonly TextBox _txtSmtpServer = new();
        private readonly NumericUpDown _numSmtpPort = new();
        private readonly TextBox _txtSmtpUser = new();
        private readonly TextBox _txtSmtpPass = new();
        private readonly TextBox _txtSmtpTo = new();
        private readonly CheckBox _chkSmtpSsl = new();
        private readonly Button _btnSmtpSave = new();
        private readonly Button _btnSmtpTest = new();
        
        // Cards
        private readonly TabPage _tabCards = new("Kart Bilgisi");
        private readonly TextBox _txtCardMeyer = new();
        private readonly TextBox _txtCardYazici = new();
        private readonly TextBox _txtCardUnilever = new();
        private readonly TextBox _txtCardMacgal = new();
        private readonly Label _lblCardPersonnelInfo = new();
        private readonly Button _btnCardAddPersonnel = new();
        private readonly Button _btnCardGoPersonnel = new();
        private bool _isConvertingCards = false;
    }
}
