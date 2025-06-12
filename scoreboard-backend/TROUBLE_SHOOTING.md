# Troubleshooting

## Accessing the Backend from Another Device (WSL)

If you are running your backend on Windows Subsystem for Linux (WSL) and want to access it from another device on your network, follow these steps:

### 1. Find Your WSL IP Address
In your WSL terminal, run:
```bash
hostname -I
```
Note the IP address (e.g., 172.24.128.1).

### 2. Find Your Windows Host IP Address
Open Command Prompt or PowerShell on Windows and run:
```cmd
ipconfig
```
Look for the IPv4 address under your main network adapter (e.g., 192.168.1.50).

### 3. Set Up Port Forwarding (on Windows)
Open Command Prompt as Administrator and run:
```cmd
netsh interface portproxy add v4tov4 listenport=8080 listenaddress=0.0.0.0 connectport=8080 connectaddress=<WSL_IP>
```
Replace `<WSL_IP>` with the address you got from step 1.

### 4. Access from Another Device
On another device, open a browser and go to:
```
http://<Windows_IP>:8080/api/state
```
Replace `<Windows_IP>` with the address from step 2.

---

#### To Remove Port Forwarding (if needed)
```cmd
netsh interface portproxy delete v4tov4 listenport=8080 listenaddress=0.0.0.0
```

If you still have issues, check your firewall settings on Windows and ensure port 8080 is allowed.
