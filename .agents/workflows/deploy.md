---
description: Deploy frontend changes to pulsoelectoral.pe VPS
---

# Deploy to PulsoElectoral.pe VPS

## Server Details
- **IP:** 195.35.37.220
- **User:** root
- **Password:** 2cqG;,HT8khhXl4i
- **Path:** /opt/pulsoelectoral/
- **OS:** AlmaLinux 8.10 (Hostinger VPS + Plesk)
- **PM2 processes:** pulso-frontend (port 3000), pulso-backend (port 4000)

## Deploy Steps

// turbo-all

1. Package changed files into tar.gz:
```powershell
cd c:\Users\USER\Documents\VOTA.PE\frontend
tar -czf C:\tmp\deploy-update.tar.gz <changed-files>
```

2. SCP tar to VPS (will prompt for password):
```powershell
scp -o StrictHostKeyChecking=no C:\tmp\deploy-update.tar.gz root@195.35.37.220:/opt/pulsoelectoral/frontend/
```
Password: 2cqG;,HT8khhXl4i

3. SSH into VPS and extract + build + restart:
```bash
ssh -o StrictHostKeyChecking=no root@195.35.37.220
cd /opt/pulsoelectoral/frontend
tar -xzf deploy-update.tar.gz
npm run build
pm2 restart pulso-frontend
```
Password: 2cqG;,HT8khhXl4i

4. Verify site is working:
```bash
curl -s -o /dev/null -w "%{http_code}" https://pulsoelectoral.pe
pm2 list | grep pulso
```
