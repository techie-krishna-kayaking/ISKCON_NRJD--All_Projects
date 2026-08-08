# Nandotsava 2026 - Event Management Dashboard

## Overview
This Google Apps Script project provides a comprehensive event management system for Nandotsava 2026, with two main interfaces:

1. **Desk App** (Index.html) - Event desk for checking in participants
2. **Dashboard** (Dashboard.html) - Summary statistics and analytics

## How to Access

### Main Desk App
Deploy the project and access the default URL:
```
https://script.google.com/...
```
Or access with parameter:
```
https://script.google.com/...?page=index
```

### Event Dashboard
Access the analytics dashboard:
```
https://script.google.com/...?page=dashboard
```

## Dashboard Features

The Event Dashboard provides three different views:

### 1. Event Summary View
Shows statistics for each competition/event type:
- Total registrations
- Attendance count
- Attendance percentage
- Status indicators (Excellent/Good/Low)
- School-wise breakdown

### 2. Category Summary View
Shows slot/category-wise summary:
- Participants by category (Fancy Dress, Music, Coloring, etc.)
- Group-wise breakdown within each category
- Real-time attendance tracking
- Pending participant counts

### 3. Schools Breakdown View
Shows participation by school:
- School registration counts
- School attendance statistics
- Attendance percentages
- Performance status

## Dashboard Columns Explained

| Column | Description |
|--------|-------------|
| Slot/Category | Event name or category |
| Total | Total registered participants |
| Attended | Number of participants who attended |
| Pending | Participants yet to attend |
| Attendance % | Percentage of attendance |
| Status | Visual status badge (✅ ⚠️ ❌) |
| Group Breakdown | Summary per group (G1, G2, G3) |

## Status Indicators
- ✅ **Excellent**: 80%+ attendance
- ⚠️ **Good**: 60-79% attendance
- ❌ **Low**: Below 60% attendance

## Data Sources
Data is pulled from the Google Sheet: **2026-Nandotsav-Finals.xlsx**

Supported sheets:
- Top3 (competitions)
- fancydress
- Music
- MEDALIST (medals data)

## Backend Functions

### Available API Functions

#### getMainDeskStats()
Returns comprehensive event statistics
```javascript
{
  overall: { total, footfall, percentage },
  categoryTotals: { fancyDress, music, quiz, coloring },
  eventWise: [...],
  schoolWise: [...],
  schoolEventWise: [...]
}
```

#### getCategorySummary()
Returns category-wise breakdown with group details
```javascript
{
  timestamp,
  summary: [{
    slot,
    totalRegistered,
    attended,
    pending,
    percentage,
    groupSummary
  }],
  totalRows,
  totalAttended
}
```

#### searchParticipants(payload)
Search for specific participants

#### getMedalDashboard(payload)
Get medal/achievement statistics

## Auto-Refresh
The dashboard automatically refreshes every 30 seconds to show real-time updates.

## Manual Refresh
Click the 🔄 **Refresh** button to manually update the data immediately.

## Features

✨ **Real-time Statistics** - Live attendance tracking
📊 **Multiple Views** - Event, Category, and School perspectives
🎯 **Group Breakdown** - See performance by participant groups
📱 **Responsive Design** - Works on desktop and mobile devices
⚡ **Auto-refresh** - Updates every 30 seconds
🌟 **Status Indicators** - Quick visual feedback on performance

## Color Scheme

The dashboard uses the traditional Nandotsava color palette:
- **Gold** (#b8860b) - Primary accent
- **Cream** (#fff7d1) - Background
- **Green** (#1f8a2f) - Success indicators
- **Red** (#b00020) - Alert indicators

## Notes

- All times displayed in Indian Standard Time (IST)
- Attendance is marked when both token and check-in timestamp are present
- Group codes: G1, G2, G3 (different age groups)
- Maximum 20 schools shown in the school-wise breakdown for performance

## Troubleshooting

**Dashboard not loading?**
- Check that you have access to the Google Sheet
- Ensure the script is deployed and authorized
- Try refreshing the page

**Data not updating?**
- Click the 🔄 Refresh button
- Check that participants have been checked in on the desk app
- Verify the Excel data has been synced to Google Sheets

## Support

For issues or feature requests, contact the event management team.

---

**Last Updated:** 2026-08-08  
**Version:** 1.0
