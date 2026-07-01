import 'dotenv/config';
import { db } from '@/db';
import { user, account, tickets, knowledgeBase, projects, tasks, subtasks, taskComments, projectMembers, milestones } from '@/db/schema';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Create Superadmin User
    console.log('👤 Creating superadmin user...');
    
    const hashedPassword = await bcrypt.hash('H3lpd35k@', 10);
    const adminId = `admin-${Date.now()}`;
    
    await db.insert(user).values({
      id: adminId,
      name: 'Super Admin',
      email: 'it@mamagreen.com',
      emailVerified: true,
      role: 'admin',
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create account entry for password auth
    await db.insert(account).values({
      id: `account-${adminId}`,
      accountId: adminId,
      providerId: 'credential',
      userId: adminId,
      password: hashedPassword,
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      scope: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Superadmin created: it@mamagreen.com / H3lpd35k@\n');

    // 2. Create Additional Users
    console.log('👥 Creating additional users...');
    
    const users = [
      { name: 'John Doe', email: 'john@mamagreen.com', role: 'user' },
      { name: 'Jane Smith', email: 'jane@mamagreen.com', role: 'user' },
      { name: 'Bob Wilson', email: 'bob@mamagreen.com', role: 'user' },
      { name: 'Alice Brown', email: 'alice@mamagreen.com', role: 'admin' },
    ];

    const userIds: Record<string, string> = {};
    userIds['Super Admin'] = adminId;

    for (const userData of users) {
      const userId = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const userPassword = await bcrypt.hash('password123', 10);
      
      await db.insert(user).values({
        id: userId,
        name: userData.name,
        email: userData.email,
        emailVerified: true,
        role: userData.role,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db.insert(account).values({
        id: `account-${userId}`,
        accountId: userId,
        providerId: 'credential',
        userId: userId,
        password: userPassword,
        accessToken: null,
        refreshToken: null,
        idToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        scope: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userIds[userData.name] = userId;
    }

    console.log(`✅ Created ${users.length} additional users\n`);

    // 3. Create Tickets
    console.log('🎫 Creating tickets...');
    
    const ticketData = [
      {
        title: 'Laptop tidak bisa connect WiFi',
        description: 'Laptop saya tidak bisa terkoneksi ke WiFi kantor. Sudah coba restart tapi masih tidak bisa.',
        status: 'open',
        priority: 'high',
        category: 'Hardware',
        requesterName: 'John Doe',
        department: 'Marketing',
        assignedTo: 'Alice Brown',
        userId: userIds['John Doe'],
      },
      {
        title: 'Password email lupa',
        description: 'Saya lupa password email kantor. Mohon di-reset.',
        status: 'in-progress',
        priority: 'medium',
        category: 'Account',
        requesterName: 'Jane Smith',
        department: 'Finance',
        assignedTo: 'Super Admin',
        userId: userIds['Jane Smith'],
      },
      {
        title: 'Printer tidak bisa print warna',
        description: 'Printer di lantai 2 hanya bisa print hitam putih, padahal sebelumnya bisa warna.',
        status: 'open',
        priority: 'low',
        category: 'Hardware',
        requesterName: 'Bob Wilson',
        department: 'Operations',
        assignedTo: null,
        userId: userIds['Bob Wilson'],
      },
      {
        title: 'Request install software Adobe',
        description: 'Butuh install Adobe Photoshop dan Illustrator untuk keperluan design.',
        status: 'resolved',
        priority: 'medium',
        category: 'Software',
        requesterName: 'John Doe',
        department: 'Marketing',
        assignedTo: 'Alice Brown',
        userId: userIds['John Doe'],
        resolvedAt: new Date(),
      },
      {
        title: 'Akses VPN tidak bisa',
        description: 'VPN kantor tidak bisa connect dari rumah. Error "Connection timeout".',
        status: 'open',
        priority: 'urgent',
        category: 'Network',
        requesterName: 'Jane Smith',
        department: 'Finance',
        assignedTo: 'Super Admin',
        userId: userIds['Jane Smith'],
      },
    ];

    for (const ticket of ticketData) {
      await db.insert(tickets).values({
        ...ticket,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resolvedAt: ticket.resolvedAt?.toISOString() || null,
      });
    }

    console.log(`✅ Created ${ticketData.length} tickets\n`);

    // 4. Create Knowledge Base Articles
    console.log('📚 Creating knowledge base articles...');
    
    const kbArticles = [
      {
        title: 'Cara Reset Password Email',
        content: `# Cara Reset Password Email Kantor

## Langkah-langkah:
1. Buka halaman https://mail.mamagreen.com/reset
2. Masukkan email kantor Anda
3. Klik "Send Reset Link"
4. Cek inbox email Anda
5. Klik link reset yang dikirim
6. Masukkan password baru (minimal 8 karakter)
7. Konfirmasi password baru
8. Klik "Reset Password"

## Catatan:
- Link reset berlaku selama 1 jam
- Password harus mengandung huruf besar, huruf kecil, dan angka
- Jangan gunakan password yang sama dengan sebelumnya`,
        category: 'Account Management',
        tags: 'email,password,reset,account',
        author: 'Super Admin',
        attachments: null,
      },
      {
        title: 'Troubleshooting Koneksi WiFi',
        content: `# Troubleshooting Koneksi WiFi

## Masalah Umum dan Solusi:

### 1. Tidak bisa connect ke WiFi
- Pastikan WiFi adapter aktif
- Restart WiFi adapter
- Lupa jaringan dan connect ulang
- Restart laptop

### 2. WiFi connect tapi tidak bisa internet
- Cek IP address (harus 192.168.1.x)
- Release dan renew IP: ipconfig /release, ipconfig /renew
- Flush DNS: ipconfig /flushdns
- Restart router jika perlu

### 3. Koneksi lambat
- Cek jumlah device yang terkoneksi
- Pindah ke channel WiFi yang berbeda
- Posisikan lebih dekat ke router`,
        category: 'Network',
        tags: 'wifi,network,troubleshooting,connection',
        author: 'Alice Brown',
        attachments: null,
      },
      {
        title: 'Panduan Penggunaan VPN',
        content: `# Panduan Penggunaan VPN Kantor

## Setup VPN:
1. Download OpenVPN Client
2. Install dengan admin rights
3. Import config file yang diberikan IT
4. Masukkan username dan password kantor
5. Connect

## Tips:
- Gunakan VPN saat WFH atau di luar kantor
- Disconnect VPN jika tidak digunakan
- VPN akan auto-disconnect setelah 8 jam
- Jangan share credentials VPN`,
        category: 'Network',
        tags: 'vpn,remote,security,access',
        author: 'Super Admin',
        attachments: null,
      },
      {
        title: 'Request Software Installation',
        content: `# Cara Request Install Software

## Prosedur:
1. Buat tiket baru di helpdesk
2. Pilih kategori "Software"
3. Sebutkan nama software yang dibutuhkan
4. Jelaskan tujuan penggunaan
5. Tunggu approval dari IT Manager
6. IT akan install setelah approved

## Software yang boleh diinstall:
- Microsoft Office Suite
- Adobe Creative Cloud (dengan approval)
- Browser (Chrome, Firefox, Edge)
- Zoom, Teams, Slack
- Software development (dengan approval)

## Software yang tidak diperbolehkan:
- Game dan entertainment
- P2P/Torrent software
- Cracked/pirated software`,
        category: 'Software',
        tags: 'software,installation,request,policy',
        author: 'Alice Brown',
        attachments: null,
      },
    ];

    for (const article of kbArticles) {
      await db.insert(knowledgeBase).values({
        ...article,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    console.log(`✅ Created ${kbArticles.length} knowledge base articles\n`);

    // 5. Create Projects
    console.log('📁 Creating projects...');
    
    const projectsData = [
      {
        title: 'Upgrade Network Infrastructure',
        description: 'Upgrade semua switch dan access point di gedung kantor untuk meningkatkan kecepatan dan stabilitas network.',
        status: 'in-progress',
        priority: 'high',
        assignedTo: userIds['Alice Brown'],
        createdBy: adminId,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      },
      {
        title: 'Migrasi Email Server',
        description: 'Migrasi dari email server lama ke Microsoft 365 untuk semua karyawan.',
        status: 'planning',
        priority: 'high',
        assignedTo: adminId,
        createdBy: adminId,
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
      },
      {
        title: 'IT Asset Management System',
        description: 'Implementasi sistem tracking untuk semua aset IT perusahaan.',
        status: 'backlog',
        priority: 'medium',
        assignedTo: userIds['Alice Brown'],
        createdBy: adminId,
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      },
    ];

    const projectIds: number[] = [];
    for (const project of projectsData) {
      const [result] = await db.insert(projects).values({
        ...project,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      projectIds.push(result.insertId);
    }

    console.log(`✅ Created ${projectsData.length} projects\n`);

    // 6. Create Tasks for first project
    console.log('✅ Creating tasks...');
    
    const tasksData = [
      {
        projectId: projectIds[0],
        title: 'Survey existing network infrastructure',
        description: 'Dokumentasi semua switch, router, dan access point yang ada saat ini',
        status: 'completed',
        priority: 'high',
        assignedTo: userIds['Alice Brown'],
        createdBy: adminId,
        estimatedHours: 8,
        actualHours: 6,
        progress: 100,
        order: 0,
        completedAt: new Date().toISOString(),
      },
      {
        projectId: projectIds[0],
        title: 'Procurement new equipment',
        description: 'Beli switch dan access point baru sesuai spesifikasi',
        status: 'in-progress',
        priority: 'high',
        assignedTo: userIds['Alice Brown'],
        createdBy: adminId,
        estimatedHours: 16,
        actualHours: 8,
        progress: 50,
        order: 1,
      },
      {
        projectId: projectIds[0],
        title: 'Install and configure equipment',
        description: 'Install switch dan access point baru, konfigurasi VLAN dan security',
        status: 'todo',
        priority: 'high',
        assignedTo: userIds['Bob Wilson'],
        createdBy: adminId,
        estimatedHours: 24,
        actualHours: 0,
        progress: 0,
        order: 2,
      },
      {
        projectId: projectIds[0],
        title: 'Testing and validation',
        description: 'Test koneksi, kecepatan, dan stabilitas network setelah upgrade',
        status: 'todo',
        priority: 'medium',
        assignedTo: userIds['Alice Brown'],
        createdBy: adminId,
        estimatedHours: 8,
        actualHours: 0,
        progress: 0,
        order: 3,
      },
    ];

    const taskIds: number[] = [];
    for (const task of tasksData) {
      const [result] = await db.insert(tasks).values({
        ...task,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      taskIds.push(result.insertId);
    }

    console.log(`✅ Created ${tasksData.length} tasks\n`);

    // 7. Create Subtasks
    console.log('📝 Creating subtasks...');
    
    const subtasksData = [
      {
        taskId: taskIds[0],
        title: 'Map gedung lantai 1',
        completed: true,
        order: 0,
      },
      {
        taskId: taskIds[0],
        title: 'Map gedung lantai 2',
        completed: true,
        order: 1,
      },
      {
        taskId: taskIds[0],
        title: 'Map gedung lantai 3',
        completed: true,
        order: 2,
      },
      {
        taskId: taskIds[1],
        title: 'Request quotation dari vendor',
        completed: true,
        order: 0,
      },
      {
        taskId: taskIds[1],
        title: 'Approval budget',
        completed: false,
        order: 1,
      },
      {
        taskId: taskIds[1],
        title: 'Purchase order',
        completed: false,
        order: 2,
      },
    ];

    for (const subtask of subtasksData) {
      await db.insert(subtasks).values({
        ...subtask,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    console.log(`✅ Created ${subtasksData.length} subtasks\n`);

    // 8. Create Task Comments
    console.log('💬 Creating task comments...');
    
    const commentsData = [
      {
        taskId: taskIds[0],
        userId: userIds['Alice Brown'],
        content: 'Survey sudah selesai. Total ada 15 switch dan 30 access point yang perlu di-upgrade.',
      },
      {
        taskId: taskIds[1],
        userId: adminId,
        content: 'Sudah dapat quotation dari 3 vendor. Sedang proses review.',
      },
      {
        taskId: taskIds[1],
        userId: userIds['Alice Brown'],
        content: 'Vendor A paling competitive dari segi harga dan spek.',
      },
    ];

    for (const comment of commentsData) {
      await db.insert(taskComments).values({
        ...comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    console.log(`✅ Created ${commentsData.length} comments\n`);

    // 9. Create Project Members
    console.log('👥 Creating project members...');
    
    const membersData = [
      {
        projectId: projectIds[0],
        userId: adminId,
        role: 'owner',
      },
      {
        projectId: projectIds[0],
        userId: userIds['Alice Brown'],
        role: 'member',
      },
      {
        projectId: projectIds[0],
        userId: userIds['Bob Wilson'],
        role: 'member',
      },
    ];

    for (const member of membersData) {
      await db.insert(projectMembers).values({
        ...member,
        joinedAt: new Date().toISOString(),
      });
    }

    console.log(`✅ Created ${membersData.length} project members\n`);

    // 10. Create Milestones
    console.log('🎯 Creating milestones...');
    
    const milestonesData = [
      {
        projectId: projectIds[0],
        title: 'Phase 1: Planning & Procurement',
        description: 'Selesai survey dan procurement equipment',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        order: 0,
      },
      {
        projectId: projectIds[0],
        title: 'Phase 2: Installation',
        description: 'Selesai install semua equipment',
        dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        order: 1,
      },
      {
        projectId: projectIds[0],
        title: 'Phase 3: Testing & Go Live',
        description: 'Testing selesai dan network upgrade live',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        order: 2,
      },
    ];

    for (const milestone of milestonesData) {
      await db.insert(milestones).values({
        ...milestone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    console.log(`✅ Created ${milestonesData.length} milestones\n`);

    console.log('✅ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: ${users.length + 1} (including superadmin)`);
    console.log(`   - Tickets: ${ticketData.length}`);
    console.log(`   - Knowledge Base: ${kbArticles.length}`);
    console.log(`   - Projects: ${projectsData.length}`);
    console.log(`   - Tasks: ${tasksData.length}`);
    console.log(`   - Subtasks: ${subtasksData.length}`);
    console.log(`   - Comments: ${commentsData.length}`);
    console.log(`   - Project Members: ${membersData.length}`);
    console.log(`   - Milestones: ${milestonesData.length}`);
    console.log('\n🔐 Superadmin Login:');
    console.log('   Email: it@mamagreen.com');
    console.log('   Password: H3lpd35k@');
    console.log('\n👥 Other users (password: password123):');
    console.log('   - john@mamagreen.com (user)');
    console.log('   - jane@mamagreen.com (user)');
    console.log('   - bob@mamagreen.com (user)');
    console.log('   - alice@mamagreen.com (admin)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed
seed()
  .then(() => {
    console.log('\n✅ Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
