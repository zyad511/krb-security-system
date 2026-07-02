<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KRB SYSTEM | CENTRAL CONTROL INTERFACE</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-main: #000000;
            --bg-card: #09090b;
            --border-color: #27272a;
            --text-primary: #ffffff;
            --text-secondary: #a1a1aa;
            --accent-red: #ef4444;
            --accent-green: #22c55e;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif; }
        body { background-color: var(--bg-main); color: var(--text-primary); padding: 40px 20px; max-width: 1200px; margin: 0 auto; }
        
        header { border-bottom: 1px solid var(--border-color); padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; }
        header h1 { font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
        .status-badge { background-color: #18181b; border: 1px solid var(--border-color); padding: 6px 14px; border-radius: 9999px; font-size: 13px; color: var(--accent-green); display: flex; align-items: center; gap: 8px; }
        .status-badge::before { content: ''; width: 8px; height: 8px; background-color: var(--accent-green); border-radius: 50%; display: inline-block; }

        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 40px; }
        .card { background-color: var(--bg-card); border: 1px solid var(--border-color); padding: 30px; border-radius: 8px; }
        .card h2 { font-size: 18px; margin-bottom: 20px; font-weight: 600; color: var(--text-primary); border-right: 4px solid var(--text-primary); padding-right: 12px; }

        label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600; }
        input, textarea, select { width: 100%; background: #18181b; border: 1px solid var(--border-color); color: var(--text-primary); padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; transition: all 0.2s; }
        input:focus, textarea:focus, select:focus { border-color: #71717a; outline: none; }

        .btn { width: 100%; background: var(--text-primary); color: var(--bg-main); border: none; padding: 14px; font-weight: 700; cursor: pointer; border-radius: 6px; transition: all 0.2s; font-size: 14px; }
        .btn:hover { background: #e4e4e7; transform: translateY(-1px); }
        .btn-danger { background: transparent; border: 1px solid var(--accent-red); color: var(--accent-red); }
        .btn-danger:hover { background: var(--accent-red); color: #ffffff; }

        .table-container { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; padding: 20px; }
        table { width: 100%; border-collapse: collapse; text-align: right; }
        th { color: var(--text-secondary); font-size: 13px; font-weight: 600; padding: 16px; border-bottom: 1px solid var(--border-color); }
        td { padding: 16px; border-bottom: 1px solid var(--border-color); font-size: 14px; color: #e4e4e7; }
        
        .code-style { background: #18181b; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #f4f4f5; border: 1px solid var(--border-color); }
    </style>
</head>
<body>

    <header>
        <h1>KRB ADMINISTRATIVE INFRASTRUCTURE</h1>
        <div class="status-badge">مرحباً أبو عتب | جدار الحماية نشط ومستقر</div>
    </header>

    <div class="grid">
        <div class="card">
            <h2>✉️ إرسال رسالة مخصصة لسيرفر معين</h2>
            <form action="/api/send-custom" method="POST">
                <label>معرف السيرفر المستهدف (Guild ID) *</label>
                <input type="text" name="guildId" placeholder="أدخل الـ ID الخاص بالسيرفر هنا..." required>
                
                <label>معرف القناة النصية (Channel ID) - اختياري</label>
                <input type="text" name="channelId" placeholder="اتركه فارغاً للإرسال في القناة الافتراضية للقروب...">

                <label>نص الرسالة المراد توجيهها</label>
                <textarea name="message" rows="4" placeholder="اكتب نص رسالتك الملكية هنا..." required></textarea>
                
                <button type="submit" class="btn">إطلاق الإرسال الفوري 🚀</button>
            </form>
        </div>

        <div class="card">
            <h2>🚫 إدارة حظر النظام (Blacklist Control)</h2>
            <form action="/api/blacklist" method="POST">
                <label>نوع الهدف المراد حظره</label>
                <select name="type">
                    <option value="user">حظر مستخدم محدد (User ID)</option>
                    <option value="guild">حظر سيرفر بالكامل (Server ID)</option>
                </select>

                <label>المعرف الفريد (ID) *</label>
                <input type="text" name="targetId" placeholder="ضع الرقم التعريفي ID هنا..." required>

                <label>الإجراء المطلوب اتخاذه</label>
                <select name="action">
                    <option value="add">إدراج وتفعيل المنشن الفوري لحسابي 🔒</option>
                    <option value="remove">إزالة من القائمة السوداء وفك العزل ✅</option>
                </select>
                
                <button type="submit" class="btn btn-danger">تنفيذ وتحديث جدار العزل الأمني 🛡️</button>
            </form>
        </div>
    </div>

    <div class="table-container">
        <h2 style="font-size: 18px; margin-bottom: 20px; font-weight: 600;">📦 مراقبة خريطة السيرفرات الحية المتصلة بالبوت</h2>
        <table>
            <thead>
                <tr>
                    <th>اسم السيرفر المضيف</th>
                    <th>معرف السيرفر (ID)</th>
                    <th>إجمالي عدد الأعضاء</th>
                    <th>الحالة الأمنية بالنظام</th>
                </tr>
            </thead>
            <tbody id="servers-list">
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--text-secondary);">جاري سحب البيانات ومزامنة الشبكة...</td>
                </tr>
            </tbody>
        </table>
    </div>

    <script>
        // كود تلقائي مدمج لجلب بيانات السيرفرات من الـ API الحية وتحديث الجدول تلقائياً
        async function loadConnectedServers() {
            try {
                const response = await fetch('/api/servers');
                const servers = await response.json();
                const tbody = document.getElementById('servers-list');
                
                if(servers.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">لا يوجد سيرفرات متصلة بالبوت حالياً.</td></tr>`;
                    return;
                }

                tbody.innerHTML = servers.map(srv => `
                    <tr>
                        <td>${srv.name}</td>
                        <td><span class="code-style">${srv.id}</span></td>
                        <td>${srv.memberCount} عضو</td>
                        <td>
                            <span style="color: ${srv.isBlacklisted ? '#ef4444' : '#22c55e'}">
                                ${srv.isBlacklisted ? '⛔ محظور ومعزول' : '🟢 محمي ومصرح'}
                            </span>
                        </td>
                    </tr>
                `).join('');
            } catch (err) {
                console.error("خطأ أثناء تحديث جدول السيرفرات:", err);
            }
        }
        // تشغيل الجلب التلقائي بمجرد فتح الصفحة
        loadConnectedServers();
    </script>
</body>
</html>
