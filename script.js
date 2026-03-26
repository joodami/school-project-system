const API_URL = "https://script.google.com/macros/s/AKfycbyMWBqKDaLkiSgYvl--HsjbYcgRgmH_LBXdkUMsD7tIGjRnf_0H7h_8Miy-wCu_RY0j6w/exec"; 

// 1. ฟังก์ชันดึงข้อมูลมาแสดงที่ Dashboard และ Table
async function fetchDashboardData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        document.getElementById('totalProjects').innerText = data.summary.totalProjects;
        document.getElementById('reportedCount').innerText = data.summary.reportedCount;
        document.getElementById('pendingCount').innerText = data.summary.pendingCount;
        document.getElementById('totalBudget').innerText = data.summary.totalBudget.toLocaleString();

        const tableBody = document.getElementById('projectTableBody');
        tableBody.innerHTML = ''; 

        data.projects.forEach(project => {
            const isDone = project.Status === 'รายงานแล้ว';
            const statusClass = isDone ? 'bg-success-subtle' : 'bg-warning-subtle';
            
            // แก้ไขจุดนี้: ใส่ onclick ให้ปุ่มรายงาน
            const row = `
                <tr>
                    <td class="ps-4 fw-medium text-dark">${project.Project_Name}</td>
                    <td><small class="text-secondary">${project.Department}</small></td>
                    <td class="fw-bold">${Number(project.Budget_Total).toLocaleString()}</td>
                    <td><span class="status-badge ${statusClass}">${project.Status}</span></td>
                    <td class="text-center">
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-secondary">ดู PDF</button>
                            <button onclick="openReportModal('${project.Project_ID}', '${project.Project_Name}')" 
                                    class="btn btn-sm btn-outline-navy ms-1" 
                                    style="border: 1px solid #1a3a5f; color: #1a3a5f;">
                                รายงาน
                            </button>
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

// 2. ฟังก์ชันเปิด Modal รายงานผล
function openReportModal(id, name) {
    document.getElementById('report_project_id').value = id;
    document.getElementById('report_project_name').value = name;
    const reportModal = new bootstrap.Modal(document.getElementById('reportModal'));
    reportModal.show();
}

// 3. ฟังก์ชันส่งข้อมูลโครงการใหม่
document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerText;
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.action = "addProject"; 

    submitBtn.innerText = "กำลังประมวลผล...";
    submitBtn.disabled = true;

    try {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify(data) });
        alert("บันทึกข้อมูลโครงการเรียบร้อยแล้ว");
        location.reload();
    } catch (error) {
        alert("เกิดข้อผิดพลาด โปรดลองอีกครั้ง");
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
});

// 4. ฟังก์ชันส่งรายงานผลและอัปโหลดรูป
document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('reportSubmitBtn');
    submitBtn.innerText = "กำลังอัปโหลดรูปและบันทึก...";
    submitBtn.disabled = true;

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    const fileInput = document.getElementById('photoFiles');
    const files = fileInput.files;
    const photoData = [];

    for (let i = 0; i < files.length; i++) {
        const base64 = await toBase64(files[i]);
        photoData.push({
            base64: base64.split(',')[1],
            type: files[i].type,
            name: files[i].name
        });
    }

    data.photos = photoData;
    data.action = "submitReport";

    try {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify(data) });
        alert("ส่งรายงานเรียบร้อยแล้วค่ะ ✨");
        location.reload();
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการส่งรายงาน");
    } finally {
        submitBtn.innerText = "ส่งรายงานและบันทึกผล";
        submitBtn.disabled = false;
    }
});

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

fetchDashboardData();
