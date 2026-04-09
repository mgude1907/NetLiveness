using System;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;
using System.Windows.Forms.DataVisualization.Charting;

namespace NetLiveness
{
    public partial class Form1
    {
        private void BuildUi()
        {
            Text = "REPKON TERMINAL DURUM";
            Width = 1320;
            Height = 820;
            StartPosition = FormStartPosition.CenterScreen;

            BuildTopBar();
            BuildTabs();
            BuildDashboardTab();
            BuildTerminalsTab();
            BuildSslTab();
            BuildInventoryTab();
            BuildStockTab();
            BuildPersonnelTab();
            BuildLogsTab();
            BuildCardsTab();
            BuildSettingsTab();
            BuildSignature();

            Controls.AddRange(new Control[] { _logo, _btnStartStop, _intervalMs, _lblStatus, _lblMode, _tabs });
        }

        private void BuildTopBar()
        {
            _logo.Left = 12; _logo.Top = 10; _logo.Width = 140; _logo.Height = 46;
            _logo.SizeMode = PictureBoxSizeMode.Zoom;
            TryLoadLogo();

            _btnStartStop.Text = "Start";
            _btnStartStop.Width = 110; _btnStartStop.Height = 32;
            _btnStartStop.Left = _logo.Right + 12; _btnStartStop.Top = 14;
            _btnStartStop.Click += (_, __) => Toggle();

            var lblInterval = new Label { Text = "Interval (ms):", AutoSize = true, Left = _btnStartStop.Right + 14, Top = 22 };
            Controls.Add(lblInterval);

            _intervalMs.Minimum = 250; _intervalMs.Maximum = 60000;
            _intervalMs.Value = 2000; _intervalMs.Increment = 250;
            _intervalMs.Left = lblInterval.Right + 8; _intervalMs.Top = 16; _intervalMs.Width = 100;
            _intervalMs.ValueChanged += (_, __) => { if (_running) _timer.Interval = (int)_intervalMs.Value; };

            _lblStatus.AutoSize = true; _lblStatus.Left = _intervalMs.Right + 18; _lblStatus.Top = 22; _lblStatus.Text = "Ready";
            _lblMode.AutoSize = true; _lblMode.Left = _lblStatus.Right + 18; _lblMode.Top = 22; _lblMode.Text = "Mode: ADD";

            var lblOp = new Label { Text = "Operatör:", AutoSize = true, Left = _lblMode.Right + 18, Top = 22 };
            Controls.Add(lblOp);

            _cmbOperator.Left = lblOp.Right + 8; _cmbOperator.Top = 16; _cmbOperator.Width = 180;
            _cmbOperator.DropDownStyle = ComboBoxStyle.DropDownList;
            _cmbOperator.Items.AddRange(Operators.Cast<object>().ToArray());
            _cmbOperator.SelectedIndexChanged += (_, __) => { _appSettings.OperatorName = _cmbOperator.SelectedItem?.ToString() ?? ""; SaveSettings(); };
            Controls.Add(_cmbOperator);
        }

        private void BuildSignature()
        {
            _lblSignature.Text = "Mustafa Güde";
            _lblSignature.AutoSize = true;
            _lblSignature.ForeColor = Color.DimGray;
            _lblSignature.Font = new Font(Font.FontFamily, 9, FontStyle.Italic);
            _lblSignature.Anchor = AnchorStyles.Right | AnchorStyles.Bottom;
            Controls.Add(_lblSignature);
            PositionSignature();
            Resize += (_, __) => PositionSignature();
        }

        private void PositionSignature()
        {
            _lblSignature.Left = ClientSize.Width - _lblSignature.Width - 12;
            _lblSignature.Top = ClientSize.Height - _lblSignature.Height - 10;
        }

        private void BuildTabs()
        {
            _tabs.Left = 12; _tabs.Top = 66;
            _tabs.Width = ClientSize.Width - 24;
            _tabs.Height = ClientSize.Height - _tabs.Top - 12;
            _tabs.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            _tabs.TabPages.Add(_tabDashboard);
            _tabs.TabPages.Add(_tabTerminals);
            _tabs.TabPages.Add(_tabSsl);
            _tabs.TabPages.Add(_tabInv);
            _tabs.TabPages.Add(_tabStock);
            _tabs.TabPages.Add(_tabPersonels);
            _tabs.TabPages.Add(_tabLogs);
            _tabs.TabPages.Add(_tabCards);
            _tabs.TabPages.Add(_tabSettings);
        }

        private void BuildDashboardTab()
        {
            _tabDashboard.Controls.Clear();
            var mainPanel = new TableLayoutPanel { Dock = DockStyle.Fill, RowCount = 2, ColumnCount = 1 };
            mainPanel.RowStyles.Add(new RowStyle(SizeType.Absolute, 230));
            mainPanel.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

            var topPanel = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 1 };
            topPanel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 62));
            topPanel.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 38));

            _dashGrid.Dock = DockStyle.Fill; _dashGrid.ColumnCount = 4; _dashGrid.RowCount = 2;
            for (int i = 0; i < 4; i++) _dashGrid.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 25f));
            _dashGrid.RowStyles.Add(new RowStyle(SizeType.Percent, 50f));
            _dashGrid.RowStyles.Add(new RowStyle(SizeType.Percent, 50f));

            var green = Color.FromArgb(25, 140, 70);
            var red = Color.FromArgb(180, 45, 45);
            var dark = Color.FromArgb(30, 30, 45);

            BuildCard(_cardTotal, "TOTAL", _lblTotalVal, green);
            BuildCard(_cardUp, "UP", _lblUpVal, green);
            BuildCard(_cardDown, "DOWN", _lblDownVal, red);
            BuildCard(_cardUnk, "UNK", _lblUnkVal, dark);
            BuildCard(_cardLast, "LAST CHECK", _lblLastVal, dark);
            BuildCard(_cardAvgRtt, "AVG RTT (ms)", _lblAvgRttVal, dark);
            BuildCard(_cardTopDownCompany, "TOP DOWN FİRMA", _lblTopDownCompanyVal, dark);
            BuildCard(_cardRunning, "RUNNING", _lblRunningVal, dark);

            _dashGrid.Controls.Add(_cardTotal, 0, 0); _dashGrid.Controls.Add(_cardUp, 1, 0); _dashGrid.Controls.Add(_cardDown, 2, 0); _dashGrid.Controls.Add(_cardUnk, 3, 0);
            _dashGrid.Controls.Add(_cardLast, 0, 1); _dashGrid.Controls.Add(_cardAvgRtt, 1, 1); _dashGrid.Controls.Add(_cardTopDownCompany, 2, 1); _dashGrid.Controls.Add(_cardRunning, 3, 1);

            _grpSummary.Text = "Firma / Cihaz Türü Özet"; _grpSummary.Dock = DockStyle.Fill; _grpSummary.Padding = new Padding(6);
            _lvSummary.Dock = DockStyle.Fill; _lvSummary.View = View.Details; _lvSummary.FullRowSelect = true; _lvSummary.GridLines = true;
            _lvSummary.Columns.Add("Firma", 140); _lvSummary.Columns.Add("Cihaz Türü", 160); _lvSummary.Columns.Add("Total", 55); _lvSummary.Columns.Add("UP", 55); _lvSummary.Columns.Add("DOWN", 55);
            _grpSummary.Controls.Add(_lvSummary);

            topPanel.Controls.Add(_dashGrid, 0, 0); topPanel.Controls.Add(_grpSummary, 1, 0);

            var chartGrid = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 2, RowCount = 2 };
            chartGrid.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50f)); chartGrid.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 50f));
            chartGrid.RowStyles.Add(new RowStyle(SizeType.Percent, 50f)); chartGrid.RowStyles.Add(new RowStyle(SizeType.Percent, 50f));

            InitPieChart(_chartPie); InitBarChart(_chartBar); InitSslChart(_chartSsl); InitRttChart(_chartRtt);

            chartGrid.Controls.Add(WrapChart(_chartPie, "Terminal Durumu (Pie)"), 0, 0);
            chartGrid.Controls.Add(WrapChart(_chartBar, "Firma Bazlı UP vs DOWN"), 1, 0);
            chartGrid.Controls.Add(WrapChart(_chartSsl, "SSL Sertifika — Kalan Gün"), 0, 1);
            chartGrid.Controls.Add(WrapChart(_chartRtt, "RTT Trend (son 60 ölçüm)"), 1, 1);

            mainPanel.Controls.Add(topPanel, 0, 0); mainPanel.Controls.Add(chartGrid, 0, 1);
            _tabDashboard.Controls.Add(mainPanel);
        }

        private static GroupBox WrapChart(Chart chart, string title)
        {
            var grp = new GroupBox { Text = title, Dock = DockStyle.Fill, Margin = new Padding(4), Padding = new Padding(6) };
            chart.Dock = DockStyle.Fill; grp.Controls.Add(chart); return grp;
        }

        private static void BuildCard(Panel p, string title, Label valueLabel, Color backColor)
        {
            p.Dock = DockStyle.Fill; p.Margin = new Padding(6); p.BackColor = backColor;
            var lblTitle = new Label { Text = title, AutoSize = true, ForeColor = Color.White, Font = new Font(FontFamily.GenericSansSerif, 10, FontStyle.Bold), Left = 12, Top = 10 };
            valueLabel.Text = "-"; valueLabel.AutoSize = true; valueLabel.ForeColor = Color.White; valueLabel.Font = new Font(FontFamily.GenericSansSerif, 20, FontStyle.Bold); valueLabel.Left = 12; valueLabel.Top = 38;
            p.Controls.Add(lblTitle); p.Controls.Add(valueLabel);
        }

        private void BuildTerminalsTab()
        {
            _tabTerminals.Controls.Clear();
            var _btnTermToggle = new Button { Text = "+ Terminal Ekle / Düzenle", Left = 10, Top = 10, Width = 200, Height = 28, FlatStyle = FlatStyle.Popup };
            _grpTerminal.Text = "Terminal"; _grpTerminal.Left = 10; _grpTerminal.Top = _btnTermToggle.Bottom + 6; _grpTerminal.Width = _tabTerminals.ClientSize.Width - 20; _grpTerminal.Height = 150; _grpTerminal.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            _grpTerminal.Visible = false;

            int x = 12, yLabel = 30, yInput = 52;
            var lblName = new Label { Text = "Name:", AutoSize = true, Left = x, Top = yLabel }; _txtName.Left = x; _txtName.Top = yInput; _txtName.Width = 160;
            x += 175; var lblHost = new Label { Text = "IP/DNS:", AutoSize = true, Left = x, Top = yLabel }; _txtHost.Left = x; _txtHost.Top = yInput; _txtHost.Width = 200;
            x += 215; var lblCompany = new Label { Text = "Firma:", AutoSize = true, Left = x, Top = yLabel }; _cmbCompany.Left = x; _cmbCompany.Top = yInput; _cmbCompany.Width = 170; _cmbCompany.DropDownStyle = ComboBoxStyle.DropDownList; _cmbCompany.Items.AddRange(Companies.Cast<object>().ToArray()); _cmbCompany.SelectedIndex = 0;
            x += 185; var lblType = new Label { Text = "Cihaz Türü:", AutoSize = true, Left = x, Top = yLabel }; _cmbType.Left = x; _cmbType.Top = yInput; _cmbType.Width = 170; _cmbType.DropDownStyle = ComboBoxStyle.DropDownList; _cmbType.Items.AddRange(DeviceTypes.Cast<object>().ToArray()); _cmbType.SelectedIndex = 0;

            x += 185;
            _btnAdd.Text = "Ekle"; _btnAdd.Left = x; _btnAdd.Top = yInput - 1; _btnAdd.Width = 80; _btnAdd.Height = 28;
            _btnEdit.Text = "Düzenle"; _btnEdit.Left = x + 90; _btnEdit.Top = yInput - 1; _btnEdit.Width = 80; _btnEdit.Height = 28;
            _btnSave.Text = "Kaydet"; _btnSave.Left = x + 180; _btnSave.Top = yInput - 1; _btnSave.Width = 80; _btnSave.Height = 28; _btnSave.Enabled = false;
            _btnCancel.Text = "İptal"; _btnCancel.Left = x + 270; _btnCancel.Top = yInput - 1; _btnCancel.Width = 80; _btnCancel.Height = 28; _btnCancel.Enabled = false;
            _btnRemove.Text = "Sil"; _btnRemove.Left = x + 360; _btnRemove.Top = yInput - 1; _btnRemove.Width = 80; _btnRemove.Height = 28;
            _btnToggleMaint.Text = "Bakım Modu Aç/Kapat"; _btnToggleMaint.Left = x + 450; _btnToggleMaint.Top = yInput - 1; _btnToggleMaint.Width = 160; _btnToggleMaint.Height = 28;
            var lblMaintInfo = new Label { Text = "Bakım modunda uya rı verilmez.", AutoSize = true, Left = x + 450, Top = yInput + 32 };

            _btnAdd.Click += (_, __) => AddTerminal();
            _btnEdit.Click += (_, __) => BeginEditTerminalSelected();
            _btnSave.Click += (_, __) => SaveTerminalEdit();
            _btnCancel.Click += (_, __) => CancelTerminalEdit();
            _btnRemove.Click += (_, __) => RemoveTerminalSelected();
            _btnToggleMaint.Click += (_, __) => ToggleMaintenanceSelected();

            _grpTerminal.Controls.AddRange(new Control[] { lblName, _txtName, lblHost, _txtHost, lblCompany, _cmbCompany, lblType, _cmbType, _btnAdd, _btnEdit, _btnSave, _btnCancel, _btnRemove, _btnToggleMaint, lblMaintInfo });

            _gridTerm.Left = 10; _gridTerm.Top = _btnTermToggle.Bottom + 6; _gridTerm.Width = _tabTerminals.ClientSize.Width - 20; _gridTerm.Height = _tabTerminals.ClientSize.Height - _gridTerm.Top - 10; _gridTerm.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            _gridTerm.AllowUserToAddRows = false; _gridTerm.ReadOnly = true; _gridTerm.RowHeadersVisible = false; _gridTerm.SelectionMode = DataGridViewSelectionMode.FullRowSelect; _gridTerm.MultiSelect = false; _gridTerm.AutoGenerateColumns = false; _gridTerm.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            _gridTerm.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Company", HeaderText = "Firma", FillWeight = 22 });
            _gridTerm.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Name", HeaderText = "Name", FillWeight = 18 });
            _gridTerm.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Host", HeaderText = "IP/DNS", FillWeight = 18 });
            _gridTerm.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "DeviceType", HeaderText = "Cihaz Türü", FillWeight = 14 });
            _gridTerm.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Status", HeaderText = "Status", FillWeight = 10 });
            _gridTerm.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "RttMs", HeaderText = "RTT (ms)", FillWeight = 10 });
            _gridTerm.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "LastCheck", HeaderText = "Last Check", FillWeight = 12 });
            _gridTerm.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Maintenance", HeaderText = "Bakım", FillWeight = 8 });

            _gridTerm.SelectionChanged += (_, __) => UpdateTerminalButtons();
            _gridTerm.CellDoubleClick += (_, e) => {
                if (e.RowIndex < 0) return;
                var row = _gridTerm.Rows[e.RowIndex].DataBoundItem as Models.GridRow;
                if (row != null && row.IsHeader) ToggleCollapse(row.CompanyKey);
            };

            _gridTerm.CellFormatting += GridTerm_CellFormatting;

            _btnTermToggle.Click += (_, __) => {
                _grpTerminal.Visible = !_grpTerminal.Visible;
                _btnTermToggle.Text = _grpTerminal.Visible ? "- Terminal Ekle / Düzenle" : "+ Terminal Ekle / Düzenle";
                _gridTerm.Top = _grpTerminal.Visible ? _grpTerminal.Bottom + 6 : _btnTermToggle.Bottom + 6;
                _gridTerm.Height = _tabTerminals.ClientSize.Height - _gridTerm.Top - 10;
            };

            _tabTerminals.Controls.AddRange(new Control[] { _btnTermToggle, _grpTerminal, _gridTerm });
        }

        private void BuildSslTab()
        {
            _tabSsl.Controls.Clear();
            var _btnSslToggle = new Button { Text = "+ SSL Kayıt Ekle / Düzenle", Left = 10, Top = 10, Width = 200, Height = 28, FlatStyle = FlatStyle.Popup };
            _grpSsl.Text = "SSL Kayıt"; _grpSsl.Left = 10; _grpSsl.Top = _btnSslToggle.Bottom + 6; _grpSsl.Width = _tabSsl.ClientSize.Width - 20; _grpSsl.Height = 120; _grpSsl.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            _grpSsl.Visible = false;

            int x = 12, yLabel = 30, yInput = 52;
            var lblDomain = new Label { Text = "Alan Adı:", AutoSize = true, Left = x, Top = yLabel }; _txtDomain.Left = x; _txtDomain.Top = yInput; _txtDomain.Width = 260;
            x += 275; var lblMonths = new Label { Text = "Kaç Ay:", AutoSize = true, Left = x, Top = yLabel }; _numMonths.Left = x; _numMonths.Top = yInput; _numMonths.Width = 90; _numMonths.Minimum = 1; _numMonths.Maximum = 120; _numMonths.Value = 12;
            x += 110; _chkUseExpiry.Text = "Bitiş Tarihi Gir"; _chkUseExpiry.AutoSize = true; _chkUseExpiry.Left = x; _chkUseExpiry.Top = yInput + 4; _chkUseExpiry.CheckedChanged += (_, __) => _dtpExpiry.Enabled = _chkUseExpiry.Checked;
            x += 140; _dtpExpiry.Left = x; _dtpExpiry.Top = yInput; _dtpExpiry.Width = 160; _dtpExpiry.Format = DateTimePickerFormat.Short; _dtpExpiry.Enabled = false;
            
            x += 180;
            _btnSslAdd.Text = "Ekle"; _btnSslAdd.Left = x; _btnSslAdd.Top = yInput - 1; _btnSslAdd.Width = 80; _btnSslAdd.Height = 28;
            _btnSslEdit.Text = "Düzenle"; _btnSslEdit.Left = x + 90; _btnSslEdit.Top = yInput - 1; _btnSslEdit.Width = 80; _btnSslEdit.Height = 28;
            _btnSslSave.Text = "Kaydet"; _btnSslSave.Left = x + 180; _btnSslSave.Top = yInput - 1; _btnSslSave.Width = 80; _btnSslSave.Height = 28; _btnSslSave.Enabled = false;
            _btnSslCancel.Text = "İptal"; _btnSslCancel.Left = x + 270; _btnSslCancel.Top = yInput - 1; _btnSslCancel.Width = 80; _btnSslCancel.Height = 28; _btnSslCancel.Enabled = false;
            _btnSslRemove.Text = "Sil"; _btnSslRemove.Left = x + 360; _btnSslRemove.Top = yInput - 1; _btnSslRemove.Width = 80; _btnSslRemove.Height = 28;

            _btnSslAdd.Click += (_, __) => AddSsl();
            _btnSslEdit.Click += (_, __) => BeginEditSslSelected();
            _btnSslSave.Click += (_, __) => SaveSslEdit();
            _btnSslCancel.Click += (_, __) => CancelSslEdit();
            _btnSslRemove.Click += (_, __) => RemoveSslSelected();

            _grpSsl.Controls.AddRange(new Control[] { lblDomain, _txtDomain, lblMonths, _numMonths, _chkUseExpiry, _dtpExpiry, _btnSslAdd, _btnSslEdit, _btnSslSave, _btnSslCancel, _btnSslRemove });

            _gridSsl.Left = 10; _gridSsl.Top = _btnSslToggle.Bottom + 6; _gridSsl.Width = _tabSsl.ClientSize.Width - 20; _gridSsl.Height = _tabSsl.ClientSize.Height - _gridSsl.Top - 10; _gridSsl.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            _gridSsl.AllowUserToAddRows = false; _gridSsl.ReadOnly = true; _gridSsl.RowHeadersVisible = false; _gridSsl.SelectionMode = DataGridViewSelectionMode.FullRowSelect; _gridSsl.MultiSelect = false; _gridSsl.AutoGenerateColumns = false; _gridSsl.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            _gridSsl.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Domain", HeaderText = "Alan Adı", FillWeight = 35 });
            _gridSsl.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "ExpiryDate", HeaderText = "Bitiş Tarihi", FillWeight = 18 });
            _gridSsl.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "DaysLeft", HeaderText = "Kalan (Gün)", FillWeight = 15 });
            _gridSsl.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Status", HeaderText = "Durum", FillWeight = 15 });

            _btnSslToggle.Click += (_, __) => {
                _grpSsl.Visible = !_grpSsl.Visible;
                _btnSslToggle.Text = _grpSsl.Visible ? "- SSL Kayıt Ekle / Düzenle" : "+ SSL Kayıt Ekle / Düzenle";
                _gridSsl.Top = _grpSsl.Visible ? _grpSsl.Bottom + 6 : _btnSslToggle.Bottom + 6;
                _gridSsl.Height = _tabSsl.ClientSize.Height - _gridSsl.Top - 10;
            };

            _tabSsl.Controls.AddRange(new Control[] { _btnSslToggle, _grpSsl, _gridSsl });
        }

        private void BuildInventoryTab()
        {
            _tabInv.Controls.Clear();
            var _btnInvToggle = new Button { Text = "+ Envanter Ekle / Düzenle", Left = 10, Top = 10, Width = 200, Height = 28, FlatStyle = FlatStyle.Popup };
            
            var lblSearch = new Label { Text = "Envanter Ara (SN veya İsim):", Left = 230, Top = 15, AutoSize = true, Font = new Font(Control.DefaultFont, FontStyle.Bold) };
            _txtInvSearch.Left = 410; _txtInvSearch.Top = 13; _txtInvSearch.Width = 200;

            _grpInv.Text = "Envanter (Zimmetli Ürünler)"; _grpInv.Left = 10; _grpInv.Top = _btnInvToggle.Bottom + 6; _grpInv.Width = _tabInv.ClientSize.Width - 420; _grpInv.Height = 160; _grpInv.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            _grpInv.Visible = false;

            _rbInvAll.Left = 10; _rbInvAll.Top = _btnInvToggle.Bottom + 10; _rbInvAll.AutoSize = true;
            _rbInvInfra.Left = 80; _rbInvInfra.Top = _btnInvToggle.Bottom + 10; _rbInvInfra.AutoSize = true;
            _rbInvPers.Left = 200; _rbInvPers.Top = _btnInvToggle.Bottom + 10; _rbInvPers.AutoSize = true;
            _rbInvAll.CheckedChanged += (_, __) => RefreshInvGrid();
            _rbInvInfra.CheckedChanged += (_, __) => RefreshInvGrid();
            _rbInvPers.CheckedChanged += (_, __) => RefreshInvGrid();

            _btnExportInvSummaryCsv.Text = "Özet CSV Dışa Aktar";
            _btnExportInvSummaryCsv.Width = 140; _btnExportInvSummaryCsv.Height = 28;
            _btnExportInvSummaryCsv.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            _btnExportInvSummaryCsv.Top = _btnInvToggle.Bottom + 10;
            _btnExportInvSummaryCsv.Left = _tabInv.ClientSize.Width - 150;
            _btnExportInvSummaryCsv.Click += (_, __) => ExportInvSummaryCsv();

            int x = 12, yLabel = 30, yInput = 52;
            var lblCat = new Label { Text = "Kategori:", AutoSize = true, Left = x, Top = yLabel }; _cmbInvCategory.Left = x; _cmbInvCategory.Top = yInput; _cmbInvCategory.Width = 140; _cmbInvCategory.DropDownStyle = ComboBoxStyle.DropDownList; _cmbInvCategory.Items.AddRange(InventoryCategories.Cast<object>().ToArray()); _cmbInvCategory.SelectedIndex = 0;
            x += 155; var lblBrand = new Label { Text = "Marka:", AutoSize = true, Left = x, Top = yLabel }; _cmbInvBrand.Left = x; _cmbInvBrand.Top = yInput; _cmbInvBrand.Width = 150; _cmbInvBrand.Items.AddRange(InventoryBrands.Cast<object>().ToArray());
            x += 165; var lblModel = new Label { Text = "Model:", AutoSize = true, Left = x, Top = yLabel }; _txtInvModel.Left = x; _txtInvModel.Top = yInput; _txtInvModel.Width = 180;
            _txtInvModel.AutoCompleteMode = AutoCompleteMode.SuggestAppend; _txtInvModel.AutoCompleteSource = AutoCompleteSource.CustomSource;
            x += 195; var lblSerial = new Label { Text = "Seri No:", AutoSize = true, Left = x, Top = yLabel }; _txtInvSerial.Left = x; _txtInvSerial.Top = yInput; _txtInvSerial.Width = 160;
            x += 175; var lblPcIsmi = new Label { Text = "PC İsmi:", AutoSize = true, Left = x, Top = yLabel }; _txtInvPcIsmi.Left = x; _txtInvPcIsmi.Top = yInput; _txtInvPcIsmi.Width = 140;
            x += 155; var lblAssigned = new Label { Text = "Kime Verildi (Ad Soyad):", AutoSize = true, Left = x, Top = yLabel }; _cmbInvAssignedTo.Left = x; _cmbInvAssignedTo.Top = yInput; _cmbInvAssignedTo.Width = 180; _cmbInvAssignedTo.DropDownStyle = ComboBoxStyle.DropDownList;

            int x2 = 12, y2 = 112;
            Button _btnInvAdd = new Button { Text = "Ekle", Left = x2, Top = y2, Width = 80, Height = 28 };
            Button _btnInvEdit = new Button { Text = "Düzenle", Left = x2 + 90, Top = y2, Width = 80, Height = 28, Enabled = false };
            Button _btnInvSave = new Button { Text = "Kaydet", Left = x2 + 180, Top = y2, Width = 80, Height = 28, Enabled = false };
            Button _btnInvCancel = new Button { Text = "İptal", Left = x2 + 270, Top = y2, Width = 80, Height = 28, Enabled = false };
            Button _btnInvRemove = new Button { Text = "Sil", Left = x2 + 360, Top = y2, Width = 80, Height = 28 };
            Button _btnInvReturnToStock = new Button { Text = "Stoğa Geri Al", Left = x2 + 450, Top = y2, Width = 120, Height = 28 };
            Button _btnInvZimmet = new Button { Text = "Zimmet Formu", Left = x2 + 580, Top = y2, Width = 120, Height = 28 };

            _btnInvAdd.Click += (_, __) => AddInv();
            _btnInvRemove.Click += (_, __) => RemoveInv();
            _btnInvReturnToStock.Click += (_, __) => ReturnToStock();
            _btnInvZimmet.Click += (_, __) => GenerateZimmetForm();

            _grpInv.Controls.AddRange(new Control[] { lblCat, _cmbInvCategory, lblBrand, _cmbInvBrand, lblModel, _txtInvModel, lblSerial, _txtInvSerial, lblPcIsmi, _txtInvPcIsmi, lblAssigned, _cmbInvAssignedTo, _btnInvAdd, _btnInvEdit, _btnInvSave, _btnInvCancel, _btnInvRemove, _btnInvReturnToStock, _btnInvZimmet });

            _gridInv.Left = 10; _gridInv.Top = _btnInvToggle.Bottom + 10; _gridInv.Width = _tabInv.ClientSize.Width - 20; _gridInv.Height = _tabInv.ClientSize.Height - _gridInv.Top - 10; _gridInv.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            _gridInv.AllowUserToAddRows = false; _gridInv.ReadOnly = true; _gridInv.RowHeadersVisible = false; _gridInv.SelectionMode = DataGridViewSelectionMode.FullRowSelect; _gridInv.MultiSelect = false; _gridInv.AutoGenerateColumns = false; _gridInv.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            _gridInv.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Category", HeaderText = "Kategori", FillWeight = 12 });
            _gridInv.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Brand", HeaderText = "Marka", FillWeight = 12 });
            _gridInv.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Model", HeaderText = "Model", FillWeight = 20 });
            _gridInv.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "SerialNo", HeaderText = "Seri No", FillWeight = 18 });
            _gridInv.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "PcIsmi", HeaderText = "PC İsmi", FillWeight = 18 });
            _gridInv.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "AssignedTo", HeaderText = "Kime Verildi", FillWeight = 18 });

            _gridInv.CellDoubleClick += (_, e) => {
                if (e.RowIndex < 0) return;
                var row = _gridInv.Rows[e.RowIndex].DataBoundItem as Models.InventoryRow;
                if (row != null && row.IsHeader) ToggleCollapseAssignedTo(row.AssignedToKey);
            };

            _gridInvSummary.Left = _tabInv.ClientSize.Width - 400; _gridInvSummary.Top = _btnExportInvSummaryCsv.Bottom + 10; _gridInvSummary.Width = 390; _gridInvSummary.Height = _tabInv.ClientSize.Height - _gridInvSummary.Top - 10; _gridInvSummary.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Right;
            _gridInvSummary.AllowUserToAddRows = false; _gridInvSummary.ReadOnly = true; _gridInvSummary.RowHeadersVisible = false; _gridInvSummary.SelectionMode = DataGridViewSelectionMode.FullRowSelect; _gridInvSummary.MultiSelect = false; _gridInvSummary.AutoGenerateColumns = false; _gridInvSummary.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            _gridInvSummary.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Brand", HeaderText = "Marka", FillWeight = 40 });
            _gridInvSummary.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Model", HeaderText = "Model", FillWeight = 40 });
            _gridInvSummary.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Count", HeaderText = "Adet", FillWeight = 20 });

            _btnInvToggle.Click += (_, __) => {
                _grpInv.Visible = !_grpInv.Visible;
                _btnInvToggle.Text = _grpInv.Visible ? "- Envanter Ekle / Düzenle" : "+ Envanter Ekle / Düzenle";
                _gridInv.Top = _grpInv.Visible ? _grpInv.Bottom + 6 : _btnInvToggle.Bottom + 36;
                _gridInv.Height = _tabInv.ClientSize.Height - _gridInv.Top - 10;
                
                _rbInvAll.Visible = !_grpInv.Visible;
                _rbInvInfra.Visible = !_grpInv.Visible;
                _rbInvPers.Visible = !_grpInv.Visible;
                _btnExportInvSummaryCsv.Visible = !_grpInv.Visible;
            };

            _txtInvSearch.TextChanged += (_, __) => RefreshInvGrid();

            _tabInv.Controls.AddRange(new Control[] { _btnInvToggle, lblSearch, _txtInvSearch, _grpInv, _gridInv, _rbInvAll, _rbInvInfra, _rbInvPers, _gridInvSummary, _btnExportInvSummaryCsv });
            
            _tabInv.Resize += (_, __) => {
                _btnExportInvSummaryCsv.Left = _tabInv.ClientSize.Width - 150;
                _gridInvSummary.Left = _tabInv.ClientSize.Width - 400;
                _gridInv.Width = _tabInv.ClientSize.Width - 420;
            };
        }

        private void BuildStockTab()
        {
            _tabStock.Controls.Clear();
            var _btnStockToggle = new Button { Text = "+ Stok Ekle / Düzenle", Left = 10, Top = 10, Width = 180, Height = 28, FlatStyle = FlatStyle.Popup };
            _grpStock.Text = "Stok Yönetimi"; _grpStock.Left = 10; _grpStock.Top = _btnStockToggle.Bottom + 6; _grpStock.Width = _tabStock.ClientSize.Width - 20; _grpStock.Height = 160; _grpStock.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            _grpStock.Visible = false;

            int x = 12, yLabel = 30, yInput = 52;
            var lblCat = new Label { Text = "Kategori:", AutoSize = true, Left = x, Top = yLabel }; _cmbStockCategory.Left = x; _cmbStockCategory.Top = yInput; _cmbStockCategory.Width = 140; _cmbStockCategory.DropDownStyle = ComboBoxStyle.DropDownList; _cmbStockCategory.Items.AddRange(InventoryCategories.Cast<object>().ToArray()); _cmbStockCategory.SelectedIndex = 0;
            x += 155; var lblBrand = new Label { Text = "Marka:", AutoSize = true, Left = x, Top = yLabel }; _cmbStockBrand.Left = x; _cmbStockBrand.Top = yInput; _cmbStockBrand.Width = 150; _cmbStockBrand.Items.AddRange(InventoryBrands.Cast<object>().ToArray());
            x += 165; var lblModel = new Label { Text = "Model:", AutoSize = true, Left = x, Top = yLabel }; _txtStockModel.Left = x; _txtStockModel.Top = yInput; _txtStockModel.Width = 180;
            _txtStockModel.AutoCompleteMode = AutoCompleteMode.SuggestAppend; _txtStockModel.AutoCompleteSource = AutoCompleteSource.CustomSource;
            x += 195; var lblSerial = new Label { Text = "Seri No:", AutoSize = true, Left = x, Top = yLabel }; _txtStockSerial.Left = x; _txtStockSerial.Top = yInput; _txtStockSerial.Width = 160;
            x += 175; var lblPcIsmi = new Label { Text = "PC İsmi:", AutoSize = true, Left = x, Top = yLabel }; _txtStockPcIsmi.Left = x; _txtStockPcIsmi.Top = yInput; _txtStockPcIsmi.Width = 140;
            x += 155; var lblStatus = new Label { Text = "Durum:", AutoSize = true, Left = x, Top = yLabel }; _cmbStockStatus.Left = x; _cmbStockStatus.Top = yInput; _cmbStockStatus.Width = 120; _cmbStockStatus.DropDownStyle = ComboBoxStyle.DropDownList; _cmbStockStatus.Items.AddRange(new object[] { "Sağlam", "Arızalı", "Hurda" }); _cmbStockStatus.SelectedIndex = 0;
            x += 135; var lblEnvType = new Label { Text = "Envanter Türü:", AutoSize = true, Left = x, Top = yLabel }; _cmbStockEnvType.Left = x; _cmbStockEnvType.Top = yInput; _cmbStockEnvType.Width = 140; _cmbStockEnvType.DropDownStyle = ComboBoxStyle.DropDownList; _cmbStockEnvType.Items.AddRange(new object[] { "Personel Envanteri", "Altyapı Envanteri" }); _cmbStockEnvType.SelectedIndex = 0;

            int x2 = 12, y2 = 112;
            _btnStockAdd.Text = "Stoğa Ekle"; _btnStockAdd.Left = x2; _btnStockAdd.Top = y2; _btnStockAdd.Width = 100; _btnStockAdd.Height = 28;
            _btnStockRemove.Text = "Stoktan Sil"; _btnStockRemove.Left = x2 + 110; _btnStockRemove.Top = y2; _btnStockRemove.Width = 100; _btnStockRemove.Height = 28;
            _btnStockAssign.Text = "Personele Zimmetle ->"; _btnStockAssign.Left = x2 + 220; _btnStockAssign.Top = y2; _btnStockAssign.Width = 160; _btnStockAssign.Height = 28;
            var lblAssign = new Label { Text = "Kime:", AutoSize = true, Left = x2 + 390, Top = y2 + 5 }; _cmbStockAssignTo.Left = x2 + 430; _cmbStockAssignTo.Top = y2; _cmbStockAssignTo.Width = 180; _cmbStockAssignTo.DropDownStyle = ComboBoxStyle.DropDownList;
            _btnStockImportCsv.Text = "CSV İçe Aktar"; _btnStockImportCsv.Left = x2 + 630; _btnStockImportCsv.Top = y2; _btnStockImportCsv.Width = 120; _btnStockImportCsv.Height = 28;

            _btnStockAdd.Click += (_, __) => AddStock();
            _btnStockRemove.Click += (_, __) => RemoveStockSelected();
            _btnStockAssign.Click += (_, __) => AssignStockToInv();
            _btnStockImportCsv.Click += (_, __) => ImportStockCsv();

            Button _btnStockExportCsv = new Button { Text = "CSV Dışa Aktar", Left = x2 + 760, Top = y2, Width = 120, Height = 28 };
            _btnStockExportCsv.Click += (_, __) => ExportStockCsv();

            _grpStock.Controls.AddRange(new Control[] { lblCat, _cmbStockCategory, lblBrand, _cmbStockBrand, lblModel, _txtStockModel, lblSerial, _txtStockSerial, lblPcIsmi, _txtStockPcIsmi, lblStatus, _cmbStockStatus, lblEnvType, _cmbStockEnvType, _btnStockAdd, _btnStockRemove, _btnStockAssign, lblAssign, _cmbStockAssignTo, _btnStockImportCsv, _btnStockExportCsv });

            _gridStock.Left = 10; _gridStock.Top = _btnStockToggle.Bottom + 10; _gridStock.Width = _tabStock.ClientSize.Width - 20; _gridStock.Height = _tabStock.ClientSize.Height - _gridStock.Top - 10; _gridStock.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            _gridStock.AllowUserToAddRows = false; _gridStock.ReadOnly = true; _gridStock.RowHeadersVisible = false; _gridStock.SelectionMode = DataGridViewSelectionMode.FullRowSelect; _gridStock.MultiSelect = false; _gridStock.AutoGenerateColumns = false; _gridStock.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            _gridStock.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Category", HeaderText = "Kategori", FillWeight = 15 });
            _gridStock.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Brand", HeaderText = "Marka", FillWeight = 15 });
            _gridStock.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Model", HeaderText = "Model", FillWeight = 25 });
            _gridStock.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "SerialNo", HeaderText = "Seri No", FillWeight = 20 });
            _gridStock.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "PcIsmi", HeaderText = "PC İsmi", FillWeight = 15 });
            _gridStock.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Status", HeaderText = "Durum", FillWeight = 10 });
            _gridStock.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "EnvanterTuru", HeaderText = "Tür", FillWeight = 15 });
            _gridStock.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "DateAdded", HeaderText = "Giriş Tarihi", FillWeight = 15 });

            _btnStockToggle.Click += (_, __) => {
                _grpStock.Visible = !_grpStock.Visible;
                _btnStockToggle.Text = _grpStock.Visible ? "- Stok Ekle / Düzenle" : "+ Stok Ekle / Düzenle";
                _gridStock.Top = _grpStock.Visible ? _grpStock.Bottom + 6 : _btnStockToggle.Bottom + 6;
                _gridStock.Height = _tabStock.ClientSize.Height - _gridStock.Top - 10;
            };

            _tabStock.Controls.AddRange(new Control[] { _btnStockToggle, _grpStock, _gridStock });
        }

        private void BuildLogsTab()
        {
            _tabLogs.Controls.Clear();
            var _btnLogToggle = new Button { Text = "+ Filtreler", Left = 10, Top = 10, Width = 120, Height = 28, FlatStyle = FlatStyle.Popup };
            _grpLog.Text = "Log İzleme"; _grpLog.Left = 10; _grpLog.Top = _btnLogToggle.Bottom + 6; _grpLog.Width = _tabLogs.ClientSize.Width - 20; _grpLog.Height = 80; _grpLog.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            _grpLog.Visible = false;

            int x = 12, yInput = 32;
            var lblSearch = new Label { Text = "Arama:", AutoSize = true, Left = x, Top = yInput + 4 }; _txtLogSearch.Left = x + 55; _txtLogSearch.Top = yInput; _txtLogSearch.Width = 200;
            x += 275; var lblAction = new Label { Text = "Aksiyon:", AutoSize = true, Left = x, Top = yInput + 4 }; _cmbLogAction.Left = x + 65; _cmbLogAction.Top = yInput; _cmbLogAction.Width = 140; _cmbLogAction.DropDownStyle = ComboBoxStyle.DropDownList; _cmbLogAction.Items.AddRange(new object[] { "TÜMÜ", "TERM_ADD", "TERM_EDIT", "TERM_DEL", "TERM_MAINT", "SSL_ADD", "SSL_EDIT", "SSL_DEL", "STOCK_ADD", "STOCK_DEL", "STOCK_ASSIGN", "INV_ADD", "INV_DEL", "INV_RETURN" }); _cmbLogAction.SelectedIndex = 0;
            x += 225; var lblFrom = new Label { Text = "Başlangıç:", AutoSize = true, Left = x, Top = yInput + 4 }; _dtLogFrom.Left = x + 70; _dtLogFrom.Top = yInput; _dtLogFrom.Width = 130; _dtLogFrom.Format = DateTimePickerFormat.Short; _dtLogFrom.Value = DateTime.Today.AddDays(-7);
            x += 215; var lblTo = new Label { Text = "Bitiş:", AutoSize = true, Left = x, Top = yInput + 4 }; _dtLogTo.Left = x + 40; _dtLogTo.Top = yInput; _dtLogTo.Width = 130; _dtLogTo.Format = DateTimePickerFormat.Short; _dtLogTo.Value = DateTime.Today;
            
            x += 185;
            _btnLogApply.Text = "Filtrele"; _btnLogApply.Left = x; _btnLogApply.Top = yInput - 1; _btnLogApply.Width = 80; _btnLogApply.Height = 28;
            _btnLogExport.Text = "CSV İndir"; _btnLogExport.Left = x + 90; _btnLogExport.Top = yInput - 1; _btnLogExport.Width = 80; _btnLogExport.Height = 28;

            _btnLogApply.Click += (_, __) => ApplyLogFilter();
            _btnLogExport.Click += (_, __) => ExportLogsCsv();

            _grpLog.Controls.AddRange(new Control[] { lblSearch, _txtLogSearch, lblAction, _cmbLogAction, lblFrom, _dtLogFrom, lblTo, _dtLogTo, _btnLogApply, _btnLogExport });

            _gridLogs.Left = 10; _gridLogs.Top = _btnLogToggle.Bottom + 10; _gridLogs.Width = _tabLogs.ClientSize.Width - 20; _gridLogs.Height = _tabLogs.ClientSize.Height - _gridLogs.Top - 10; _gridLogs.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            _gridLogs.AllowUserToAddRows = false; _gridLogs.ReadOnly = true; _gridLogs.RowHeadersVisible = false; _gridLogs.SelectionMode = DataGridViewSelectionMode.FullRowSelect; _gridLogs.MultiSelect = false; _gridLogs.AutoGenerateColumns = false; _gridLogs.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            _gridLogs.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Date", HeaderText = "Tarih", FillWeight = 15 });
            _gridLogs.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Operator", HeaderText = "Operatör", FillWeight = 15 });
            _gridLogs.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Action", HeaderText = "Aksiyon", FillWeight = 15 });
            _gridLogs.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Details", HeaderText = "Detay", FillWeight = 55 });

            _btnLogToggle.Click += (_, __) => {
                _grpLog.Visible = !_grpLog.Visible;
                _btnLogToggle.Text = _grpLog.Visible ? "- Filtreler" : "+ Filtreler";
                _gridLogs.Top = _grpLog.Visible ? _grpLog.Bottom + 6 : _btnLogToggle.Bottom + 6;
                _gridLogs.Height = _tabLogs.ClientSize.Height - _gridLogs.Top - 10;
            };

            _tabLogs.Controls.AddRange(new Control[] { _btnLogToggle, _grpLog, _gridLogs });
        }

        private static void InitPieChart(Chart c)
        {
            c.ChartAreas.Clear(); c.Series.Clear(); c.Legends.Clear();
            var area = new ChartArea("main") { BackColor = Color.Transparent }; c.ChartAreas.Add(area);
            c.Legends.Add(new Legend("main") { Docking = Docking.Bottom, Alignment = StringAlignment.Center, Font = new Font("Segoe UI", 8f) });
            var s = new Series("Status") { ChartType = SeriesChartType.Pie, Legend = "main", IsVisibleInLegend = true };
            s["PieLabelStyle"] = "Outside"; s["PieLineColor"] = "Black";
            c.Series.Add(s); c.BackColor = Color.WhiteSmoke;
        }

        private static void InitBarChart(Chart c)
        {
            c.ChartAreas.Clear(); c.Series.Clear(); c.Legends.Clear();
            var area = new ChartArea("main") { BackColor = Color.Transparent };
            area.AxisX.MajorGrid.Enabled = false;
            area.AxisY.MajorGrid.LineColor = Color.LightGray;
            c.ChartAreas.Add(area);
            c.Legends.Add(new Legend("main") { Docking = Docking.Bottom, Alignment = StringAlignment.Center, Font = new Font("Segoe UI", 8f) });
            var sUp = new Series("UP") { ChartType = SeriesChartType.StackedColumn, Color = Color.FromArgb(25, 140, 70) };
            var sDown = new Series("DOWN") { ChartType = SeriesChartType.StackedColumn, Color = Color.FromArgb(180, 45, 45) };
            c.Series.Add(sUp); c.Series.Add(sDown);
            c.BackColor = Color.WhiteSmoke;
        }

        private static void InitSslChart(Chart c)
        {
            c.ChartAreas.Clear(); c.Series.Clear(); c.Legends.Clear();
            var area = new ChartArea("main") { BackColor = Color.Transparent };
            area.AxisX.MajorGrid.Enabled = false;
            area.AxisY.MajorGrid.LineColor = Color.LightGray;
            c.ChartAreas.Add(area);
            var s = new Series("Gün") { ChartType = SeriesChartType.Bar, Color = Color.SteelBlue, IsValueShownAsLabel = true };
            c.Series.Add(s);
            c.BackColor = Color.WhiteSmoke;
        }

        private static void InitRttChart(Chart c)
        {
            c.ChartAreas.Clear(); c.Series.Clear(); c.Legends.Clear();
            var area = new ChartArea("main") { BackColor = Color.Transparent };
            area.AxisX.MajorGrid.Enabled = false;
            area.AxisY.MajorGrid.LineColor = Color.LightGray;
            c.ChartAreas.Add(area);
            var s = new Series("RTT") { ChartType = SeriesChartType.SplineArea, Color = Color.FromArgb(100, 65, 140, 240), BorderColor = Color.RoyalBlue, BorderWidth = 2 };
            c.Series.Add(s);
            c.BackColor = Color.WhiteSmoke;
        }

        private void BuildPersonnelTab()
        {
            _tabPersonels.Controls.Clear();
            var _btnPersToggle = new Button { Text = "- Personel Ekle / Düzenle", Left = 10, Top = 10, Width = 200, Height = 28, FlatStyle = FlatStyle.Popup };
            _grpPers.Text = "Personel Yönetimi"; _grpPers.Left = 10; _grpPers.Top = _btnPersToggle.Bottom + 6; _grpPers.Width = _tabPersonels.ClientSize.Width - 20; _grpPers.Height = 210; _grpPers.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            _grpPers.Visible = true;

            int x = 12, yLabel = 30, yInput = 52;
            var lblAd = new Label { Text = "Ad:", AutoSize = true, Left = x, Top = yLabel }; _txtPersAd.Left = x; _txtPersAd.Top = yInput; _txtPersAd.Width = 140;
            x += 150; var lblSoyad = new Label { Text = "Soyad:", AutoSize = true, Left = x, Top = yLabel }; _txtPersSoyad.Left = x; _txtPersSoyad.Top = yInput; _txtPersSoyad.Width = 140;
            x += 150; var lblBolum = new Label { Text = "Bölüm:", AutoSize = true, Left = x, Top = yLabel }; _cmbPersBolum.Left = x; _cmbPersBolum.Top = yInput; _cmbPersBolum.Width = 150; _cmbPersBolum.Items.AddRange(new object[] { "IT", "İK", "Muhasebe", "Satış", "Pazarlama", "Üretim", "Yönetim" }); 
            x += 160; var lblGorev = new Label { Text = "Görev (Unvan):", AutoSize = true, Left = x, Top = yLabel }; _txtPersGorev.Left = x; _txtPersGorev.Top = yInput; _txtPersGorev.Width = 160;
            x += 170; var lblFirma = new Label { Text = "Firma:", AutoSize = true, Left = x, Top = yLabel }; _cmbPersFirma.Left = x; _cmbPersFirma.Top = yInput; _cmbPersFirma.Width = 150; _cmbPersFirma.Items.AddRange(Companies.Cast<object>().ToArray()); _cmbPersFirma.DropDownStyle = ComboBoxStyle.DropDownList;
            x += 160; var lblKart = new Label { Text = "Kart No:", AutoSize = true, Left = x, Top = yLabel }; _txtPersKartNo.Left = x; _txtPersKartNo.Top = yInput; _txtPersKartNo.Width = 90;
            x += 100; var lblSicil = new Label { Text = "Sicil No:", AutoSize = true, Left = x, Top = yLabel }; _txtPersSicilNo.Left = x; _txtPersSicilNo.Top = yInput; _txtPersSicilNo.Width = 90;

            int x2x = 12, yLabel2 = 90, yInput2 = 112;
            var lblDahili = new Label { Text = "Dahili:", AutoSize = true, Left = x2x, Top = yLabel2 }; _txtPersDahili.Left = x2x; _txtPersDahili.Top = yInput2; _txtPersDahili.Width = 80;
            x2x += 90; var lblCep = new Label { Text = "Cep No:", AutoSize = true, Left = x2x, Top = yLabel2 }; _txtPersCep.Left = x2x; _txtPersCep.Top = yInput2; _txtPersCep.Width = 120;
            x2x += 130; var lblMail = new Label { Text = "Mail:", AutoSize = true, Left = x2x, Top = yLabel2 }; _txtPersMail.Left = x2x; _txtPersMail.Top = yInput2; _txtPersMail.Width = 180;

            int x2 = 12, y2 = 160;
            _btnPersAdd.Text = "Ekle"; _btnPersAdd.Left = x2; _btnPersAdd.Top = y2; _btnPersAdd.Width = 80; _btnPersAdd.Height = 28;
            _btnPersEdit.Text = "Düzenle"; _btnPersEdit.Left = x2 + 90; _btnPersEdit.Top = y2; _btnPersEdit.Width = 80; _btnPersEdit.Height = 28;
            _btnPersSave.Text = "Kaydet"; _btnPersSave.Left = x2 + 180; _btnPersSave.Top = y2; _btnPersSave.Width = 80; _btnPersSave.Height = 28; _btnPersSave.Enabled = false;
            _btnPersCancel.Text = "İptal"; _btnPersCancel.Left = x2 + 270; _btnPersCancel.Top = y2; _btnPersCancel.Width = 80; _btnPersCancel.Height = 28; _btnPersCancel.Enabled = false;
            _btnPersRemove.Text = "Sil"; _btnPersRemove.Left = x2 + 360; _btnPersRemove.Top = y2; _btnPersRemove.Width = 80; _btnPersRemove.Height = 28;
            _btnPersImportCsv.Text = "CSV İçe Aktar"; _btnPersImportCsv.Left = x2 + 450; _btnPersImportCsv.Top = y2; _btnPersImportCsv.Width = 100; _btnPersImportCsv.Height = 28;
            _btnPersExportCsv.Text = "CSV Dışa Aktar"; _btnPersExportCsv.Left = x2 + 560; _btnPersExportCsv.Top = y2; _btnPersExportCsv.Width = 100; _btnPersExportCsv.Height = 28;

            _btnPersAdd.Click -= delegate { }; _btnPersAdd.Click += (_, __) => AddPersonnel();
            _btnPersEdit.Click -= delegate { }; _btnPersEdit.Click += (_, __) => BeginEditPersonnelSelected();
            _btnPersSave.Click -= delegate { }; _btnPersSave.Click += (_, __) => SavePersonnelEdit();
            _btnPersCancel.Click -= delegate { }; _btnPersCancel.Click += (_, __) => CancelPersonnelEdit();
            _btnPersRemove.Click -= delegate { }; _btnPersRemove.Click += (_, __) => RemovePersonnelSelected();
            _btnPersImportCsv.Click -= delegate { }; _btnPersImportCsv.Click += (_, __) => ImportPersonnelCsv();
            _btnPersExportCsv.Click -= delegate { }; _btnPersExportCsv.Click += (_, __) => ExportPersonnelCsv();

            _grpPers.Controls.AddRange(new Control[] { lblAd, _txtPersAd, lblSoyad, _txtPersSoyad, lblBolum, _cmbPersBolum, lblGorev, _txtPersGorev, lblFirma, _cmbPersFirma, lblKart, _txtPersKartNo, lblSicil, _txtPersSicilNo, lblDahili, _txtPersDahili, lblCep, _txtPersCep, lblMail, _txtPersMail, _btnPersAdd, _btnPersEdit, _btnPersSave, _btnPersCancel, _btnPersRemove, _btnPersImportCsv, _btnPersExportCsv });

            _tabPersonels.Resize += (_, __) => {
                _gridPers.Width = (_tabPersonels.ClientSize.Width - 30) / 2;
                _gridPersItems.Left = _gridPers.Right + 10;
                _gridPersItems.Width = (_tabPersonels.ClientSize.Width - 30) / 2;
            };

            var lblSearch = new Label { Text = "Personel Ara (Ad, Soyad, Kart No):", Left = 220, Top = 15, AutoSize = true, Font = new Font(Control.DefaultFont, FontStyle.Bold) };
            _txtPersSearch.Left = 460; _txtPersSearch.Top = 13; _txtPersSearch.Width = 200;
            _txtPersSearch.TextChanged += (_, __) => RefreshPersonnelGrid();

            _btnPersToggle.Click += (_, __) => {
                _grpPers.Visible = !_grpPers.Visible;
                _btnPersToggle.Text = _grpPers.Visible ? "- Personel Ekle / Düzenle" : "+ Personel Ekle / Düzenle";
                _gridPers.Top = _grpPers.Visible ? _grpPers.Bottom + 10 : _btnPersToggle.Bottom + 10;
                _gridPers.Height = _tabPersonels.ClientSize.Height - _gridPers.Top - 10;
                _gridPersItems.Top = _gridPers.Top;
                _gridPersItems.Height = _gridPers.Height;
            };

            _tabPersonels.Controls.Add(lblSearch);
            _tabPersonels.Controls.Add(_txtPersSearch);

            _gridPers.Left = 10; _gridPers.Top = _grpPers.Bottom + 10; _gridPers.Width = (_tabPersonels.ClientSize.Width - 30) / 2; _gridPers.Height = _tabPersonels.ClientSize.Height - _gridPers.Top - 10; _gridPers.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left;
            _gridPers.AllowUserToAddRows = false; _gridPers.ReadOnly = true; _gridPers.RowHeadersVisible = false; _gridPers.SelectionMode = DataGridViewSelectionMode.FullRowSelect; _gridPers.MultiSelect = false; _gridPers.AutoGenerateColumns = false; _gridPers.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            _gridPers.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "AdSoyad", HeaderText = "Ad Soyad", FillWeight = 20 });
            _gridPers.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Bolum", HeaderText = "Bölüm", FillWeight = 15 });
            _gridPers.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Gorev", HeaderText = "Görev", FillWeight = 15 });
            _gridPers.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Firma", HeaderText = "Firma", FillWeight = 15 });
            _gridPers.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "KartNo", HeaderText = "Kart No", FillWeight = 10 });
            _gridPers.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "SicilNo", HeaderText = "Sicil No", FillWeight = 10 });
            _gridPers.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Dahili", HeaderText = "Dahili", FillWeight = 10 });
            _gridPers.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "CepTelefonu", HeaderText = "Cep", FillWeight = 15 });
            _gridPers.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Mail", HeaderText = "E-Posta", FillWeight = 20 });

            _gridPersItems.Left = _gridPers.Right + 10; _gridPersItems.Top = _grpPers.Bottom + 10; _gridPersItems.Width = (_tabPersonels.ClientSize.Width - 30) / 2; _gridPersItems.Height = _tabPersonels.ClientSize.Height - _gridPersItems.Top - 10; _gridPersItems.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Right;
            _gridPersItems.AllowUserToAddRows = false; _gridPersItems.ReadOnly = true; _gridPersItems.RowHeadersVisible = false; _gridPersItems.SelectionMode = DataGridViewSelectionMode.FullRowSelect; _gridPersItems.MultiSelect = false; _gridPersItems.AutoGenerateColumns = false; _gridPersItems.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            _gridPersItems.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Category", HeaderText = "Kategori", FillWeight = 20 });
            _gridPersItems.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Brand", HeaderText = "Marka", FillWeight = 20 });
            _gridPersItems.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "Model", HeaderText = "Model", FillWeight = 30 });
            _gridPersItems.Columns.Add(new DataGridViewTextBoxColumn { DataPropertyName = "SerialNo", HeaderText = "Seri No", FillWeight = 30 });

            _gridPers.SelectionChanged += (_, __) => UpdatePersonnelButtons();
            
            _gridPers.CellDoubleClick += (_, e) => {
                if (e.RowIndex < 0) return;
                var row = _gridPers.Rows[e.RowIndex].DataBoundItem as Models.PersonnelRow;
                if (row != null && row.IsHeader) ToggleCollapseDepartment(row.BolumKey);
            };

            _tabPersonels.Controls.AddRange(new Control[] { _grpPers, _gridPers, _gridPersItems });
        }

        private void BuildSettingsTab()
        {
            _tabSettings.Controls.Clear();

            // ---- Zimmet Group ----
            _grpSettings.Text = "Zimmet Ayarları"; _grpSettings.Left = 10; _grpSettings.Top = 10; _grpSettings.Width = 630; _grpSettings.Height = 150; _grpSettings.Anchor = AnchorStyles.Top | AnchorStyles.Left;

            int y = 30;
            var lblZimmet = new Label { Text = "Zimmet Şablonu (.xls):", AutoSize = true, Left = 20, Top = y };
            _txtZimmetTemplate.Left = 180; _txtZimmetTemplate.Top = y; _txtZimmetTemplate.Width = 340; _txtZimmetTemplate.ReadOnly = true; _txtZimmetTemplate.Text = _appSettings.ZimmetTemplatePath;
            _btnBrowseZimmet.Text = "Seç"; _btnBrowseZimmet.Left = 528; _btnBrowseZimmet.Top = y; _btnBrowseZimmet.Width = 80; _btnBrowseZimmet.Height = 25;

            y += 35;
            var lblZimmetOut = new Label { Text = "Zimmet Kayıt Klasörü:", AutoSize = true, Left = 20, Top = y };
            _txtZimmetOutputFolder.Left = 180; _txtZimmetOutputFolder.Top = y; _txtZimmetOutputFolder.Width = 340; _txtZimmetOutputFolder.ReadOnly = true; _txtZimmetOutputFolder.Text = _appSettings.ZimmetOutputFolder;
            _btnBrowseZimmetOutput.Text = "Seç"; _btnBrowseZimmetOutput.Left = 528; _btnBrowseZimmetOutput.Top = y; _btnBrowseZimmetOutput.Width = 80; _btnBrowseZimmetOutput.Height = 25;
            
            y += 45;
            _btnSettingsSave.Text = "Zimmet Ayarlarını Kaydet"; _btnSettingsSave.Left = 180; _btnSettingsSave.Top = y; _btnSettingsSave.Width = 160; _btnSettingsSave.Height = 30;

            _btnSettingsSave.Click -= delegate { };
            _btnSettingsSave.Click += (_, __) => {
                SaveSettings();
                MessageBox.Show("Zimmet ayarları kaydedildi.", "Bilgi", MessageBoxButtons.OK, MessageBoxIcon.Information);
            };

            _btnBrowseZimmet.Click -= delegate { };
            _btnBrowseZimmet.Click += (_, __) => {
                using var ofd = new OpenFileDialog();
                ofd.Filter = "Excel Dosyaları|*.xls;*.xlsx";
                ofd.Title = "Zimmet Şablonu Seçin";
                if (ofd.ShowDialog() == DialogResult.OK)
                {
                    _appSettings.ZimmetTemplatePath = ofd.FileName;
                    _txtZimmetTemplate.Text = ofd.FileName;
                    SaveSettings();
                }
            };

            _btnBrowseZimmetOutput.Click -= delegate { };
            _btnBrowseZimmetOutput.Click += (_, __) => {
                using var fbd = new FolderBrowserDialog();
                fbd.Description = "Zimmet Formlarının Kaydedileceği Klasör";
                if (!string.IsNullOrWhiteSpace(_appSettings.ZimmetOutputFolder))
                    fbd.SelectedPath = _appSettings.ZimmetOutputFolder;
                if (fbd.ShowDialog() == DialogResult.OK)
                {
                    _appSettings.ZimmetOutputFolder = fbd.SelectedPath;
                    _txtZimmetOutputFolder.Text = fbd.SelectedPath;
                    SaveSettings();
                }
            };

            _grpSettings.Controls.AddRange(new Control[] { lblZimmet, _txtZimmetTemplate, _btnBrowseZimmet, lblZimmetOut, _txtZimmetOutputFolder, _btnBrowseZimmetOutput, _btnSettingsSave });

            // ---- Email Group ----
            _grpEmailSettings.Text = "E-Posta (SMTP) Ayarları"; _grpEmailSettings.Left = 10; _grpEmailSettings.Top = _grpSettings.Bottom + 15; _grpEmailSettings.Width = 630; _grpEmailSettings.Height = 280; _grpEmailSettings.Anchor = AnchorStyles.Top | AnchorStyles.Left;

            int ey = 30;
            var eLblSmtp = new Label { Text = "SMTP Sunucu:", AutoSize = true, Left = 20, Top = ey };
            _txtSmtpServer.Left = 180; _txtSmtpServer.Top = ey; _txtSmtpServer.Width = 250; _txtSmtpServer.Text = _appSettings.SmtpServer;

            ey += 35;
            var eLblPort = new Label { Text = "Port:", AutoSize = true, Left = 20, Top = ey };
            _numSmtpPort.Left = 180; _numSmtpPort.Top = ey; _numSmtpPort.Width = 80; _numSmtpPort.Minimum = 1; _numSmtpPort.Maximum = 65535; _numSmtpPort.Value = _appSettings.SmtpPort;
            _chkSmtpSsl.Text = "SSL/TLS Kullan"; _chkSmtpSsl.Left = 270; _chkSmtpSsl.Top = ey + 2; _chkSmtpSsl.AutoSize = true; _chkSmtpSsl.Checked = _appSettings.SmtpEnableSsl;

            ey += 35;
            var eLblUser = new Label { Text = "Kullanıcı Adı:", AutoSize = true, Left = 20, Top = ey };
            _txtSmtpUser.Left = 180; _txtSmtpUser.Top = ey; _txtSmtpUser.Width = 250; _txtSmtpUser.Text = _appSettings.SmtpUser;

            ey += 35;
            var eLblPass = new Label { Text = "Şifre:", AutoSize = true, Left = 20, Top = ey };
            _txtSmtpPass.Left = 180; _txtSmtpPass.Top = ey; _txtSmtpPass.Width = 250; _txtSmtpPass.PasswordChar = '•'; _txtSmtpPass.Text = _appSettings.SmtpPass;

            ey += 35;
            var eLblTo = new Label { Text = "Alıcı (To):", AutoSize = true, Left = 20, Top = ey };
            _txtSmtpTo.Left = 180; _txtSmtpTo.Top = ey; _txtSmtpTo.Width = 250; _txtSmtpTo.Text = _appSettings.SmtpTo;

            ey += 45;
            _btnSmtpSave.Text = "E-Posta Kaydet"; _btnSmtpSave.Left = 180; _btnSmtpSave.Top = ey; _btnSmtpSave.Width = 130; _btnSmtpSave.Height = 30;
            _btnSmtpTest.Text = "Test Gönder"; _btnSmtpTest.Left = 320; _btnSmtpTest.Top = ey; _btnSmtpTest.Width = 110; _btnSmtpTest.Height = 30;

            _btnSmtpSave.Click -= delegate { };
            _btnSmtpSave.Click += (_, __) => {
                _appSettings.SmtpServer = _txtSmtpServer.Text.Trim();
                _appSettings.SmtpPort = (int)_numSmtpPort.Value;
                _appSettings.SmtpUser = _txtSmtpUser.Text.Trim();
                _appSettings.SmtpPass = _txtSmtpPass.Text;
                _appSettings.SmtpTo = _txtSmtpTo.Text.Trim();
                _appSettings.SmtpEnableSsl = _chkSmtpSsl.Checked;
                SaveSettings();
                MessageBox.Show("E-Posta ayarları kaydedildi.", "Bilgi", MessageBoxButtons.OK, MessageBoxIcon.Information);
            };

            _btnSmtpTest.Click -= delegate { };
            _btnSmtpTest.Click += (_, __) => SendTestEmail();

            _grpEmailSettings.Controls.AddRange(new Control[] { eLblSmtp, _txtSmtpServer, eLblPort, _numSmtpPort, _chkSmtpSsl, eLblUser, _txtSmtpUser, eLblPass, _txtSmtpPass, eLblTo, _txtSmtpTo, _btnSmtpSave, _btnSmtpTest });

            _tabSettings.Controls.AddRange(new Control[] { _grpSettings, _grpEmailSettings });
        }
        private void BuildCardsTab()
        {
            _tabCards.Controls.Clear();
            var pnl = new Panel { Dock = DockStyle.Fill, Padding = new Padding(20) };
            _tabCards.Controls.Add(pnl);

            var lblTitle = new Label { Text = "Kart Numarası Dönüştürücü", AutoSize = true, Font = new Font(Font.FontFamily, 14, FontStyle.Bold), Top = 20, Left = 20 };
            pnl.Controls.Add(lblTitle);

            var lblDesc = new Label { Text = "Bu ekrandan Meyer, Yazıcı ve Unilever sistemlerindeki kart numarası karşılıklarını dinamik olarak hesaplayabilirsiniz.\nHerhangi birine değer girmeniz yeterlidir.", AutoSize = true, Top = 50, Left = 22, ForeColor = Color.DimGray };
            pnl.Controls.Add(lblDesc);

            int y = 100;
            
            var lblMeyer = new Label { Text = "Meyer (Decimal):", AutoSize = true, Top = y, Left = 20, Font = new Font(Font.FontFamily, 9, FontStyle.Bold) };
            _txtCardMeyer.Top = y - 4; _txtCardMeyer.Left = 180; _txtCardMeyer.Width = 300;
            _txtCardMeyer.Font = new Font(Font.FontFamily, 10);
            y += 45;

            var lblYazici = new Label { Text = "Yazıcı (Hex 32-bit):", AutoSize = true, Top = y, Left = 20, Font = new Font(Font.FontFamily, 9, FontStyle.Bold) };
            _txtCardYazici.Top = y - 4; _txtCardYazici.Left = 180; _txtCardYazici.Width = 300;
            _txtCardYazici.Font = new Font(Font.FontFamily, 10);
            y += 45;

            var lblUnilever = new Label { Text = "Unilever (Byte-Swap):", AutoSize = true, Top = y, Left = 20, Font = new Font(Font.FontFamily, 9, FontStyle.Bold) };
            _txtCardUnilever.Top = y - 4; _txtCardUnilever.Left = 180; _txtCardUnilever.Width = 300;
            _txtCardUnilever.Font = new Font(Font.FontFamily, 10);
            y += 45;

            var lblMacgal = new Label { Text = "Macgal:", AutoSize = true, Top = y, Left = 20, Font = new Font(Font.FontFamily, 9, FontStyle.Bold) };
            _txtCardMacgal.Top = y - 4; _txtCardMacgal.Left = 180; _txtCardMacgal.Width = 300;
            _txtCardMacgal.Font = new Font(Font.FontFamily, 10);
            y += 60;

            _lblCardPersonnelInfo.AutoSize = true;
            _lblCardPersonnelInfo.Top = y;
            _lblCardPersonnelInfo.Left = 180;
            _lblCardPersonnelInfo.Font = new Font(Font.FontFamily, 10, FontStyle.Bold);
            _lblCardPersonnelInfo.Text = "Kart Numarası Girin";
            _lblCardPersonnelInfo.ForeColor = Color.DimGray;
            y += 30;

            _btnCardGoPersonnel.Text = "Personel Bilgisine Git";
            _btnCardGoPersonnel.Top = y; _btnCardGoPersonnel.Left = 180;
            _btnCardGoPersonnel.Width = 140; _btnCardGoPersonnel.Height = 30;
            _btnCardGoPersonnel.Visible = false;
            
            _btnCardAddPersonnel.Text = "Yeni Personel Ekle";
            _btnCardAddPersonnel.Top = y; _btnCardAddPersonnel.Left = 180;
            _btnCardAddPersonnel.Width = 140; _btnCardAddPersonnel.Height = 30;
            _btnCardAddPersonnel.Visible = false;

            _txtCardMeyer.TextChanged += TxtCardMeyer_TextChanged;
            _txtCardYazici.TextChanged += TxtCardYazici_TextChanged;
            _txtCardUnilever.TextChanged += TxtCardUnilever_TextChanged;
            _txtCardMacgal.TextChanged += TxtCardMacgal_TextChanged;

            _btnCardGoPersonnel.Click += BtnCardGoPersonnel_Click;
            _btnCardAddPersonnel.Click += BtnCardAddPersonnel_Click;

            pnl.Controls.AddRange(new Control[] { lblMeyer, _txtCardMeyer, lblYazici, _txtCardYazici, lblUnilever, _txtCardUnilever, lblMacgal, _txtCardMacgal, _lblCardPersonnelInfo, _btnCardGoPersonnel, _btnCardAddPersonnel });
        }
    }
}
