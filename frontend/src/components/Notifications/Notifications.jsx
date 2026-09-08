import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Badge
} from "@mui/material";
import Sidebar, { TopNavbar } from "../Layout/Sidebar";
import notificationAPI from "../../services/notificationAPI";

function timeAgo(dateStr) {
  if (!dateStr) return "just now";
  const then = new Date(dateStr).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const { data } = await notificationAPI.getNotifications();
      setNotifications(data || []);
      setUnread((data || []).filter((n) => !n.is_read).length);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      loadNotifications();
    } catch (err) {
      setError(err.message || "Failed to update notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      loadNotifications();
    } catch (err) {
      setError(err.message || "Failed to update notifications");
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <TopNavbar title="Notifications" />

        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Badge color="primary" badgeContent={unread}>
              <Typography variant="h6">Inbox</Typography>
            </Badge>
            <Button
              variant="outlined"
              size="small"
              onClick={handleMarkAllAsRead}
              disabled={unread === 0}
            >
              Mark all as read
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Alert severity="info">You have no notifications yet.</Alert>
          ) : (
            <List>
              {notifications.map((n, idx) => (
                <Box key={n.id}>
                  {idx > 0 && <Divider component="li" />}
                  <ListItem
                    sx={{
                      bgcolor: n.is_read ? "transparent" : "action.hover",
                      borderRadius: 1
                    }}
                    secondaryAction={
                      !n.is_read && (
                        <Button size="small" onClick={() => handleMarkAsRead(n.id)}>
                          {"\u2713 Mark read"}
                        </Button>
                      )
                    }
                  >
                    <ListItemText
                      primary={`${n.is_read ? "\u25E6" : "\u{1F514}"}  ${n.message}`}
                      secondary={n.created_at ? timeAgo(n.created_at) : "just now"}
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </Box>
      </main>
    </div>
  );
}