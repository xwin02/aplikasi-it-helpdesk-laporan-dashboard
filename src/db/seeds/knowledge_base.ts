import { db } from '@/db';
import { knowledgeBase } from '@/db/schema';

async function main() {
    const now = Date.now();
    const oneMonthAgo = new Date(now - 30*24*60*60*1000).toISOString();
    const twoMonthsAgo = new Date(now - 60*24*60*60*1000).toISOString();
    const threeMonthsAgo = new Date(now - 90*24*60*60*1000).toISOString();
    const fourMonthsAgo = new Date(now - 120*24*60*60*1000).toISOString();
    const fiveMonthsAgo = new Date(now - 150*24*60*60*1000).toISOString();

    const sampleArticles = [
        {
            title: 'How to Reset Your Password',
            content: `If you've forgotten your password or need to reset it for security reasons, follow these steps:

**Prerequisites:**
- Access to your company email or registered phone number
- Employee ID number

**Self-Service Password Reset:**

1. Navigate to the company portal at portal.company.com
2. Click on "Forgot Password" link below the login form
3. Enter your email address and employee ID
4. Select verification method (email or SMS)
5. Enter the 6-digit verification code sent to you
6. Create a new password meeting these requirements:
   - Minimum 12 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character (!@#$%^&*)
7. Confirm your new password
8. Click "Reset Password"

**Important Notes:**
- Your new password cannot be the same as your last 5 passwords
- Passwords expire every 90 days
- After 3 failed login attempts, your account will be locked for 30 minutes

**If Self-Service Fails:**
Contact IT Help Desk:
- Phone: ext. 5555
- Email: helpdesk@company.com
- In person: Building A, Room 101

Have your employee ID ready when contacting support.`,
            category: 'access',
            tags: 'password,security,login,account',
            author: 'Emily Rodriguez',
            createdAt: threeMonthsAgo,
            updatedAt: threeMonthsAgo,
        },
        {
            title: 'VPN Setup Guide for Remote Access',
            content: `This guide will help you set up VPN access to connect to company resources remotely.

**Before You Begin:**
- Ensure you have approval for remote access
- Have your network credentials ready
- Stable internet connection required

**Installation Steps:**

**For Windows:**
1. Download Cisco AnyConnect from the company portal
2. Run the installer (AnyConnect-win-x64.msi)
3. Accept the license agreement and click Install
4. Wait for installation to complete
5. Launch Cisco AnyConnect from Start Menu
6. Enter VPN address: vpn.company.com
7. Click Connect
8. Enter your network username and password
9. Complete MFA verification on your phone
10. You should see "Connected" status

**For Mac:**
1. Download Cisco AnyConnect from the company portal
2. Open the .dmg file and run the installer
3. Click Continue through installation prompts
4. Enter your Mac password when prompted
5. Launch Cisco AnyConnect from Applications
6. Enter VPN address: vpn.company.com
7. Click Connect
8. Enter your network credentials
9. Complete MFA verification
10. Connection established

**Troubleshooting Common Issues:**

**Cannot Connect:**
- Verify internet connection is working
- Check VPN address is correct: vpn.company.com
- Restart the VPN client
- Try disconnecting and reconnecting

**Slow Connection:**
- Close unnecessary applications
- Restart your router
- Try connecting at off-peak hours

**Authentication Failed:**
- Verify username and password are correct
- Check if MFA app is working
- Reset password if necessary

For persistent issues, contact IT Support with error messages.`,
            category: 'network',
            tags: 'vpn,remote,network,security,connection',
            author: 'Mike Chen',
            createdAt: twoMonthsAgo,
            updatedAt: twoMonthsAgo,
        },
        {
            title: 'Printer Troubleshooting - Common Issues',
            content: `This guide covers common printer problems and their solutions.

**Issue 1: Printer Not Responding**

Steps to resolve:
1. Check if printer is powered on (look for lights)
2. Verify USB or network cable is securely connected
3. Check if printer is set as default:
   - Windows: Settings > Devices > Printers & Scanners
   - Mac: System Preferences > Printers & Scanners
4. Restart the printer (power off, wait 30 seconds, power on)
5. Restart your computer
6. Try printing a test page

**Issue 2: Paper Jam**

Steps to clear:
1. Turn off the printer
2. Open all access doors and trays
3. Gently remove any visible paper
4. Pull paper in the direction of paper path
5. Check for small torn pieces
6. Close all doors properly
7. Turn printer back on
8. Run cleaning cycle from printer menu

**Issue 3: Print Quality Issues**

For blurry or faded prints:
1. Check ink or toner levels
2. Run printer head cleaning utility
3. Align print heads through printer settings
4. Check paper type matches printer settings
5. Use appropriate paper for the job
6. Replace ink/toner cartridges if low

**Issue 4: Printer Offline**

Windows:
1. Control Panel > Devices and Printers
2. Right-click your printer
3. Uncheck "Use Printer Offline"
4. Click "Set as Default Printer"

Mac:
1. System Preferences > Printers & Scanners
2. Remove the printer (click -)
3. Re-add the printer (click +)

**When to Contact IT:**
- Hardware error messages
- Printer needs maintenance
- Unable to resolve after trying above steps
- Need toner/ink replacement

Call ext. 5555 or submit ticket through IT portal.`,
            category: 'hardware',
            tags: 'printer,hardware,troubleshooting,paper-jam',
            author: 'David Brown',
            createdAt: fourMonthsAgo,
            updatedAt: fourMonthsAgo,
        },
        {
            title: 'Installing Software from Company Portal',
            content: `Learn how to install approved software from the company's self-service portal.

**Accessing the Portal:**

1. Open your web browser
2. Navigate to: software.company.com
3. Log in with your network credentials
4. Complete MFA verification if prompted

**Installing Software:**

1. Once logged in, browse available applications
2. Use search bar to find specific software
3. Click on the application you need
4. Review system requirements and description
5. Click "Install" button
6. For Windows:
   - Download will start automatically
   - Locate downloaded .exe or .msi file
   - Right-click and "Run as Administrator"
   - Follow installation wizard
7. For Mac:
   - Download will start automatically
   - Open the .dmg or .pkg file
   - Drag to Applications folder or run installer
   - Enter Mac password if prompted

**Available Categories:**
- Productivity (Office, PDF readers)
- Development Tools (IDEs, databases)
- Communication (Chat, video conferencing)
- Security (Antivirus, VPN)
- Utilities (Compression tools, file managers)

**Software Approval Process:**

If you need software not in the portal:
1. Submit request through IT Help Desk
2. Include business justification
3. Provide software name and vendor
4. Wait for security review (3-5 business days)
5. You'll receive email when approved

**Important Notes:**
- Only install software from company portal
- Installing unauthorized software violates policy
- Software licenses are tracked and audited
- Uninstall unused software to free up licenses

**Troubleshooting:**
- Installation fails: Run as Administrator
- Cannot find software: Use search function or contact IT
- Download issues: Check internet connection
- License errors: Contact IT for license assignment

For assistance, contact IT Help Desk at helpdesk@company.com or ext. 5555.`,
            category: 'software',
            tags: 'software,installation,applications,portal',
            author: 'Sarah Johnson',
            createdAt: oneMonthAgo,
            updatedAt: oneMonthAgo,
        },
        {
            title: 'Connecting to Wireless Network',
            content: `This guide will help you connect your devices to the company wireless network.

**Office WiFi Networks:**
- CompanySecure: For company devices (encrypted)
- CompanyGuest: For visitors and personal devices

**Connecting Windows Device:**

1. Click WiFi icon in system tray (bottom right)
2. Select "CompanySecure" from network list
3. Click Connect
4. Check "Connect automatically"
5. Enter network credentials:
   - Username: your network username
   - Password: your network password
6. Click OK
7. Wait for connection to establish
8. Verify internet access

**Connecting Mac Device:**

1. Click WiFi icon in menu bar (top right)
2. Select "CompanySecure" from list
3. Enter network credentials when prompted
4. Click Join
5. If certificate warning appears, click Continue
6. Enter Mac password if requested
7. Connection established

**Connecting iPhone/iPad:**

1. Open Settings app
2. Tap Wi-Fi
3. Select "CompanySecure"
4. Enter username and password
5. Tap Join
6. Accept certificate if prompted
7. Connected

**Connecting Android Device:**

1. Open Settings
2. Tap Network & Internet
3. Tap Wi-Fi
4. Select "CompanySecure"
5. Enter credentials
6. Tap Connect
7. Accept certificate
8. Connection successful

**Guest Network Access:**

For visitors or personal devices:
1. Connect to "CompanyGuest"
2. Open web browser
3. Accept terms and conditions
4. Enter guest code (available from reception)
5. Access granted for 24 hours

**Troubleshooting:**

**Cannot See Network:**
- Ensure WiFi is enabled on device
- Move closer to access point
- Restart device

**Connection Drops:**
- Forget network and reconnect
- Update device WiFi drivers
- Check for device updates

**Authentication Failed:**
- Verify username and password
- Reset network password if needed
- Contact IT if account is locked

**Slow Speed:**
- Move to different location
- Disconnect from VPN if not needed
- Check for bandwidth-heavy applications

For additional help, contact IT Support at ext. 5555.`,
            category: 'network',
            tags: 'wifi,wireless,network,connection,setup',
            author: 'Mike Chen',
            createdAt: fiveMonthsAgo,
            updatedAt: fiveMonthsAgo,
        },
        {
            title: 'Email Setup on Mobile Devices',
            content: `Configure your company email account on iPhone and Android devices.

**Before You Begin:**
- Have your email address and password ready
- Ensure MFA app is installed and configured
- Have stable internet connection

**iPhone/iPad Setup:**

1. Open Settings app
2. Scroll down and tap "Mail"
3. Tap "Accounts"
4. Tap "Add Account"
5. Select "Microsoft Exchange" or "Office 365"
6. Enter your email address
7. Tap Next
8. Enter password
9. Complete MFA verification
10. Choose what to sync:
    - Mail: On
    - Contacts: On
    - Calendars: On
    - Notes: Optional
11. Tap Save
12. Wait for synchronization to complete

**Advanced Settings (if needed):**
- Server: outlook.office365.com
- Domain: Leave blank
- Username: Full email address

**Android Setup:**

1. Open Settings
2. Tap "Accounts" or "Accounts and Backup"
3. Tap "Add Account"
4. Select "Microsoft Exchange ActiveSync"
5. Enter email address and password
6. Tap Next or Manual Setup if needed
7. Complete MFA verification
8. Configure sync settings:
   - Sync interval: 15 minutes recommended
   - Amount to sync: 1 month
   - Enable email notifications
9. Accept security policies
10. Tap Done

**Using Outlook App (Recommended):**

For iPhone and Android:
1. Download Microsoft Outlook from App Store/Play Store
2. Open Outlook app
3. Tap "Get Started"
4. Enter company email address
5. Tap "Continue"
6. Enter password
7. Complete MFA verification
8. App configured automatically
9. Customize notifications and settings

**Security Settings:**

Required policies:
- Device PIN/password required
- Auto-lock after 5 minutes
- Remote wipe capability enabled

**Troubleshooting:**

**Emails Not Syncing:**
1. Check internet connection
2. Verify account credentials
3. Remove and re-add account
4. Check storage space on device
5. Update email app

**Cannot Send Emails:**
1. Check outgoing server settings
2. Verify SMTP authentication
3. Check attachment size (max 25MB)
4. Try sending without attachment

**Authentication Errors:**
1. Reset email password
2. Re-authenticate MFA
3. Check account status with IT
4. Verify device is compliant

**Calendar Not Syncing:**
1. Enable calendar sync in account settings
2. Check calendar permissions
3. Force sync from calendar app
4. Remove and re-add account

For additional support, contact IT Help Desk:
- Phone: ext. 5555
- Email: helpdesk@company.com`,
            category: 'software',
            tags: 'email,mobile,outlook,iphone,android',
            author: 'Sarah Johnson',
            createdAt: twoMonthsAgo,
            updatedAt: twoMonthsAgo,
        },
        {
            title: 'Mapping Network Drives',
            content: `Learn how to map shared network drives on your Windows computer for easy access to company files.

**Common Network Paths:**
- Department Shares: \\\\fileserver\\departments
- User Home Drives: \\\\fileserver\\users\\username
- Project Files: \\\\fileserver\\projects
- Company Resources: \\\\fileserver\\resources

**Mapping Network Drive on Windows 10/11:**

1. Open File Explorer (Windows + E)
2. Click "This PC" in left sidebar
3. Click "Map network drive" in toolbar (or right-click This PC)
4. Select drive letter (e.g., Z:)
5. Enter network path:
   - For department share: \\\\fileserver\\departments\\YourDept
   - For home drive: \\\\fileserver\\users\\yourusername
6. Check "Reconnect at sign-in" box
7. Check "Connect using different credentials" if needed
8. Click Finish
9. Enter network username and password if prompted
10. Check "Remember my credentials"
11. Click OK
12. Drive appears under "This PC"

**Quick Method Using Command Prompt:**

1. Press Windows + R
2. Type: cmd and press Enter
3. Type command: net use Z: \\\\fileserver\\departments\\YourDept /persistent:yes
4. Press Enter
5. Enter credentials if prompted

**Mapping Multiple Drives:**

Repeat process for each share:
- Y: drive for department files
- Z: drive for personal files
- X: drive for project files

**Setting Up Automatic Mapping:**

Create batch file for automatic mapping:
1. Open Notepad
2. Enter commands:
      net use Y: \\\\fileserver\\departments\\YourDept /persistent:yes
   net use Z: \\\\fileserver\\users\\yourusername /persistent:yes
   3. Save as MapDrives.bat
4. Place in Startup folder:
   - Press Windows + R
   - Type: shell:startup
   - Copy batch file here

**Troubleshooting Common Issues:**

**Drive Disconnected After Restart:**
1. Ensure "Reconnect at sign-in" was checked
2. Remap with /persistent:yes parameter
3. Check network connection at startup
4. Verify credentials are saved

**Access Denied Error:**
1. Verify you have permission to access share
2. Check username and password are correct
3. Contact department manager for access
4. Ensure account is not locked
5. Try connecting with \\\\fileserver\\sharename

**Cannot Find Network Path:**
1. Verify server name is correct
2. Check network connection (try ping fileserver)
3. Verify you're connected to company network (not guest WiFi)
4. Try using IP address instead of server name
5. Contact IT if server is down

**Slow Network Drive Performance:**
1. Check network connection speed
2. Disconnect from VPN if on-site
3. Close unnecessary applications
4. Avoid opening large files directly from network drive
5. Copy files to local drive for editing

**Removing Mapped Drive:**
1. Right-click the drive letter in File Explorer
2. Click "Disconnect"
3. Or use command: net use Z: /delete

**Best Practices:**
- Only map drives you regularly use
- Use consistent drive letters across devices
- Keep credentials updated
- Report access issues promptly
- Don't save sensitive files on network drives

For assistance with network drives, contact IT Support:
- Phone: ext. 5555
- Email: helpdesk@company.com
- Submit ticket: helpdesk.company.com`,
            category: 'network',
            tags: 'network,drive,storage,file-sharing,mapping',
            author: 'Emily Rodriguez',
            createdAt: threeMonthsAgo,
            updatedAt: threeMonthsAgo,
        },
    ];

    await db.insert(knowledgeBase).values(sampleArticles);
    
    console.log('✅ Knowledge base seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});