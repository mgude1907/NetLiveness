using System;
using System.Collections.Generic;

namespace NetLiveness.Api.Models
{
    public class ChatChannel
    {
        public int Id { get; set; }
        public string Name { get; set; } = ""; // "Genel", "IT Destek"
        public string Description { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public int? OwnerId { get; set; } // Kanalı oluşturan kullanıcı
        
        [System.Text.Json.Serialization.JsonIgnore]
        public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
        
        [System.Text.Json.Serialization.JsonIgnore]
        public ICollection<ChatChannelMember> Members { get; set; } = new List<ChatChannelMember>();
    }

    public class ChatMessage
    {
        public int Id { get; set; }
        public int? ChannelId { get; set; }
        public int? RecipientId { get; set; } // Özel mesaj ise alıcı ID
        
        public int UserId { get; set; } // Hangi AppUser gönderdi
        public string SenderName { get; set; } = ""; // Ad Soyad

        public string Content { get; set; } = "";
        public DateTime Timestamp { get; set; } = DateTime.Now;

        public string? AttachmentUrl { get; set; }
        public string? AttachmentType { get; set; } // "image", "gif", "file"


        [System.Text.Json.Serialization.JsonIgnore]
        public ChatChannel? Channel { get; set; }
        
        [System.Text.Json.Serialization.JsonIgnore]
        public AppUser? User { get; set; }
    }

    public class ChatChannelMember
    {
        public int Id { get; set; }
        public int ChannelId { get; set; }
        public int UserId { get; set; }
        public DateTime JoinedAt { get; set; } = DateTime.Now;

        [System.Text.Json.Serialization.JsonIgnore]
        public ChatChannel? Channel { get; set; }
        
        [System.Text.Json.Serialization.JsonIgnore]
        public AppUser? User { get; set; }
    }
}
