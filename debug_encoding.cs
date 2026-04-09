using System;
using System.Data.SQLite;
using System.Text;

class Program {
    static void Main() {
        string cs = "Data Source=c:\\Users\\mgude\\.gemini\\antigravity\scratch\\NetLiveness.Api\\netliveness.db";
        using var con = new SQLiteConnection(cs);
        con.Open();
        
        using var cmd = new SQLiteCommand("SELECT Id, AdSoyad FROM Personnels WHERE Id >= 219", con);
        using var reader = cmd.ExecuteReader();
        
        while (reader.Read()) {
            int id = reader.GetInt32(0);
            string name = reader.GetString(1);
            Console.Write($"{id}: {name} -> ");
            byte[] bytes = Encoding.UTF8.GetBytes(name);
            foreach (byte b in bytes) {
                Console.Write($"{b:X2} ");
            }
            Console.WriteLine();
        }
    }
}
