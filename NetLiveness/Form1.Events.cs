using System;
using System.Linq;
using System.Windows.Forms;
using NetLiveness.Models;
using System.IO;
using NPOI.SS.UserModel;
using System.Net.Mail;

namespace NetLiveness
{
    public partial class Form1
    {
        // ======================= TIMER & APP STATUS =======================

        private void TryLoadLogo()
        {
            try { _logo.Image = System.Drawing.Image.FromFile(System.IO.Path.Combine(Application.StartupPath, "logo.png")); }
            catch { }
        }

        private void Toggle()
        {
            if (_running)
            {
                _timer.Stop();
                _running = false;
                _btnStartStop.Text = "Start";
                _lblStatus.Text = "Stopped";
            }
            else
            {
                _timer.Interval = (int)_intervalMs.Value;
                _timer.Start();
                _running = true;
                _btnStartStop.Text = "Stop";
                _lblStatus.Text = "Running";
                // Immediate trigger
                _ = RefreshAllAsync();
            }
            UpdateDashboard();
        }


        private void SendTestEmail()
        {
            if (string.IsNullOrWhiteSpace(_appSettings.SmtpUser) || string.IsNullOrWhiteSpace(_appSettings.SmtpServer))
            {
                MessageBox.Show("Lütfen önce e-posta ayarlarını doldurun.", "Hata", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }
            try
            {
                using var smtp = new SmtpClient(_appSettings.SmtpServer, _appSettings.SmtpPort)
                {
                    EnableSsl = _appSettings.SmtpEnableSsl,
                    Credentials = new System.Net.NetworkCredential(_appSettings.SmtpUser, _appSettings.SmtpPass),
                    Timeout = 10000
                };
                var msg = new MailMessage(_appSettings.SmtpUser, string.IsNullOrWhiteSpace(_appSettings.SmtpTo) ? _appSettings.SmtpUser : _appSettings.SmtpTo)
                {
                    Subject = "NetLiveness - Test E-Postası",
                    Body = "Bu, NetLiveness uygulamasından gönderilmiş test e-postasıdır."
                };
                smtp.Send(msg);
                MessageBox.Show("Test e-postası başarıyla gönderildi!", "Başarılı", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"E-posta gönderilemedi: {ex.Message}", "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        // ======================= TERMINAL CRUD =======================

        private void AddTerminal()
        {
            if (string.IsNullOrWhiteSpace(_txtName.Text) || string.IsNullOrWhiteSpace(_txtHost.Text))
            {
                MessageBox.Show("İsim ve IP/DNS alanları zorunludur.", "Hata", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var t = new Terminal
            {
                Name = _txtName.Text.Trim(),
                Host = _txtHost.Text.Trim(),
                Company = _cmbCompany.SelectedItem?.ToString() ?? "Diğer",
                DeviceType = _cmbType.SelectedItem?.ToString() ?? "Bilinmeyen"
            };

            _terminals.Add(t);
            RebuildTermGrid();
            SaveTerminals();
            UpdateDashboard();
            LogAction("TERM_ADD", $"{t.Name} ({t.Host}) Eklendi.");
            
            _txtName.Clear(); _txtHost.Clear();
        }

        private void BeginEditTerminalSelected()
        {
            if (_gridTerm.CurrentRow == null || _gridTerm.CurrentRow.Index < 0) return;
            var row = _gridTerm.CurrentRow.DataBoundItem as GridRow;
            if (row == null || row.IsHeader || row.Terminal == null) return;

            _editingTerminal = row.Terminal;
            _txtName.Text = _editingTerminal.Name;
            _txtHost.Text = _editingTerminal.Host;
            var cmpObj = _cmbCompany.Items.Cast<object>().FirstOrDefault(c => c.ToString() == _editingTerminal.Company);
            if (cmpObj != null) _cmbCompany.SelectedItem = cmpObj;
            var typObj = _cmbType.Items.Cast<object>().FirstOrDefault(c => c.ToString() == _editingTerminal.DeviceType);
            if (typObj != null) _cmbType.SelectedItem = typObj;

            _lblMode.Text = "Mode: EDIT";
            _btnAdd.Enabled = _btnRemove.Enabled = _btnToggleMaint.Enabled = false;
            _btnSave.Enabled = _btnCancel.Enabled = true;
            _gridTerm.Enabled = false;
        }

        private void SaveTerminalEdit()
        {
            if (_editingTerminal == null) return;

            _editingTerminal.Name = _txtName.Text.Trim();
            _editingTerminal.Host = _txtHost.Text.Trim();
            _editingTerminal.Company = _cmbCompany.SelectedItem?.ToString() ?? "Diğer";
            _editingTerminal.DeviceType = _cmbType.SelectedItem?.ToString() ?? "Bilinmeyen";

            RebuildTermGrid();
            SaveTerminals();
            UpdateDashboard();
            LogAction("TERM_EDIT", $"{_editingTerminal.Name} Düzenlendi.");

            CancelTerminalEdit();
        }

        private void CancelTerminalEdit()
        {
            _editingTerminal = null;
            _txtName.Clear(); _txtHost.Clear();
            _lblMode.Text = "Mode: ADD";
            _btnAdd.Enabled = _btnRemove.Enabled = _btnToggleMaint.Enabled = true;
            _btnSave.Enabled = _btnCancel.Enabled = false;
            _gridTerm.Enabled = true;
            UpdateTerminalButtons();
        }

        private void RemoveTerminalSelected()
        {
            if (_gridTerm.CurrentRow == null || _gridTerm.CurrentRow.Index < 0) return;
            var row = _gridTerm.CurrentRow.DataBoundItem as GridRow;
            if (row == null || row.IsHeader || row.Terminal == null) return;

            if (MessageBox.Show($"{row.Terminal.Name} silinecek. Emin misiniz?", "Onay", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
            {
                _terminals.Remove(row.Terminal);
                RebuildTermGrid();
                SaveTerminals();
                UpdateDashboard();
                LogAction("TERM_DEL", $"{row.Terminal.Name} ({row.Terminal.Host}) Silindi.");
            }
        }

        private void ToggleCollapse(string key)
        {
            if (_collapsedByCompany.ContainsKey(key))
                _collapsedByCompany[key] = !_collapsedByCompany[key];
            else
                _collapsedByCompany[key] = false;
            
            RebuildTermGrid();
        }

        private void ToggleCollapseDepartment(string key)
        {
            if (_collapsedByDepartment.ContainsKey(key))
                _collapsedByDepartment[key] = !_collapsedByDepartment[key];
            else
                _collapsedByDepartment[key] = false;
            
            RefreshPersonnelGrid();
        }

        private void ToggleCollapseAssignedTo(string key)
        {
            if (_collapsedByAssignedTo.ContainsKey(key))
                _collapsedByAssignedTo[key] = !_collapsedByAssignedTo[key];
            else
                _collapsedByAssignedTo[key] = false;
            
            RefreshInvGrid();
        }

        private void ToggleMaintenanceSelected()
        {
            if (_gridTerm.CurrentRow == null || _gridTerm.CurrentRow.Index < 0) return;
            var row = _gridTerm.CurrentRow.DataBoundItem as GridRow;
            if (row == null || row.IsHeader || row.Terminal == null) return;

            row.Terminal.Maintenance = !row.Terminal.Maintenance;
            if (row.Terminal.Maintenance)
                row.Terminal.Status = "MAINT"; // Bakım moduna geçtiğinde statusu belirle. RTT sıfırlansın vs istersen buraya ekle.
            else
                row.Terminal.Status = "UNK"; // Çıktığında bir dahaki tura kadar UNK olsun.

            _gridTerm.InvalidateRow(_gridTerm.CurrentRow.Index);
            SaveTerminals();
            UpdateDashboard();
            LogAction("TERM_MAINT", $"{row.Terminal.Name} Bakım Modu: {row.Terminal.Maintenance}");
        }

        // ======================= SSL CRUD =======================

        private void AddSsl()
        {
            if (string.IsNullOrWhiteSpace(_txtDomain.Text))
            {
                MessageBox.Show("Alan Adı zorunludur.", "Hata", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var s = new SslItem
            {
                Domain = _txtDomain.Text.Trim()
            };

            if (_chkUseExpiry.Checked)
            {
                s.ExpiryDate = _dtpExpiry.Value.Date;
                s.DaysLeft = (int)(s.ExpiryDate - DateTime.Today).TotalDays;
                s.Status = s.DaysLeft > 0 ? "VALID" : "EXPIRED";
            }

            _sslItems.Add(s);
            RefreshSslGrid();
            SaveSslItems();
            UpdateDashboard();
            LogAction("SSL_ADD", $"{s.Domain} Eklendi.");
            
            _txtDomain.Clear();
            _ = CheckSslExpiryAsync(s).ContinueWith(_ => {
                Invoke(new Action(() => {
                    RefreshSslGrid();
                    SaveSslItems();
                    UpdateDashboard();
                }));
            });
        }

        private void BeginEditSslSelected()
        {
            if (_gridSsl.CurrentRow == null || _gridSsl.CurrentRow.Index < 0) return;
            var row = _gridSsl.CurrentRow.DataBoundItem as SslRow;
            if (row == null || row.Item == null) return;

            _editingSsl = row.Item;
            _txtDomain.Text = _editingSsl.Domain;
            if (_editingSsl.ExpiryDate >= _dtpExpiry.MinDate && _editingSsl.ExpiryDate <= _dtpExpiry.MaxDate)
            {
                _chkUseExpiry.Checked = true;
                _dtpExpiry.Value = _editingSsl.ExpiryDate;
            }
            else
            {
                _chkUseExpiry.Checked = false;
                _dtpExpiry.Value = DateTime.Now;
            }

            _lblMode.Text = "Mode: SSL EDIT";
            _btnSslAdd.Enabled = _btnSslRemove.Enabled = false;
            _btnSslSave.Enabled = _btnSslCancel.Enabled = true;
            _gridSsl.Enabled = false;
        }

        private void SaveSslEdit()
        {
            if (_editingSsl == null) return;

            _editingSsl.Domain = _txtDomain.Text.Trim();
            if (_chkUseExpiry.Checked)
            {
                _editingSsl.ExpiryDate = _dtpExpiry.Value.Date;
                _editingSsl.DaysLeft = (int)(_editingSsl.ExpiryDate - DateTime.Today).TotalDays;
                _editingSsl.Status = _editingSsl.DaysLeft > 0 ? "VALID" : "EXPIRED";
            }

            RefreshSslGrid();
            SaveSslItems();
            UpdateDashboard();
            LogAction("SSL_EDIT", $"{_editingSsl.Domain} Düzenlendi.");

            CancelSslEdit();
        }

        private void CancelSslEdit()
        {
            _editingSsl = null;
            _txtDomain.Clear();
            _lblMode.Text = "Mode: ADD";
            _btnSslAdd.Enabled = _btnSslRemove.Enabled = true;
            _btnSslSave.Enabled = _btnSslCancel.Enabled = false;
            _gridSsl.Enabled = true;
        }

        private void RemoveSslSelected()
        {
            if (_gridSsl.CurrentRow == null || _gridSsl.CurrentRow.Index < 0) return;
            var row = _gridSsl.CurrentRow.DataBoundItem as SslRow;
            if (row == null || row.Item == null) return;

            if (MessageBox.Show($"{row.Item.Domain} silinecek. Emin misiniz?", "Onay", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
            {
                _sslItems.Remove(row.Item);
                RefreshSslGrid();
                SaveSslItems();
                UpdateDashboard();
                LogAction("SSL_DEL", $"{row.Item.Domain} Silindi.");
            }
        }

        // ======================= PERSONNEL CRUD =======================

        private void AddPersonnel()
        {
            if (string.IsNullOrWhiteSpace(_txtPersAd.Text) || string.IsNullOrWhiteSpace(_txtPersSoyad.Text))
            {
                MessageBox.Show("Ad ve Soyad alanları zorunludur.", "Hata", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var p = new Personnel
            {
                Ad = _txtPersAd.Text.Trim(),
                Soyad = _txtPersSoyad.Text.Trim(),
                Bolum = _cmbPersBolum.Text.Trim(),
                Gorev = _txtPersGorev.Text.Trim(),
                Firma = _cmbPersFirma.Text.Trim(),
                KartNo = _txtPersKartNo.Text.Trim(),
                SicilNo = _txtPersSicilNo.Text.Trim(),
                Dahili = _txtPersDahili.Text.Trim(),
                CepTelefonu = _txtPersCep.Text.Trim(),
                Mail = _txtPersMail.Text.Trim()
            };

            _personnels.Add(p);
            RefreshPersonnelGrid();
            SavePersonnel();
            LogAction("PERS_ADD", $"{p.Ad} {p.Soyad} Eklendi.");
            
            CancelPersonnelEdit();
            _btnPersSave.Enabled = _btnPersCancel.Enabled = false;
        }

        private void BeginEditPersonnelSelected()
        {
            if (_gridPers.CurrentRow == null || _gridPers.CurrentRow.Index < 0) return;
            var row = _gridPers.CurrentRow.DataBoundItem as PersonnelRow;
            if (row == null || row.Item == null) return;

            _editingPersonnel = row.Item;
            _txtPersAd.Text = _editingPersonnel.Ad;
            _txtPersSoyad.Text = _editingPersonnel.Soyad;
            _cmbPersBolum.Text = _editingPersonnel.Bolum;
            _txtPersGorev.Text = _editingPersonnel.Gorev;
            _cmbPersFirma.Text = _editingPersonnel.Firma;
            _txtPersKartNo.Text = _editingPersonnel.KartNo;
            _txtPersSicilNo.Text = _editingPersonnel.SicilNo;
            _txtPersDahili.Text = _editingPersonnel.Dahili;
            _txtPersCep.Text = _editingPersonnel.CepTelefonu;
            _txtPersMail.Text = _editingPersonnel.Mail;

            _btnPersAdd.Enabled = _btnPersRemove.Enabled = false;
            _btnPersSave.Enabled = _btnPersCancel.Enabled = true;
            _gridPers.Enabled = false;
        }

        private void SavePersonnelEdit()
        {
            if (_editingPersonnel == null) return;

            _editingPersonnel.Ad = _txtPersAd.Text.Trim();
            _editingPersonnel.Soyad = _txtPersSoyad.Text.Trim();
            _editingPersonnel.Bolum = _cmbPersBolum.Text.Trim();
            _editingPersonnel.Gorev = _txtPersGorev.Text.Trim();
            _editingPersonnel.Firma = _cmbPersFirma.Text.Trim();
            _editingPersonnel.KartNo = _txtPersKartNo.Text.Trim();
            _editingPersonnel.SicilNo = _txtPersSicilNo.Text.Trim();
            _editingPersonnel.Dahili = _txtPersDahili.Text.Trim();
            _editingPersonnel.CepTelefonu = _txtPersCep.Text.Trim();
            _editingPersonnel.Mail = _txtPersMail.Text.Trim();

            RefreshPersonnelGrid();
            SavePersonnel();
            LogAction("PERS_EDIT", $"{_editingPersonnel.Ad} {_editingPersonnel.Soyad} Düzenlendi.");

            CancelPersonnelEdit();
        }

        private void CancelPersonnelEdit()
        {
            _editingPersonnel = null;
            _txtPersAd.Clear(); _txtPersSoyad.Clear(); _cmbPersBolum.Text = ""; _txtPersGorev.Clear(); _cmbPersFirma.SelectedIndex = -1; _txtPersKartNo.Clear(); _txtPersSicilNo.Clear(); _txtPersDahili.Clear(); _txtPersCep.Clear(); _txtPersMail.Clear();
            _btnPersAdd.Enabled = _btnPersRemove.Enabled = true;
            _btnPersSave.Enabled = _btnPersCancel.Enabled = false;
            _gridPers.Enabled = true;
            UpdatePersonnelButtons();
        }

        private void RemovePersonnelSelected()
        {
            if (_gridPers.CurrentRow == null || _gridPers.CurrentRow.Index < 0) return;
            var row = _gridPers.CurrentRow.DataBoundItem as PersonnelRow;
            if (row == null || row.Item == null) return;

            if (MessageBox.Show($"{row.Item.Ad} {row.Item.Soyad} silinecek. Emin misiniz?", "Onay", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
            {
                _personnels.Remove(row.Item);
                RefreshPersonnelGrid();
                SavePersonnel();
                LogAction("PERS_DEL", $"{row.Item.Ad} {row.Item.Soyad} Silindi.");
            }
        }

        private void ImportPersonnelCsv()
        {
            using var ofd = new OpenFileDialog();
            ofd.Filter = "CSV Dosyaları (*.csv)|*.csv|Tüm Dosyalar (*.*)|*.*";
            ofd.Title = "Personel Listesi İçe Aktar";
            
            if (ofd.ShowDialog() == DialogResult.OK)
            {
                try
                {
                    var lines = System.IO.File.ReadAllLines(ofd.FileName);
                    int addedCount = 0;

                    foreach (var line in lines.Skip(1)) // Skip header row
                    {
                        var parts = line.Split(';'); // Genelde Excel TR'de noktalı virgül kullanır, veya virgül:
                        if (parts.Length < 1) parts = line.Split(',');

                        if (parts.Length >= 1 && !string.IsNullOrWhiteSpace(parts[0]))
                        {
                            var p = new Personnel
                            {
                                Ad = parts[0].Trim(),
                                Soyad = parts.Length > 1 ? parts[1].Trim() : "",
                                Bolum = parts.Length > 2 ? parts[2].Trim() : "",
                                Gorev = parts.Length > 3 ? parts[3].Trim() : "",
                                Firma = parts.Length > 4 ? parts[4].Trim() : "",
                                KartNo = parts.Length > 5 ? parts[5].Trim() : "",
                                SicilNo = parts.Length > 6 ? parts[6].Trim() : "",
                                Dahili = parts.Length > 7 ? parts[7].Trim() : "",
                                CepTelefonu = parts.Length > 8 ? parts[8].Trim() : "",
                                Mail = parts.Length > 9 ? parts[9].Trim() : ""
                            };
                            _personnels.Add(p);
                            addedCount++;
                        }
                    }

                    RefreshPersonnelGrid();
                    SavePersonnel();
                    MessageBox.Show($"{addedCount} adet personel başarıyla içe aktarıldı.", "Başarılı", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    LogAction("PERS_IMPORT", $"{addedCount} personel CSV'den içe aktarıldı.");
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"CSV içe aktarılırken bir hata oluştu: {ex.Message}\n\nLütfen formatın şu şekilde olduğundan emin olun (İlk satır başlık olmalı):\nAd;Soyad;Bolum;Gorev;Firma;KartNo;SicilNo;Dahili;CepTelefonu;Mail", "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        private void ExportPersonnelCsv()
        {
            using var sfd = new SaveFileDialog();
            sfd.Filter = "CSV Dosyaları (*.csv)|*.csv";
            sfd.FileName = "Personel_Listesi.csv";
            sfd.Title = "Personel Listesini Dışa Aktar";

            if (sfd.ShowDialog() == DialogResult.OK)
            {
                try
                {
                    using var writer = new System.IO.StreamWriter(sfd.FileName, false, System.Text.Encoding.UTF8);
                    writer.WriteLine("Ad;Soyad;Bolum;Gorev;Firma;KartNo;SicilNo;Dahili;CepTelefonu;Mail");

                    foreach (var p in _personnels)
                    {
                        writer.WriteLine($"{p.Ad};{p.Soyad};{p.Bolum};{p.Gorev};{p.Firma};{p.KartNo};{p.SicilNo};{p.Dahili};{p.CepTelefonu};{p.Mail}");
                    }

                    MessageBox.Show("Personel listesi başarıyla dışa aktarıldı.", "Başarılı", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    LogAction("PERS_EXPORT", "Personel listesi CSV olarak dışa aktarıldı.");
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Dosya kaydedilirken bir hata oluştu: {ex.Message}", "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        // ======================= INVENTORY CRUD =======================

        private void AddInv()
        {
            MessageBox.Show("Sıfırdan envantere ekleme yapmak yerine, lütfen 'Stok Yönetimi' sekmesindeki Stok ekleme bölümünü kullanıp ilgili stoğu Personele Zimmetleyin. Bu işlem ürünü otomatik olarak Envantere taşıyacaktır.", "Bilgi", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void RemoveInv()
        {
            if (_gridInv.CurrentRow == null || _gridInv.CurrentRow.Index < 0) return;
            var row = _gridInv.CurrentRow.DataBoundItem as InventoryRow;
            if (row == null || row.Item == null) return;

            if (MessageBox.Show($"{row.Item.Model} ({row.Item.AssignedTo}) envanterden Kalıcı Olarak Silinecek. Emin misiniz?", "Onay", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
            {
                _invItems.Remove(row.Item);
                RefreshInvGrid();
                SaveInventory();
                LogAction("INV_DEL", $"Envanter kaydı silindi: {row.Item.Model} ({row.Item.SerialNo}) - {row.Item.AssignedTo}");
            }
        }

        private void ExportInvSummaryCsv()
        {
            if (_gridInvSummary.Rows.Count == 0)
            {
                MessageBox.Show("Dışa aktarılacak özet veri yok.", "Uyarı", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            using var sfd = new SaveFileDialog();
            sfd.Filter = "CSV Dosyaları (*.csv)|*.csv";
            sfd.FileName = "Envanter_Ozet_Raporu.csv";
            sfd.Title = "Özet Tablosunu Dışa Aktar";

            if (sfd.ShowDialog() == DialogResult.OK)
            {
                try
                {
                    using var writer = new StreamWriter(sfd.FileName, false, System.Text.Encoding.UTF8);
                    writer.WriteLine("Marka;Model;Adet");

                    foreach (DataGridViewRow r in _gridInvSummary.Rows)
                    {
                        string b = r.Cells["Brand"]?.Value?.ToString() ?? "";
                        string m = r.Cells["Model"]?.Value?.ToString() ?? "";
                        string c = r.Cells["Count"]?.Value?.ToString() ?? "0";
                        writer.WriteLine($"{b};{m};{c}");
                    }

                    MessageBox.Show("Özet başarıyla dışa aktarıldı.", "Başarılı", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    LogAction("INV_SUMMARY_EXPORT", "Marka/Model özeti dışa aktarıldı.");
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Dosya kaydedilirken bir hata oluştu: {ex.Message}", "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        private void ReturnToStock()
        {
            if (_gridInv.CurrentRow == null || _gridInv.CurrentRow.Index < 0) return;
            var row = _gridInv.CurrentRow.DataBoundItem as InventoryRow;
            if (row == null || row.Item == null) return;

            if (MessageBox.Show($"{row.Item.Model} cihazı stoğa iade edilecek. Onaylıyor musunuz?", "Stoğa İade", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
            {
                var s = new StockItem
                {
                    Category = row.Item.Category,
                    Brand = row.Item.Brand,
                    Model = row.Item.Model,
                    SerialNo = row.Item.SerialNo,
                    PcIsmi = row.Item.PcIsmi,
                    Status = "Sağlam",
                    AddedAt = DateTime.Now
                };
                
                _invItems.Remove(row.Item);
                _stockItems.Add(s);

                RefreshInvGrid();
                RefreshStockGrid();
                SaveInventory();
                SaveStock();
                
                LogAction("INV_RETURN", $"{row.Item.Model} zimmetten düşürüldü ve stoğa aktarıldı.");
            }
        }

        private void GenerateZimmetForm()
        {
            if (_gridInv.CurrentRow == null || _gridInv.CurrentRow.Index < 0) return;
            var row = _gridInv.CurrentRow.DataBoundItem as InventoryRow;
            if (row == null) return;
            
            string assignedTo = row.IsHeader ? row.AssignedToKey : (row.Item?.AssignedTo ?? "");
            if (string.IsNullOrWhiteSpace(assignedTo))
            {
                MessageBox.Show("Geçerli bir personel atanmamış bir kayıt seçtiniz.", "Bilgi", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            var personItems = _invItems.Where(i => i.AssignedTo == assignedTo).ToList();
            if (personItems.Count == 0)
            {
                MessageBox.Show("Bu kişiye zimmetli hiçbir cihaz bulunamadı.", "Bilgi", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            if (string.IsNullOrWhiteSpace(_appSettings.ZimmetTemplatePath) || !File.Exists(_appSettings.ZimmetTemplatePath))
            {
                MessageBox.Show("Ayarlar sekmesinden geçerli bir Zimmet Formu şablon dosyası (.xls veya .xlsx) seçmelisiniz.", "Hata", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            try
            {
                var pers = _personnels.FirstOrDefault(p => p.AdSoyad == assignedTo);
                using var fs = new FileStream(_appSettings.ZimmetTemplatePath, FileMode.Open, FileAccess.Read);
                var wb = WorkbookFactory.Create(fs);
                var sheet = wb.GetSheetAt(0);

                var replacements = new System.Collections.Generic.Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    { "[ADSOYAD]", assignedTo },
                    { "[KIMEVERILDI]", assignedTo },
                    { "[AD]", pers?.Ad ?? "" },
                    { "[SOYAD]", pers?.Soyad ?? "" },
                    { "[TARIH]", DateTime.Now.ToString("dd.MM.yyyy") },
                    { "[BOLUM]", pers?.Bolum ?? "" },
                    { "[GOREV]", pers?.Gorev ?? "" },
                    { "[FIRMA]", pers?.Firma ?? "" },
                    { "[SICILNO]", pers?.SicilNo ?? "" },
                    { "[KARTNO]", pers?.KartNo ?? "" },
                    { "[DAHILI]", pers?.Dahili ?? "" },
                    { "[CEP]", pers?.CepTelefonu ?? "" },
                    { "[MAIL]", pers?.Mail ?? "" },
                    { "[OPERATOR]", ActorName() }
                };

                int replacedCount = 0;

                // Helper: try to replace in a cell's string value
                void TryReplaceCell(NPOI.SS.UserModel.ICell? cell)
                {
                    if (cell == null) return;
                    string text = "";
                    try
                    {
                        if (cell.CellType == NPOI.SS.UserModel.CellType.String)
                            text = cell.RichStringCellValue?.String ?? cell.StringCellValue;
                        else if (cell.CellType == NPOI.SS.UserModel.CellType.Formula && cell.CachedFormulaResultType == NPOI.SS.UserModel.CellType.String)
                            text = cell.RichStringCellValue?.String ?? cell.StringCellValue;
                        else return;
                    }
                    catch { return; }

                    if (string.IsNullOrEmpty(text)) return;

                    bool changed = false;
                    foreach (var kvp in replacements)
                    {
                        if (text.Contains(kvp.Key, StringComparison.OrdinalIgnoreCase))
                        {
                            text = System.Text.RegularExpressions.Regex.Replace(text, System.Text.RegularExpressions.Regex.Escape(kvp.Key), kvp.Value, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                            changed = true;
                        }
                    }
                    if (changed) 
                    { 
                        cell.SetCellValue(text); 
                        replacedCount++; 
                    }
                }

                int startItemRow = -1;
                for (int i = 0; i <= Math.Min(sheet.LastRowNum, 50); i++)
                {
                    var r = sheet.GetRow(i);
                    if (r == null) continue;
                    
                    for (int j = 0; j < r.LastCellNum; j++)
                    {
                        TryReplaceCell(r.GetCell(j));
                    }

                    // Look for the "1" in the first column to identify the items table start
                    if (startItemRow == -1)
                    {
                        var c = r.GetCell(0);
                        if (c != null && c.ToString().Trim() == "1")
                        {
                            startItemRow = i;
                        }
                    }
                }

                if (startItemRow == -1) startItemRow = 10; // Fallback to index 10 (row 11 in Excel)

                // Fill items automatically into the grid
                for (int i = 0; i < personItems.Count; i++)
                {
                    var r = sheet.GetRow(startItemRow + i);
                    if (r == null) r = sheet.CreateRow(startItemRow + i);

                    var item = personItems[i];
                    string cihazDesc = $"{item.Category} {item.Brand} {item.Model} - Seri No: {item.SerialNo}";

                    // Assume Col B (index 1) is device desc, Col D (index 3) is date, Col F (index 5) is operator
                    var cDesc = r.GetCell(1) ?? r.CreateCell(1);
                    cDesc.SetCellValue(cihazDesc);

                    var cDate = r.GetCell(3) ?? r.CreateCell(3);
                    cDate.SetCellValue(DateTime.Now.ToString("dd.MM.yyyy"));

                    var cOp = r.GetCell(5) ?? r.CreateCell(5);
                    cOp.SetCellValue(ActorName());
                    replacedCount++;
                }

                // Determine output path
                string outDir = !string.IsNullOrWhiteSpace(_appSettings.ZimmetOutputFolder) && Directory.Exists(_appSettings.ZimmetOutputFolder)
                    ? _appSettings.ZimmetOutputFolder
                    : Path.GetDirectoryName(_appSettings.ZimmetTemplatePath) ?? AppContext.BaseDirectory;

                string firstModel = personItems.Count > 0 ? personItems[0].Model : "Ürünler";
                string safeName = string.Concat($"Zimmet_{assignedTo}_{firstModel}_{DateTime.Now:yyyyMMdd}".Split(Path.GetInvalidFileNameChars()));
                string outExt = Path.GetExtension(_appSettings.ZimmetTemplatePath).ToLower() == ".xls" ? ".xls" : ".xlsx";
                string outPath = Path.Combine(outDir, safeName + outExt);

                using var outFs = new FileStream(outPath, FileMode.Create, FileAccess.Write);
                wb.Write(outFs);
                outFs.Close();

                LogAction("INV_ZIMMET", $"{assignedTo} için zimmet formu oluşturuldu: {outPath}");
                MessageBox.Show($"Zimmet formu oluşturuldu!\n\n{Path.GetFileName(outPath)}\nKlasör: {outDir}\n\nDoldurulan alan sayısı: {replacedCount}\nEklenen cihaz sayısı: {personItems.Count}", "Başarılı", MessageBoxButtons.OK, MessageBoxIcon.Information);
                
                try { System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo { FileName = outPath, UseShellExecute = true }); } catch { }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Zimmet formu oluşturulurken hata: {ex.Message}", "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        // ======================= STOCK CRUD =======================

        private void AddStock()
        {
            if (string.IsNullOrWhiteSpace(_txtStockModel.Text) || string.IsNullOrWhiteSpace(_txtStockSerial.Text))
            {
                MessageBox.Show("Model ve Seri No alanları zorunludur.", "Hata", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var s = new StockItem
            {
                Category = _cmbStockCategory.SelectedItem?.ToString() ?? "",
                Brand = _cmbStockBrand.Text.Trim(),
                Model = _txtStockModel.Text.Trim(),
                SerialNo = _txtStockSerial.Text.Trim(),
                Status = _cmbStockStatus.SelectedItem?.ToString() ?? "Sağlam",
                PcIsmi = _txtStockPcIsmi.Text.Trim(),
                EnvanterTuru = _cmbStockEnvType.SelectedItem?.ToString() ?? "Personel Envanteri",
                AddedAt = DateTime.Now
            };

            _stockItems.Add(s);
            UpdateModelCatalog(s.Model);
            RefreshStockGrid();
            SaveStock();
            LogAction("STOCK_ADD", $"Stok eklendi: {s.Category} - {s.Model} ({s.SerialNo})");
            
            _txtStockModel.Clear(); _txtStockSerial.Clear(); _txtStockPcIsmi.Clear();
        }

        private void RemoveStockSelected()
        {
            if (_gridStock.CurrentRow == null || _gridStock.CurrentRow.Index < 0) return;
            var row = _gridStock.CurrentRow.DataBoundItem as StockRow;
            if (row == null || row.Item == null) return;

            if (MessageBox.Show($"{row.Item.Model} stoktan silinecek. Emin misiniz?", "Onay", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
            {
                _stockItems.Remove(row.Item);
                RefreshStockGrid();
                SaveStock();
                LogAction("STOCK_DEL", $"Stok silindi: {row.Item.Model} ({row.Item.SerialNo})");
            }
        }

        private void AssignStockToInv()
        {
            if (_gridStock.CurrentRow == null || _gridStock.CurrentRow.Index < 0) return;
            var row = _gridStock.CurrentRow.DataBoundItem as StockRow;
            if (row == null || row.Item == null) return;

            string assignTo = _cmbStockAssignTo.Text.Trim();
            if (string.IsNullOrWhiteSpace(assignTo))
            {
                MessageBox.Show("Lütfen atama yapılacak personel adını (Kime) girin.", "Uyarı", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var i = new InventoryItem
            {
                Category = row.Item.Category,
                Brand = row.Item.Brand,
                Model = row.Item.Model,
                SerialNo = row.Item.SerialNo,
                PcIsmi = row.Item.PcIsmi,
                EnvanterTuru = row.Item.EnvanterTuru,
                AssignedTo = assignTo,
                AssignedAt = DateTime.Now
            };

            _stockItems.Remove(row.Item);
            _invItems.Add(i);

            RefreshStockGrid();
            RefreshInvGrid();
            SaveStock();
            SaveInventory();

            LogAction("STOCK_ASSIGN", $"{i.Model} ({i.SerialNo}), {assignTo} isimli personele zimmetlendi.");
            _cmbStockAssignTo.Text = "";
        }

        private void ImportStockCsv()
        {
            using var ofd = new OpenFileDialog();
            ofd.Filter = "CSV Dosyaları (*.csv)|*.csv";
            ofd.Title = "İçe Aktarılacak Stok Dosyasını Seçin";

            if (ofd.ShowDialog() == DialogResult.OK)
            {
                try
                {
                    var lines = File.ReadAllLines(ofd.FileName, System.Text.Encoding.UTF8);
                    if (lines.Length <= 1)
                    {
                        MessageBox.Show("Dosyada içe aktarılacak veri bulunamadı.", "Bilgi", MessageBoxButtons.OK, MessageBoxIcon.Information);
                        return;
                    }

                    int addedCount = 0;
                    for (int i = 1; i < lines.Length; i++)
                    {
                        var line = lines[i];
                        if (string.IsNullOrWhiteSpace(line)) continue;

                        var parts = line.Split(';');
                        if (parts.Length < 1) parts = line.Split(',');

                        if (parts.Length >= 4) // Ensure we have at least category, brand, model, serial
                        {
                            var s = new StockItem
                            {
                                Category = parts[0].Trim(),
                                Brand = parts.Length > 1 ? parts[1].Trim() : "",
                                Model = parts.Length > 2 ? parts[2].Trim() : "",
                                SerialNo = parts.Length > 3 ? parts[3].Trim() : "",
                                PcIsmi = parts.Length > 4 ? parts[4].Trim() : "",
                                Status = parts.Length > 5 ? parts[5].Trim() : "Sağlam"
                            };

                            DateTime parsedDate;
                            if (parts.Length > 6 && DateTime.TryParseExact(parts[6].Trim(), "dd.MM.yyyy", null, System.Globalization.DateTimeStyles.None, out parsedDate))
                            {
                                s.AddedAt = parsedDate;
                            }
                            else
                            {
                                s.AddedAt = DateTime.Now;
                            }

                            _stockItems.Add(s);
                            UpdateModelCatalog(s.Model);
                            addedCount++;
                        }
                    }

                    RefreshStockGrid();
                    SaveStock();
                    MessageBox.Show($"{addedCount} adet stok kaydı başarıyla içe aktarıldı.", "Başarılı", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    LogAction("STOCK_IMPORT", $"{addedCount} stok kaydı CSV'den içe aktarıldı.");
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"CSV içe aktarılırken bir hata oluştu: {ex.Message}\n\nLütfen formatın şu şekilde olduğundan emin olun (İlk satır başlık olmalı):\nKategori;Marka;Model;Seri No;PC İsmi;Durum;Tarih", "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        private void ExportStockCsv()
        {
            using var sfd = new SaveFileDialog();
            sfd.Filter = "CSV Dosyaları (*.csv)|*.csv";
            sfd.FileName = "Stok_Listesi.csv";

            if (sfd.ShowDialog() == DialogResult.OK)
            {
                try
                {
                    using var writer = new StreamWriter(sfd.FileName, false, System.Text.Encoding.UTF8);
                    writer.WriteLine("Category;Brand;Model;SerialNo;PcIsmi;Status;DateAdded");

                    foreach (var s in _stockItems)
                    {
                        writer.WriteLine($"{s.Category};{s.Brand};{s.Model};{s.SerialNo};{s.PcIsmi};{s.Status};{s.AddedAt:dd.MM.yyyy}");
                    }

                    MessageBox.Show("Stok listesi başarıyla dışa aktarıldı.", "Başarılı", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    LogAction("STOCK_EXPORT", "Stok listesi CSV olarak dışa aktarıldı.");
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Dosya kaydedilirken bir hata oluştu: {ex.Message}", "Hata", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        // ======================= LOGS =======================

        private void ApplyLogFilter()
        {
            var search = _txtLogSearch.Text.Trim().ToLower();
            string action = _cmbLogAction.SelectedItem?.ToString() ?? "TÜMÜ";
            var from = _dtLogFrom.Value.Date;
            var to = _dtLogTo.Value.Date.AddDays(1).AddTicks(-1);

            var filtered = _logs.Where(x => x.Date >= from && x.Date <= to);
            
            if (action != "TÜMÜ")
                filtered = filtered.Where(x => x.Action == action);
                
            if (!string.IsNullOrEmpty(search))
                filtered = filtered.Where(x => (x.Operator?.ToLower().Contains(search) == true) || (x.Details?.ToLower().Contains(search) == true));

            var results = filtered.OrderByDescending(x => x.Date).Take(200).Select(x => new AuditLogRow(x)).ToList();
            _gridLogs.DataSource = null;
            _gridLogs.DataSource = new System.ComponentModel.BindingList<AuditLogRow>(results);
        }

        private void ExportLogsCsv()
        {
            MessageBox.Show("CSV dışa aktarma eklentisi daha sonra geliştirilecektir.", "Bilgi", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void GridTerm_CellFormatting(object? sender, DataGridViewCellFormattingEventArgs e)
        {
            if (e.RowIndex < 0 || e.ColumnIndex < 0 || e.Value == null) return;
            var colName = _gridTerm.Columns[e.ColumnIndex].DataPropertyName;

            if (colName == "Status")
            {
                string val = e.Value.ToString() ?? "";
                if (val == "UP")
                {
                    e.CellStyle.ForeColor = Color.Green;
                    e.CellStyle.SelectionForeColor = Color.LightGreen;
                    e.CellStyle.Font = new Font(e.CellStyle.Font ?? _gridTerm.Font, FontStyle.Bold);
                }
                else if (val == "DOWN")
                {
                    e.CellStyle.ForeColor = Color.Red;
                    e.CellStyle.SelectionForeColor = Color.Salmon;
                    e.CellStyle.Font = new Font(e.CellStyle.Font ?? _gridTerm.Font, FontStyle.Bold);
                }
            }
        }

        private void CheckCardPersonnel(uint meyer)
        {
            string kartNo = meyer.ToString();
            var pers = _personnels.FirstOrDefault(p => string.Equals(p.KartNo, kartNo, StringComparison.OrdinalIgnoreCase));

            if (pers != null)
            {
                _lblCardPersonnelInfo.Text = $"Personel Bulundu: {pers.AdSoyad} - {pers.Bolum}";
                _lblCardPersonnelInfo.ForeColor = Color.Green;
                _btnCardGoPersonnel.Visible = true;
                _btnCardAddPersonnel.Visible = false;
            }
            else
            {
                _lblCardPersonnelInfo.Text = "Bu numaraya kayıtlı personel bulunamadı.";
                _lblCardPersonnelInfo.ForeColor = Color.Red;
                _btnCardGoPersonnel.Visible = false;
                _btnCardAddPersonnel.Visible = true;
            }
        }

        private void BtnCardGoPersonnel_Click(object? sender, EventArgs e)
        {
            if (uint.TryParse(_txtCardMeyer.Text.Trim(), out uint meyer))
            {
                string kartNo = meyer.ToString();
                var pers = _personnels.FirstOrDefault(p => string.Equals(p.KartNo, kartNo, StringComparison.OrdinalIgnoreCase));
                if (pers != null)
                {
                    _tabs.SelectedTab = _tabPersonels;
                    _txtLogSearch.Text = ""; // To clear filters if we had one
                    
                    // Expand the group if collapsed
                    string bolum = string.IsNullOrWhiteSpace(pers.Bolum) ? "Diğer" : pers.Bolum;
                    if (_collapsedByDepartment.TryGetValue(bolum, out bool collapsed) && collapsed)
                    {
                        _collapsedByDepartment[bolum] = false;
                        RefreshPersonnelGrid();
                    }

                    // Select it in grid
                    foreach (DataGridViewRow row in _gridPers.Rows)
                    {
                        var data = row.DataBoundItem as Models.PersonnelRow;
                        if (data != null && data.Item != null && data.Item.KartNo == kartNo)
                        {
                            row.Selected = true;
                            _gridPers.FirstDisplayedScrollingRowIndex = row.Index;
                            break;
                        }
                    }
                }
            }
        }

        private void BtnCardAddPersonnel_Click(object? sender, EventArgs e)
        {
            _tabs.SelectedTab = _tabPersonels;
            _btnPersAdd.PerformClick();
            _txtPersKartNo.Text = _txtCardMeyer.Text.Trim();
        }

        private void TxtCardMeyer_TextChanged(object? sender, EventArgs e)
        {
            if (_isConvertingCards) return;
            _isConvertingCards = true;
            if (uint.TryParse(_txtCardMeyer.Text.Trim(), out uint meyer))
            {
                _txtCardYazici.Text = meyer.ToString("X8");
                _txtCardMacgal.Text = meyer.ToString();
                uint unilever = (meyer >> 24) | ((meyer >> 8) & 0x0000FF00) | ((meyer << 8) & 0x00FF0000) | (meyer << 24);
                _txtCardUnilever.Text = unilever.ToString();
                CheckCardPersonnel(meyer);
            }
            else { _txtCardYazici.Text = ""; _txtCardUnilever.Text = ""; _txtCardMacgal.Text = ""; _lblCardPersonnelInfo.Text = "Kart Numarası Girin"; _lblCardPersonnelInfo.ForeColor = Color.DimGray; _btnCardGoPersonnel.Visible = false; _btnCardAddPersonnel.Visible = false; }
            _isConvertingCards = false;
        }

        private void TxtCardYazici_TextChanged(object? sender, EventArgs e)
        {
            if (_isConvertingCards) return;
            _isConvertingCards = true;
            if (uint.TryParse(_txtCardYazici.Text.Trim(), System.Globalization.NumberStyles.HexNumber, null, out uint yazici))
            {
                _txtCardMeyer.Text = yazici.ToString();
                _txtCardMacgal.Text = yazici.ToString();
                uint unilever = (yazici >> 24) | ((yazici >> 8) & 0x0000FF00) | ((yazici << 8) & 0x00FF0000) | (yazici << 24);
                _txtCardUnilever.Text = unilever.ToString();
                CheckCardPersonnel(yazici);
            }
            else { _txtCardMeyer.Text = ""; _txtCardUnilever.Text = ""; _txtCardMacgal.Text = ""; _lblCardPersonnelInfo.Text = "Kart Numarası Girin"; _lblCardPersonnelInfo.ForeColor = Color.DimGray; _btnCardGoPersonnel.Visible = false; _btnCardAddPersonnel.Visible = false; }
            _isConvertingCards = false;
        }

        private void TxtCardUnilever_TextChanged(object? sender, EventArgs e)
        {
            if (_isConvertingCards) return;
            _isConvertingCards = true;
            if (uint.TryParse(_txtCardUnilever.Text.Trim(), out uint unilever))
            {
                 uint yazici = (unilever >> 24) | ((unilever >> 8) & 0x0000FF00) | ((unilever << 8) & 0x00FF0000) | (unilever << 24);
                 _txtCardMeyer.Text = yazici.ToString();
                 _txtCardMacgal.Text = yazici.ToString();
                 _txtCardYazici.Text = yazici.ToString("X8");
                 CheckCardPersonnel(yazici);
            }
            else { _txtCardMeyer.Text = ""; _txtCardYazici.Text = ""; _txtCardMacgal.Text = ""; _lblCardPersonnelInfo.Text = "Kart Numarası Girin"; _lblCardPersonnelInfo.ForeColor = Color.DimGray; _btnCardGoPersonnel.Visible = false; _btnCardAddPersonnel.Visible = false; }
            _isConvertingCards = false;
        }

        private void TxtCardMacgal_TextChanged(object? sender, EventArgs e)
        {
            if (_isConvertingCards) return;
            _isConvertingCards = true;
            if (uint.TryParse(_txtCardMacgal.Text.Trim(), out uint macgal))
            {
                _txtCardMeyer.Text = macgal.ToString();
                _txtCardYazici.Text = macgal.ToString("X8");
                uint unilever = (macgal >> 24) | ((macgal >> 8) & 0x0000FF00) | ((macgal << 8) & 0x00FF0000) | (macgal << 24);
                _txtCardUnilever.Text = unilever.ToString();
                CheckCardPersonnel(macgal);
            }
            else { _txtCardMeyer.Text = ""; _txtCardYazici.Text = ""; _txtCardUnilever.Text = ""; _lblCardPersonnelInfo.Text = "Kart Numarası Girin"; _lblCardPersonnelInfo.ForeColor = Color.DimGray; _btnCardGoPersonnel.Visible = false; _btnCardAddPersonnel.Visible = false; }
            _isConvertingCards = false;
        }
    }
}
