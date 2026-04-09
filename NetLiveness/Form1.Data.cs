using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using NetLiveness.Models;

namespace NetLiveness
{
    public partial class Form1
    {
        // ========================= DATA (JSON LOAD/SAVE) =========================

        private void LoadTerminals()
        {
            if (File.Exists(_termStorePath))
            {
                var json = File.ReadAllText(_termStorePath);
                _terminals = JsonSerializer.Deserialize<List<Terminal>>(json) ?? new List<Terminal>();
            }
        }

        private void SaveTerminals()
        {
            var json = JsonSerializer.Serialize(_terminals, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_termStorePath, json);
        }

        private void LoadSslItems()
        {
            if (File.Exists(_sslStorePath))
            {
                var json = File.ReadAllText(_sslStorePath);
                _sslItems = JsonSerializer.Deserialize<List<SslItem>>(json) ?? new List<SslItem>();
            }
        }

        private void SaveSslItems()
        {
            var json = JsonSerializer.Serialize(_sslItems, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_sslStorePath, json);
        }

        private void LoadInventory()
        {
            if (File.Exists(_invStorePath))
            {
                var json = File.ReadAllText(_invStorePath);
                _invItems = JsonSerializer.Deserialize<List<InventoryItem>>(json) ?? new List<InventoryItem>();
            }
        }

        private void SaveInventory()
        {
            var json = JsonSerializer.Serialize(_invItems, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_invStorePath, json);
        }

        private void LoadStock()
        {
            if (File.Exists(_stockStorePath))
            {
                var json = File.ReadAllText(_stockStorePath);
                _stockItems = JsonSerializer.Deserialize<List<StockItem>>(json) ?? new List<StockItem>();
            }
        }

        private void SaveStock()
        {
            var json = JsonSerializer.Serialize(_stockItems, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_stockStorePath, json);
        }

        private void LoadLogs()
        {
            if (File.Exists(_logStorePath))
            {
                var json = File.ReadAllText(_logStorePath);
                _logs = JsonSerializer.Deserialize<List<AuditLogEntry>>(json) ?? new List<AuditLogEntry>();
            }
        }

        private void SaveLogs()
        {
            var json = JsonSerializer.Serialize(_logs, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_logStorePath, json);
        }

        private void LoadPersonnel()
        {
            if (File.Exists(_persStorePath))
            {
                var json = File.ReadAllText(_persStorePath);
                _personnels = JsonSerializer.Deserialize<List<Personnel>>(json) ?? new List<Personnel>();
            }
        }

        private void SavePersonnel()
        {
            var json = JsonSerializer.Serialize(_personnels, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_persStorePath, json);
        }

        private void LoadModels()
        {
            if (File.Exists(_modelsPath))
            {
                var json = File.ReadAllText(_modelsPath);
                _modelCatalog = JsonSerializer.Deserialize<Dictionary<string, HashSet<string>>>(json) ?? new Dictionary<string, HashSet<string>>(System.StringComparer.OrdinalIgnoreCase);
            }
        }

        private void SaveModels()
        {
            var json = JsonSerializer.Serialize(_modelCatalog, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_modelsPath, json);
        }

        private void LoadSettings()
        {
            if (File.Exists(_settingsPath))
            {
                try
                {
                    var json = File.ReadAllText(_settingsPath);
                    _appSettings = JsonSerializer.Deserialize<AppSettings>(json) ?? new AppSettings();
                }
                catch
                {
                    // Fallback using dict if it was old version
                    try
                    {
                        var json = File.ReadAllText(_settingsPath);
                        var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
                        if (dict != null && dict.TryGetValue("OperatorName", out string? val))
                        {
                            _appSettings.OperatorName = val;
                        }
                    }
                    catch { }
                }
            }

            if (string.IsNullOrWhiteSpace(_appSettings.ZimmetTemplatePath))
            {
                _appSettings.ZimmetTemplatePath = Path.Combine(AppContext.BaseDirectory, "RET.FR.43.04 - Cihaz Zimmet Formu - Device Assignment Form.xls");
            }
            
            if (_cmbOperator.Items.Contains(_appSettings.OperatorName))
                _cmbOperator.SelectedItem = _appSettings.OperatorName;
        }

        private void SaveSettings()
        {
            var json = JsonSerializer.Serialize(_appSettings, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_settingsPath, json);
        }
        
        private void LoadMailSettings()
        {
            if (File.Exists(_mailSettingsPath))
            {
                var json = File.ReadAllText(_mailSettingsPath);
                _mail = JsonSerializer.Deserialize<MailSettings>(json) ?? new MailSettings();
            }
        }
    }
}
