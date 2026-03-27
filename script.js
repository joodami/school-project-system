// 1. กำหนดค่าเริ่มต้นและเชื่อมต่อ API
const API_URL = "https://script.google.com/macros/s/AKfycbzNgRqYHoezZkOvLXD61ZipvbL7Oiv55KWWKFcMreC2Dw7aQoSy77Ae6v1WaB3LdAxYvQ/exec"; 
let allProjectsData = [];

// 2. ฟังก์ชันดึงข้อมูลจาก Google Sheets มาแสดงผล
async function fetchDashboardData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        allProjectsData = data.projects;
        
        // อัปเดตตัวเลขบน Dashboard
        document.getElementById('totalProjects').innerText = data.summary.totalProjects;
        document.getElementById('reportedCount').innerText = data.summary.reportedCount;
        document.getElementById('pendingCount').innerText = data.summary.pendingCount;
        document.getElementById('totalBudget').innerText = data.summary.totalBudget.toLocaleString();
        
        renderTable(allProjectsData);
    } catch (e) { 
        console.error("Fetch Error:", e);
        alert("ไม่สามารถโหลดข้อมูลได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
    }
}

// 3. ฟังก์ชันสร้างแถวในตาราง
function renderTable(projects) {
    const tableBody = document.getElementById('projectTableBody');
    tableBody.innerHTML = '';
    
    if (projects.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-5 text-muted">ไม่พบข้อมูลโครงการในหมวดนี้</td></tr>';
        return;
    }

    projects.forEach(p => {
        const isDone = p.Status === 'รายงานแล้ว';
        const row = `
            <tr>
                <td class="ps-4">
                    <div class="fw-bold text-dark" style="font-size: 1rem;">${p.Project_Name}</div>
                    <small class="text-muted"><i class="bi bi-person me-1"></i>ผู้รับผิดชอบ: ${p.Responsible_Person || '-'}</small>
                </td>
                <td data-label="ปีงบประมาณ">
                    <span class="badge bg-light text-dark border small">${p.Fiscal_Year}</span>
                </td>
                <td data-label="งบประมาณ" class="fw-bold text-primary">
                    ${p.Budget_Total.toLocaleString()} บาท
                </td>
                <td data-label="สถานะการดำเนินงาน">
                    <span class="badge ${isDone ? 'bg-success' : 'bg-warning text-dark'} shadow-sm">
                        <i class="bi ${isDone ? 'bi-check-circle-fill' : 'bi-clock-history'} me-1"></i>${p.Status}
                    </span>
                </td>
                <td data-label="จัดการข้อมูล">
                    <div class="d-flex flex-column gap-2 align-items-center">
                        <div class="btn-group w-100 shadow-sm">
                            <button onclick="window.open('${p.Project_File_URL}', '_blank')" class="btn btn-outline-primary py-2" ${p.Project_File_URL === '-' ? 'disabled' : ''}>
                                <i class="bi bi-file-earmark-text"></i> ดูแผนโครงการ
                            </button>
                            <button onclick="viewPDF('${p.Project_ID}')" class="btn btn-outline-secondary py-2" ${!isDone ? 'disabled' : ''}>
                                <i class="bi bi-file-earmark-check"></i> ดูรายงานผล
                            </button>
                        </div>
                        ${!isDone ? 
                            `<button onclick="openReportModal('${p.Project_ID}', '${p.Project_Name}')" class="btn btn-success w-100 rounded-3 py-2 fw-bold shadow-sm">
                                <i class="bi bi-cloud-upload"></i> กดเพื่อส่งรายงานผลที่นี่
                            </button>` : 
                            `<div class="alert alert-success py-2 w-100 mb-0 small fw-bold text-center"><i class="bi bi-patch-check"></i> ส่งรายงานเรียบร้อยแล้ว</div>`
                        }
                    </div>
                </td>
            </tr>`;
        tableBody.innerHTML += row;
    });
}

// 4. ฟังก์ชันกรองข้อมูลตามกลุ่มงาน
function filterTable(dept) {
    // อัปเดตสถานะปุ่มเมนู
    document.querySelectorAll('#departmentTabs .nav-link').forEach(b => b.classList.remove('active'));
    if (event) event.target.classList.add('active');

    const filtered = dept === 'ทั้งหมด' 
        ? allProjectsData 
        : allProjectsData.filter(p => p.Department === dept);
    
    renderTable(filtered);
}

// 5. ฟังก์ชันเปิด Modal ส่งรายงาน
function openReportModal(id, name) {
    document.getElementById('report_project_id').value = id;
    document.getElementById('report_project_name').innerText = name;
    const modal = new bootstrap.Modal(document.getElementById('reportModal'));
    modal.show();
}

// 6. ฟังก์ชันดูไฟล์ PDF รายงาน
async function viewPDF(id) {
    try {
        const res = await fetch(`${API_URL}?action=viewPDF&projectId=${id}`);
        const url = await res.text();
        if(url.startsWith("http")) {
            window.open(url, '_blank');
        } else {
            alert("ไม่พบไฟล์รายงานในระบบค่ะ");
        }
    } catch (e) {
        alert("เกิดข้อผิดพลาดในการเรียกดูไฟล์");
    }
}

// 7. ฟังก์ชันแสดงการแจ้งเตือนสำเร็จ
function showSuccess(title, msg) {
    document.getElementById('successTitle').innerText = title;
    document.getElementById('successMessage').innerText = msg;
    const sModal = new bootstrap.Modal(document.getElementById('successModal'));
    sModal.show();
    // รีโหลดหน้าเว็บเมื่อปิด Modal แจ้งเตือน
    document.getElementById('successModal').addEventListener('hidden.bs.modal', () => {
        location.reload();
    });
}

// 8. การทำงานของฟอร์มเพิ่มโครงการ
document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true; 
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังบันทึก...';
    
    const data = Object.fromEntries(new FormData(e.target));
    data.action = "addProject";
    
    const fileInput = document.getElementById('attachProjectFile');
    if(fileInput.files.length > 0) {
        const file = fileInput.files[0];
        data.projectFile = {
            base64: await convertFileToBase64(file),
            type: file.type,
            name: file.name
        };
    }
    
    try {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify(data) });
        showSuccess("บันทึกสำเร็จ!", "โครงการใหม่ถูกเพิ่มเข้าสู่ระบบแล้ว");
    } catch (e) {
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        btn.disabled = false;
        btn.innerText = "บันทึกข้อมูลโครงการ";
    }
});

// 9. การทำงานของฟอร์มส่งรายงาน
document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('reportSubmitBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังอัปโหลด...';
    
    const data = {
        action: "submitReport",
        Project_ID: document.getElementById('report_project_id').value
    };
    
    const fileInput = document.getElementById('reportFile');
    const file = fileInput.files[0];
    data.reportFile = {
        base64: await convertFileToBase64(file),
        type: file.type,
        name: file.name
    };
    
    try {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify(data) });
        showSuccess("ส่งรายงานแล้ว!", "ขอบคุณที่ดำเนินการส่งรายงานตามกำหนดค่ะ");
    } catch (e) {
        alert("เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
        btn.disabled = false;
        btn.innerText = "ยืนยันการส่งรายงาน";
    }
});

// ฟังก์ชันช่วยแปลงไฟล์เป็น Base64
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

// เริ่มต้นโหลดข้อมูลเมื่อเปิดหน้าเว็บ
fetchDashboardData();
