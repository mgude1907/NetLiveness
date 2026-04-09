using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text.Json;
using System.Threading.Tasks;

namespace NetLiveness
{
    public partial class Form1
    {
        // ========================= NETWORK LOGIC =========================

        private async Task RefreshAllAsync()
        {
            if (_tickInProgress > 0) return;
            _tickInProgress = 1;

            try
            {
                var tasks = _terminals.Select(t => PingTerminalAsync(t)).ToArray();
                await Task.WhenAll(tasks);

                UpdatePieChart();
                UpdateBarChart();
                UpdateRttChart();

                _gridTerm.Invalidate();
                UpdateDashboard();
            }
            finally
            {
                _tickInProgress = 0;
            }
        }

        private async Task PingTerminalAsync(Models.Terminal t)
        {
            if (t.Maintenance) return; // Bakımdaki cihazı es geç

            try
            {
                using var p = new Ping();
                var reply = await p.SendPingAsync(t.Host, 2000);
                
                t.LastCheck = DateTime.Now;
                if (reply.Status == IPStatus.Success)
                {
                    t.Status = "UP";
                    t.RttMs = reply.RoundtripTime;
                }
                else
                {
                    t.Status = "DOWN";
                    t.RttMs = 0;
                }
            }
            catch
            {
                t.Status = "DOWN";
                t.RttMs = 0;
                t.LastCheck = DateTime.Now;
            }

            lock (_rttHistory)
            {
                if (!_rttHistory.ContainsKey(t.Host))
                    _rttHistory[t.Host] = new System.Collections.Generic.Queue<(DateTime, long)>();

                var q = _rttHistory[t.Host];
                q.Enqueue((DateTime.Now, t.RttMs));
                while (q.Count > RTT_HISTORY_SIZE) q.Dequeue();
            }
        }

        // ========================= SSL LOGIC =========================

        private async Task CheckAllSslAsync()
        {
            var tasks = _sslItems.Select(s => CheckSslExpiryAsync(s)).ToArray();
            await Task.WhenAll(tasks);
            UpdateSslChart();
            _gridSsl.Invalidate();
        }

        private async Task CheckSslExpiryAsync(Models.SslItem item)
        {
            try
            {
                using var client = new TcpClient();
                await client.ConnectAsync(item.Domain, 443);
                using var stream = new System.Net.Security.SslStream(client.GetStream(), false, (sender, cert, chain, errors) => {
                    item.ExpiryDate = DateTime.Parse(cert.GetExpirationDateString());
                    return true;
                });
                await stream.AuthenticateAsClientAsync(item.Domain);

                item.DaysLeft = (int)(item.ExpiryDate.Date - DateTime.Today).TotalDays;
                item.Status = item.DaysLeft > 0 ? "VALID" : "EXPIRED";
            }
            catch
            {
                // Hata veya bağlantı kopması durumunda son tarihi kabul et, sadece statusu değiştir
                item.Status = "ERROR";
            }
        }

        // ========================= UTILS =========================

        private void LogAction(string action, string details)
        {
            _logs.Add(new Models.AuditLogEntry { Action = action, Details = details, Operator = ActorName() });
            RefreshLogGridFiltered();
        }

        private void LoadModelCatalog()
        {
            _modelCatalog.Clear();
            foreach (var item in _stockItems)
            {
                if (!string.IsNullOrWhiteSpace(item.Model))
                {
                    string cat = item.Category ?? "";
                    if (!_modelCatalog.ContainsKey(cat)) _modelCatalog[cat] = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    _modelCatalog[cat].Add(item.Model);
                }
            }
            foreach (var item in _invItems)
            {
                if (!string.IsNullOrWhiteSpace(item.Model))
                {
                    string cat = item.Category ?? "";
                    if (!_modelCatalog.ContainsKey(cat)) _modelCatalog[cat] = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    _modelCatalog[cat].Add(item.Model);
                }
            }

            // Global autocompletes listesine ekle
            var ac = new AutoCompleteStringCollection();
            foreach (var category in _modelCatalog.Values)
            {
                foreach (var model in category) ac.Add(model);
            }
            
            _txtInvModel.AutoCompleteCustomSource = ac;
            _txtStockModel.AutoCompleteCustomSource = ac;
        }

        private void UpdateModelCatalog(string model)
        {
            if (!string.IsNullOrWhiteSpace(model))
            {
                var ac = _txtInvModel.AutoCompleteCustomSource;
                if (!ac.Contains(model))
                {
                    ac.Add(model);
                }
                _txtStockModel.AutoCompleteCustomSource = ac;
            }
        }

        // Form1'de tanımlanmış basit event çağrıları
        private void UpdateDashboard()
        {
            int total = _terminals.Count;
            int up = _terminals.Count(t => t.Status == "UP");
            int down = _terminals.Count(t => t.Status == "DOWN");
            int unk = total - up - down;
            
            _lblTotalVal.Text = total.ToString();
            _lblUpVal.Text = up.ToString();
            _lblDownVal.Text = down.ToString();
            _lblUnkVal.Text = unk.ToString();
            _lblRunningVal.Text = _running ? "YES" : "NO";
            
            var now = DateTime.Now;
            _lblLastVal.Text = now.ToString("HH:mm:ss");

            long sumRtt = 0;
            int countRtt = 0;
            var upTerms = _terminals.Where(t => t.Status == "UP" && t.RttMs > 0).ToList();
            if (upTerms.Count > 0)
            {
                sumRtt = upTerms.Sum(t => t.RttMs);
                countRtt = upTerms.Count;
            }
            _lblAvgRttVal.Text = countRtt > 0 ? (sumRtt / countRtt).ToString() : "-";
            
            var topDown = _terminals.Where(t => t.Status == "DOWN")
                                    .GroupBy(t => t.Company)
                                    .OrderByDescending(g => g.Count())
                                    .FirstOrDefault();
            _lblTopDownCompanyVal.Text = topDown != null ? $"{topDown.Key} ({topDown.Count()})" : "-";

            UpdateSummaryList();
            UpdatePieChart();
            UpdateBarChart();
            UpdateSslChart();
            UpdateRttChart();
        }

        private void UpdateSummaryList()
        {
            _lvSummary.Items.Clear();
            var groups = _terminals.GroupBy(t => new { t.Company, t.DeviceType }).OrderBy(g => g.Key.Company).ThenBy(g => g.Key.DeviceType).ToList();
            foreach (var g in groups)
            {
                int tot = g.Count();
                int u = g.Count(x => x.Status == "UP");
                int d = g.Count(x => x.Status == "DOWN");
                var item = new System.Windows.Forms.ListViewItem(new[] { g.Key.Company, g.Key.DeviceType, tot.ToString(), u.ToString(), d.ToString() });
                
                item.UseItemStyleForSubItems = false;
                // Firma
                item.SubItems[0].Font = new Font(_lvSummary.Font, FontStyle.Bold);
                item.SubItems[0].ForeColor = Color.Black;
                // Total
                item.SubItems[2].Font = new Font(_lvSummary.Font, FontStyle.Bold);
                item.SubItems[2].ForeColor = Color.Black;
                // UP
                item.SubItems[3].ForeColor = u > 0 ? Color.Green : Color.Black;
                // DOWN
                item.SubItems[4].ForeColor = d > 0 ? Color.Red : Color.Black;

                _lvSummary.Items.Add(item);
            }
        }

        private void RebuildTermGrid()
        {
            var newList = new System.Collections.Generic.List<Models.GridRow>();
            var groups = _terminals.GroupBy(t => t.Company).OrderBy(g => g.Key);
            foreach (var g in groups)
            {
                bool collapsed = !_collapsedByCompany.TryGetValue(g.Key, out bool c) || c;
                newList.Add(new Models.GridRow { CompanyKey = g.Key, IsHeader = true, HeaderText = collapsed ? $"[+] {g.Key} ({g.Count()})" : $"[-] {g.Key} ({g.Count()})" });
                
                if (!collapsed)
                {
                    foreach (var t in g.OrderBy(x => x.Name))
                        newList.Add(new Models.GridRow { CompanyKey = g.Key, IsHeader = false, Terminal = t });
                }
            }
            _termRows = newList;
            _gridTerm.DataSource = null;
            _gridTerm.DataSource = new System.ComponentModel.BindingList<Models.GridRow>(_termRows);
        }

        private void RefreshSslGrid()
        {
            _sslRows = _sslItems.Select(x => new Models.SslRow(x)).ToList();
            _gridSsl.DataSource = null;
            _gridSsl.DataSource = new System.ComponentModel.BindingList<Models.SslRow>(_sslRows);
        }

        private void RefreshInvGrid()
        {
            var newList = new System.Collections.Generic.List<Models.InventoryRow>();
            var s = _txtInvSearch.Text.Trim().ToLower();
            
            var filteredItems = _invItems.Where(x => string.IsNullOrWhiteSpace(s) || 
                                                     (x.SerialNo?.ToLower().Contains(s) == true) || 
                                                     (x.AssignedTo?.ToLower().Contains(s) == true)).ToList();

            if (_rbInvInfra.Checked)
                filteredItems = filteredItems.Where(x => x.EnvanterTuru == "Altyapı Envanteri").ToList();
            else if (_rbInvPers.Checked)
                filteredItems = filteredItems.Where(x => x.EnvanterTuru == "Personel Envanteri").ToList();

            var groups = filteredItems.GroupBy(t => t.AssignedTo).OrderBy(g => g.Key);
            foreach (var g in groups)
            {
                string key = string.IsNullOrWhiteSpace(g.Key) ? "Atanmayan Ürünler" : g.Key;
                bool collapsed = !_collapsedByAssignedTo.TryGetValue(key, out bool c) || c;
                
                // If searching, force expand group
                if (!string.IsNullOrWhiteSpace(s)) collapsed = false;
                
                newList.Add(new Models.InventoryRow { AssignedToKey = key, IsHeader = true, HeaderText = collapsed ? $"[+] {key} ({g.Count()})" : $"[-] {key} ({g.Count()})" });
                
                if (!collapsed)
                {
                    foreach (var t in g.OrderBy(x => x.Model))
                        newList.Add(new Models.InventoryRow(t));
                }
            }
            _invRows = newList;
            _gridInv.DataSource = null;
            _gridInv.DataSource = new System.ComponentModel.BindingList<Models.InventoryRow>(_invRows);
            
            RefreshInvSummaryGrid(filteredItems);
        }

        private void RefreshInvSummaryGrid(System.Collections.Generic.List<Models.InventoryItem> items)
        {
            var summary = items
                .Where(x => !string.IsNullOrWhiteSpace(x.Brand) || !string.IsNullOrWhiteSpace(x.Model))
                .GroupBy(x => new { x.Brand, x.Model })
                .Select(g => new { Brand = g.Key.Brand, Model = g.Key.Model, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToList();

            _gridInvSummary.DataSource = null;
            _gridInvSummary.DataSource = summary;
        }

        private void RefreshStockGrid()
        {
            _stockRows = _stockItems.Select(x => new Models.StockRow(x)).ToList();
            _gridStock.DataSource = null;
            _gridStock.DataSource = new System.ComponentModel.BindingList<Models.StockRow>(_stockRows);
        }

        private void RefreshLogGridFiltered()
        {
            _logRows = _logs.OrderByDescending(x => x.Date).Take(100).Select(x => new Models.AuditLogRow(x)).ToList();
            _gridLogs.DataSource = null;
            _gridLogs.DataSource = new System.ComponentModel.BindingList<Models.AuditLogRow>(_logRows);
        }

        private void PopulatePersonnelCombos()
        {
            var names = _personnels.Select(p => p.AdSoyad).OrderBy(n => n).ToArray();
            
            string selInv = _cmbInvAssignedTo.SelectedItem?.ToString() ?? _cmbInvAssignedTo.Text;
            _cmbInvAssignedTo.Items.Clear();
            _cmbInvAssignedTo.Items.AddRange(names);
            if (!string.IsNullOrEmpty(selInv) && _cmbInvAssignedTo.Items.Contains(selInv)) _cmbInvAssignedTo.SelectedItem = selInv;

            string selStock = _cmbStockAssignTo.SelectedItem?.ToString() ?? _cmbStockAssignTo.Text;
            _cmbStockAssignTo.Items.Clear();
            _cmbStockAssignTo.Items.AddRange(names);
            if (!string.IsNullOrEmpty(selStock) && _cmbStockAssignTo.Items.Contains(selStock)) _cmbStockAssignTo.SelectedItem = selStock;
        }

        private void RefreshPersonnelGrid()
        {
            var newList = new System.Collections.Generic.List<Models.PersonnelRow>();
            var s = _txtPersSearch.Text.Trim().ToLower();
            var filteredItems = _personnels.Where(x => string.IsNullOrWhiteSpace(s) || 
                                                       (x.Ad?.ToLower().Contains(s) == true) || 
                                                       (x.Soyad?.ToLower().Contains(s) == true) || 
                                                       (x.KartNo?.ToLower().Contains(s) == true) ||
                                                       (x.AdSoyad?.ToLower().Contains(s) == true)).ToList();
                                                       
            var groups = filteredItems.GroupBy(t => t.Bolum).OrderBy(g => g.Key);
            foreach (var g in groups)
            {
                string key = string.IsNullOrWhiteSpace(g.Key) ? "Diğer" : g.Key;
                bool collapsed = !_collapsedByDepartment.TryGetValue(key, out bool c) || c;
                
                // If searching, force expand group
                if (!string.IsNullOrWhiteSpace(s)) collapsed = false;

                newList.Add(new Models.PersonnelRow { BolumKey = key, IsHeader = true, HeaderText = collapsed ? $"[+] {key} ({g.Count()})" : $"[-] {key} ({g.Count()})" });
                
                if (!collapsed)
                {
                    foreach (var t in g.OrderBy(x => x.Ad).ThenBy(x => x.Soyad))
                        newList.Add(new Models.PersonnelRow(t));
                }
            }
            _personnelRows = newList;
            _gridPers.DataSource = null;
            _gridPers.DataSource = new System.ComponentModel.BindingList<Models.PersonnelRow>(_personnelRows);
            PopulatePersonnelCombos();
        }

        private void UpdateTerminalButtons()
        {
            bool hasSelection = !_gridTerm.Rows.Count.Equals(0) && _gridTerm.CurrentRow != null && _gridTerm.CurrentRow.Index >= 0;
            _btnEdit.Enabled = _btnRemove.Enabled = _btnToggleMaint.Enabled = hasSelection;
        }

        private void UpdateInvButtons()
        {
            // placeholder
        }

        private void UpdateStockButtons()
        {
            // placeholder
        }
        
        private void UpdatePersonnelButtons()
        {
            bool hasSelection = !_gridPers.Rows.Count.Equals(0) && _gridPers.CurrentRow != null && _gridPers.CurrentRow.Index >= 0;
            _btnPersEdit.Enabled = _btnPersRemove.Enabled = hasSelection;

            if (hasSelection)
            {
                var row = _gridPers.CurrentRow.DataBoundItem as Models.PersonnelRow;
                if (row != null && row.Item != null)
                {
                    var items = _invItems.Where(i => i.AssignedTo == row.AdSoyad).ToList();
                    _gridPersItems.DataSource = null;
                    _gridPersItems.DataSource = new System.ComponentModel.BindingList<Models.InventoryItem>(items);
                }
            }
            else
            {
                _gridPersItems.DataSource = null;
            }
        }
        
        private void UpdatePieChart()
        {
            if (_chartPie.Series.Count == 0) return;
            var s = _chartPie.Series[0];
            s.Points.Clear();

            int up = _terminals.Count(t => t.Status == "UP");
            int down = _terminals.Count(t => t.Status == "DOWN");
            int unk = _terminals.Count - up - down;

            if (up > 0) { int idx = s.Points.AddY(up); var p = s.Points[idx]; p.Color = System.Drawing.Color.FromArgb(25, 140, 70); p.LegendText = "UP"; p.Label = up.ToString(); }
            if (down > 0) { int idx = s.Points.AddY(down); var p = s.Points[idx]; p.Color = System.Drawing.Color.FromArgb(180, 45, 45); p.LegendText = "DOWN"; p.Label = down.ToString(); }
            if (unk > 0) { int idx = s.Points.AddY(unk); var p = s.Points[idx]; p.Color = System.Drawing.Color.Gray; p.LegendText = "UNK"; p.Label = unk.ToString(); }
        }

        private void UpdateBarChart()
        {
            if (_chartBar.Series.Count < 2) return;
            var sUp = _chartBar.Series["UP"];
            var sDown = _chartBar.Series["DOWN"];
            sUp.Points.Clear(); sDown.Points.Clear();

            var groups = _terminals.GroupBy(t => t.Company).Select(g => new
            {
                Company = g.Key,
                UpCount = g.Count(x => x.Status == "UP"),
                DownCount = g.Count(x => x.Status == "DOWN")
            }).OrderBy(x => x.Company).ToList();

            foreach (var g in groups)
            {
                sUp.Points.AddXY(g.Company, g.UpCount);
                if (g.DownCount > 0)
                    sDown.Points.AddXY(g.Company, g.DownCount);
                else
                    sDown.Points.AddXY(g.Company, 0);
            }
        }

        private void UpdateSslChart()
        {
            if (_chartSsl.Series.Count == 0) return;
            var s = _chartSsl.Series[0];
            s.Points.Clear();

            var sorted = _sslItems.OrderBy(x => x.DaysLeft).Take(10).ToList();
            for (int i = sorted.Count - 1; i >= 0; i--)
            {
                var item = sorted[i];
                int idx = s.Points.AddXY(item.Domain, Math.Max(0, item.DaysLeft));
                var p = s.Points[idx];
                if (item.DaysLeft <= 30) p.Color = System.Drawing.Color.FromArgb(180, 45, 45);
                else if (item.DaysLeft <= 60) p.Color = System.Drawing.Color.DarkOrange;
                else p.Color = System.Drawing.Color.FromArgb(25, 140, 70);
            }
        }

        private void UpdateRttChart()
        {
            if (_chartRtt.Series.Count == 0) return;
            var s = _chartRtt.Series[0];
            s.Points.Clear();

            lock (_rttHistory)
            {
                int maxLen = 0;
                foreach (var q in _rttHistory.Values) if (q.Count > maxLen) maxLen = q.Count;

                if (maxLen > 0)
                {
                    double[] avgs = new double[maxLen];
                    int[] counts = new int[maxLen];

                    foreach (var q in _rttHistory.Values)
                    {
                        var arr = q.ToArray();
                        int offset = maxLen - arr.Length;
                        for (int i = 0; i < arr.Length; i++)
                        {
                            avgs[offset + i] += arr[i].ms;
                            counts[offset + i]++;
                        }
                    }

                    for (int i = 0; i < maxLen; i++)
                    {
                        double val = counts[i] > 0 ? avgs[i] / counts[i] : 0;
                        s.Points.AddY(val);
                    }
                }
            }
        }
        private void ApplyModelAutoComplete() { }
    }
}
