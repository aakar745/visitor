# 🚀 Meilisearch Setup Guide

## Quick Start (Local Development)

### Start Meilisearch:
```bash
docker-compose -f docker-compose-meilisearch.yml up -d
```

### Check if Running:
```bash
curl http://localhost:7700/health
```

### Stop Meilisearch:
```bash
docker-compose -f docker-compose-meilisearch.yml down
```

### View Logs:
```bash
docker-compose -f docker-compose-meilisearch.yml logs -f
```

---

## Initial Data Sync

After starting Meilisearch for the first time, sync your PIN codes:

```bash
cd backend
npm run start:dev -- sync:meilisearch
```

This will index all existing PIN codes from MongoDB into Meilisearch.

---

## Configuration

Meilisearch settings are in `backend/.env`:

```env
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_MASTER_KEY=developmentMasterKeyMin16Chars123
```

---

## Dashboard Access

Meilisearch comes with a built-in web dashboard:

**URL:** http://localhost:7700

**Master Key:** `developmentMasterKeyMin16Chars123`

Use the dashboard to:
- View indexed documents
- Test search queries
- Monitor performance
- Check index settings

---

## Production Deployment (EasyPanel)

For production on AWS with EasyPanel:

1. Use EasyPanel's 1-click Meilisearch template
2. Set strong `MEILI_MASTER_KEY` (minimum 16 characters)
3. Update backend `.env` with production URL
4. Run sync command on first deployment

---

## Troubleshooting

### Port 7700 already in use:
```bash
# Find process using port 7700
netstat -ano | findstr :7700

# Stop the container
docker-compose -f docker-compose-meilisearch.yml down
```

### Clear all data and re-sync:
```bash
# Stop and remove volumes
docker-compose -f docker-compose-meilisearch.yml down -v

# Start fresh
docker-compose -f docker-compose-meilisearch.yml up -d

# Re-sync data
cd backend && npm run start:dev -- sync:meilisearch
```

---

## Performance Notes

- **Search Speed:** < 20ms (typically 5-10ms)
- **RAM Usage:** ~200MB-500MB for 150K PIN codes
- **Disk Space:** ~100MB for index data
- **Auto-sync:** CRUD operations automatically update index

