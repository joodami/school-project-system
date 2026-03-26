const API_URL = "https://script.google.com/macros/s/AKfycbx0vPhDlmARSw5_0fTSGmtXM2ImBQvPh1T6Gsn-Qf_m6lHUS8rm_3mMkLdJ3ufKetCcCA/exec"; 

// ฟังก์ชันแสดงการแจ้งเตือนแบบ Toast
function showNotification(message, isSuccess = true) {
    const toastEl = document.getElementById('liveToast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.innerText = message;
    
    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-navy');
    if (isSuccess) {
        toastEl.classList.add('bg-navy');
        toastEl.style.backgroundColor = "#1a3a5f"; 
    } else {
        toastEl.classList.add('bg-danger');
    }
    
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
}

// 1. ดึงข้อมูล Dashboard และตาราง
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
            
            const row = `
                <tr>
                    <td class="ps-4 fw-medium text-dark">${project.Project_Name}</td>
                    <td><small class="text-secondary">${project.Department}</small></td>
                    <td class="fw-bold">${Number(project.Budget_Total).toLocaleString()}</td>
                    <td><span class="status-badge ${statusClass}">${project.Status}</span></td>
                    <td class="text-center">
                        <div class="btn-group">
                            <button onclick="viewPDF('${project.Project_ID}')" class="btn btn-sm btn-outline-secondary">
                                <i class="bi bi-file-pdf"></i> PDF
                            </button>
                            ${!isDone 
                                ? `<button onclick="openReportModal('${project.Project_ID}', '${project.Project_Name}')" class="btn btn-sm btn-outline-navy ms-1" style="border: 1px solid #1a3a5f; color: #1a3a5f;">รายงาน</button>` 
                                : `<button class="btn btn-sm btn-light ms-1" disabled>เรียบร้อย</button>`
                            }
                        </div>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("Error:", error);
        showNotification("ไม่สามารถโหลดข้อมูลได้ โปรดตรวจสอบการเชื่อมต่อ", false);
    }
}

// 2. ฟังก์ชันออกรายงาน PDF และเปิดแท็บใหม่
async function viewPDF(projectId) {
    showNotification("⏳ กำลังสร้างเอกสาร PDF โปรดรอสักครู่...");
    try {
        // ส่งคำขอแบบ GET พร้อม parameter action=viewPDF
        const response = await fetch(`${API_URL}?action=viewPDF&projectId=${projectId}`);
        const pdfUrl = await response.text();
        
        if (pdfUrl.includes("http")) {
            window.open(pdfUrl, '_blank'); // เปิดลิงก์ PDF ในหน้าต่างใหม่
            showNotification("✅ สร้าง PDF สำเร็จ");
        } else {
            showNotification("❌ ตรวจพบข้อผิดพลาด: " + pdfUrl, false);
        }
    } catch (error) {
        showNotification("❌ ไม่สามารถสร้าง PDF ได้ในขณะนี้", false);
    }
}

// 3. เปิดหน้าต่างรายงาน
function openReportModal(id, name) {
    document.getElementById('report_project_id').value = id;
    document.getElementById('report_project_name').value = name;
    const reportModal = new bootstrap.Modal(document.getElementById('reportModal'));
    reportModal.show();
}

// 4. บันทึกโครงการใหม่
document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> กำลังบันทึก...';

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.action = "addProject"; 

    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(data) });
        const result = await res.text();
        if (result === "Success") {
            showNotification("✅ เพิ่มโครงการใหม่เข้าสู่ระบบเรียบร้อยแล้วค่ะ");
            e.target.reset();
            bootstrap.Modal.getInstance(document.getElementById('addProjectModal')).hide();
            setTimeout(() => location.reload(), 1500);
        }
    } catch (error) {
        showNotification("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ", false);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "บันทึกข้อมูลลงระบบ";
    }
});

// 5. ส่งรายงานผลโครงการ (ปรับปรุงให้เก็บค่า PDCA และหัวข้อใหม่)
document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('reportSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> กำลังส่งข้อมูล...';

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // จัดการรูปภาพ
    const fileInput = document.getElementById('photoFiles');
    const photoData = [];
    if(fileInput.files.length > 0) {
        for (let file of fileInput.files) {
            const base64 = await toBase64(file);
            photoData.push({ base64: base64.split(',')[1], type: file.type, name: file.name });
        }
    }

    data.photos = photoData;
    data.action = "submitReport";

    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(data) });
        const result = await res.text();
        
        if (result === "Report Success") {
            showNotification("✨ ดำเนินการส่งรายงานผลโครงการเรียบร้อยแล้วค่ะ");
            bootstrap.Modal.getInstance(document.getElementById('reportModal')).hide();
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification("ตรวจพบข้อผิดพลาด: " + result, false);
        }
    } catch (error) {
        showNotification("ไม่สามารถส่งรายงานได้ โปรดตรวจสอบอินเทอร์เน็ต", false);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "ส่งรายงานและบันทึกผล";
    }
});

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// เรียกทำงานครั้งแรก
fetchDashboardData();
