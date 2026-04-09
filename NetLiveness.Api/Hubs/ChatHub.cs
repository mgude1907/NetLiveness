using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using NetLiveness.Api.Data;
using NetLiveness.Api.Models;
using System;
using System.Collections.Concurrent;
using System.Linq;

namespace NetLiveness.Api.Hubs
{
    public class OnlineUser
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string ConnectionId { get; set; }
    }

    public class ChatHub : Hub
    {
        private readonly AppDbContext _context;
        // RAM'de aktif kullanıcıları sakla
        public static readonly ConcurrentDictionary<string, OnlineUser> OnlineUsers = new();

        public ChatHub(AppDbContext context)
        {
            _context = context;
        }

        // --- PRESENCE (ÇEVRİMİÇİ TAKİBİ) ---
        public async Task RegisterPresence(int userId, string fullName)
        {
            OnlineUsers[Context.ConnectionId] = new OnlineUser { UserId = userId, FullName = fullName, ConnectionId = Context.ConnectionId };
            await Clients.All.SendAsync("UpdateOnlineUsers", OnlineUsers.Values.ToList());
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            OnlineUsers.TryRemove(Context.ConnectionId, out _);
            await Clients.All.SendAsync("UpdateOnlineUsers", OnlineUsers.Values.ToList());
            await base.OnDisconnectedAsync(exception);
        }

        // --- CHAT KANALLARI ---
        public async Task JoinChannel(string channelId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, channelId);
        }

        public async Task LeaveChannel(string channelId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, channelId);
        }

        public async Task SendMessage(int? channelId, int userId, string senderName, string content, string? attachmentUrl, string? attachmentType, int? recipientId = null)
        {
            var msg = new ChatMessage
            {
                ChannelId = (channelId == 0) ? null : channelId,
                UserId = userId,
                SenderName = senderName,
                Content = content,
                Timestamp = DateTime.Now,
                AttachmentUrl = attachmentUrl,
                AttachmentType = attachmentType,
                RecipientId = recipientId
            };

            _context.ChatMessages.Add(msg);
            await _context.SaveChangesAsync();

            if (recipientId.HasValue)
            {
                // ÖZEL MESAJ (DM)
                // Gönderenin ve alıcının tüm aktif bağlantılarını bul
                var recipientConnections = OnlineUsers.Where(u => u.Value.UserId == recipientId.Value).Select(u => u.Key).ToList();
                var senderConnections = OnlineUsers.Where(u => u.Value.UserId == userId).Select(u => u.Key).ToList();
                
                var allTargetConnections = recipientConnections.Concat(senderConnections).Distinct();

                foreach (var connId in allTargetConnections)
                {
                    await Clients.Client(connId).SendAsync("ReceiveMessage", msg);
                }
            }
            else if (channelId.HasValue)
            {
                // KANAL MESAJI
                await Clients.Group(channelId.Value.ToString()).SendAsync("ReceiveMessage", msg);
            }
        }

        // --- WEBRTC SIGNALING (P2P GÖRÜNTÜLÜ GÖRÜŞME) ---
        public async Task CallUser(string targetConnectionId, string signalData, string fromFullName)
        {
            await Clients.Client(targetConnectionId).SendAsync("IncomingCall", Context.ConnectionId, signalData, fromFullName);
        }

        public async Task AnswerCall(string callerConnectionId, string signalData)
        {
            await Clients.Client(callerConnectionId).SendAsync("CallAccepted", signalData);
        }

        public async Task SendSignal(string targetConnectionId, string signalData)
        {
            await Clients.Client(targetConnectionId).SendAsync("ReceiveSignal", Context.ConnectionId, signalData);
        }

        public async Task SendNudge(string targetConnectionId, string fromFullName)
        {
            await Clients.Client(targetConnectionId).SendAsync("ReceiveNudge", fromFullName);
        }
    }
}
