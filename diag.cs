using System;

public class Program {
    public static void Main() {
        string name = "LogonUI.exe";
        string n = name.ToLowerInvariant();
        bool match = n == "logonui.exe";
        Console.WriteLine($"Name: {name}");
        Console.WriteLine($"LowerInvariant: {n}");
        Console.WriteLine($"Match: {match}");
        
        // Turkish check
        System.Threading.Thread.CurrentThread.CurrentCulture = new System.Globalization.CultureInfo("tr-TR");
        string nTr = name.ToLower();
        bool matchTr = nTr == "logonui.exe";
        Console.WriteLine($"Turkish Lower: {nTr}");
        Console.WriteLine($"Turkish Match: {matchTr}");
    }
}
