# Data Backup - 2025-08-05T10:31:14.059Z

This backup contains your Personal Trip Planner data.

## Files:
- `users_export.json` - User accounts and authentication data
- `routes_export.json` - Saved trip routes and plans

## To restore this data on a new installation:

1. Copy these files to your new server directory
2. Rename `users_export.json` to `users.json`
3. Run: `npm run migrate`

Or use mongorestore if you prefer:
```bash
mongorestore --db trip-planner --collection users users_export.json
mongorestore --db trip-planner --collection routes routes_export.json
```

Generated: 2025-08-05T10:31:14.059Z
Total Users: 12
Total Routes: 5
