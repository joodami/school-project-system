// ใส่ URL ที่ได้จากขั้นตอน Deploy Web App ของคุณ
const API_URL = "https://script.google.com/macros/s/AKfycbyMWBqKDaLkiSgYvl--HsjbYcgRgmH_LBXdkUMsD7tIGjRnf_0H7h_8Miy-wCu_RY0j6w/exec"; 

// 1. ฟังก์ชันดึงข้อมูลมาแสดงที่ Dashboard และ Table
async function fetchDashboardData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        // อัปเดตตัวเลขสรุป (Summary)
        document.getElementById('totalProjects').innerText = data.summary.totalProjects;
        document.getElementById('reportedCount').innerText = data.summary.reportedCount;
        document.getElementById('pendingCount').innerText = data.summary.pendingCount;
        document.getElementById('totalBudget').innerText = data.summary.totalBudget.toLocaleString();

        // สร้างตารางรายการโครงการ
        const tableBody = document.getElementById('projectTableBody');
        tableBody.innerHTML = ''; 

        data.projects.forEach(project => {
            const isDone = project.Status === 'รายงานแล้ว';
            const statusClass = isDone ? 'bg-success-subtle' : 'bg-warning-subtle';
            
            const row = `
                <tr>
                    <td class="ps-4 fw-medium text-dark">${project.Project_Name}</td>
                    <td><small class="text-secondary">${project.Department}</small></td>
                    <td class="fw-bold">${Number(project.Budget_Total).toLocaleString()}</td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${project.Status}
                        </span>
                    </td>
                    <td class="text-center">
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-secondary">ดู PDF</button>
                            <button class="btn btn-sm btn-outline-navy ms-1" style="border: 1px solid #1a3a5f; color: #1a3a5f;">รายงาน</button>
                        </div>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// 2. ฟังก์ชันส่งข้อมูลโครงการใหม่ (POST)
document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerText;
    
    // ดึงค่าจากฟอร์ม
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.action = "addProject"; 

    // ปิดปุ่มระหว่างรอ
    submitBtn.innerText = "กำลังประมวลผล...";
    submitBtn.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert("บันทึกข้อมูลโครงการเข้าสู่ระบบเรียบร้อยแล้ว");
            e.target.reset(); // ล้างฟอร์ม
            location.reload(); // โหลดหน้าใหม่เพื่ออัปเดตข้อมูล
        }
    } catch (error) {
        console.error("Error:", error);
        alert("ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ โปรดลองอีกครั้ง");
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
});

// เรียกใช้งานเมื่อโหลดหน้าเว็บ
fetchDashboardData();
