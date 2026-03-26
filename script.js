const API_URL = "https://script.google.com/macros/s/AKfycbyMWBqKDaLkiSgYvl--HsjbYcgRgmH_LBXdkUMsD7tIGjRnf_0H7h_8Miy-wCu_RY0j6w/exec"; 

// 1. ฟังก์ชันดึงข้อมูล Dashboard
async function fetchDashboardData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        // อัปเดตตัวเลขสรุป
        document.getElementById('totalProjects').innerText = data.summary.totalProjects;
        document.getElementById('reportedCount').innerText = data.summary.reportedCount;
        document.getElementById('pendingCount').innerText = data.summary.pendingCount;
        document.getElementById('totalBudget').innerText = data.summary.totalBudget.toLocaleString() + " ฿";

        // สร้างตารางโครงการ
        const tableBody = document.getElementById('projectTableBody');
        tableBody.innerHTML = ''; 

        data.projects.forEach(project => {
            const statusClass = project.Status === 'รายงานแล้ว' ? 'bg-success-subtle' : 'bg-warning-subtle';
            const row = `
                <tr>
                    <td class="fw-semibold">${project.Project_Name}</td>
                    <td><span class="badge bg-light text-dark border">${project.Department}</span></td>
                    <td>${Number(project.Budget_Total).toLocaleString()} ฿</td>
                    <td><span class="status-badge ${statusClass}">${project.Status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-secondary rounded-pill me-1">ดูไฟล์</button>
                        <button class="btn btn-sm btn-outline-primary rounded-pill">รายงาน</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// 2. ฟังก์ชันส่งข้อมูลโครงการใหม่
document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.action = "addProject"; 

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerText = "กำลังบันทึก...";
    submitBtn.disabled = true;

    try {
        // ส่งข้อมูลแบบ POST ไปยัง GAS Web App
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        alert("เพิ่มโครงการเรียบร้อยแล้วค่ะ ✨");
        location.reload(); 
    } catch (error) {
        console.error("Error:", error);
        alert("เกิดข้อผิดพลาด ลองตรวจสอบการตั้งค่า Permission ใน GAS นะคะ");
    } finally {
        submitBtn.innerText = "บันทึกข้อมูล";
        submitBtn.disabled = false;
    }
});

// โหลดข้อมูลทันทีเมื่อเปิดหน้าเว็บ
fetchDashboardData();
