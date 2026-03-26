const API_URL = "https://script.google.com/macros/s/AKfycbzf9bCleik7TjDNK9Xp5pnzr9kur5ZKHzC5UujEBSWaaavlin9ItSK0J9XpaJyvx8Ev2w/exec"; 

// ฟังก์ชันแปลงไฟล์เป็น Base64 (ปรับปรุงให้เสถียรขึ้น)
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result;
        // แยกเอาเฉพาะส่วนข้อมูล Base64 หลังเครื่องหมาย ,
        if (result.includes(',')) {
            resolve(result.split(',')[1]);
        } else {
            resolve(result);
        }
    };
    reader.onerror = error => reject(error);
});

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
            
            const fileUrl = project.Project_File_URL || ""; 
            const fileBtn = fileUrl 
                ? `<a href="${fileUrl}" target="_blank" class="btn btn-sm btn-outline-primary ms-1" title="ดูไฟล์โครงการต้นฉบับ"><i class="bi bi-file-earmark-arrow-down"></i> ไฟล์แนบ</a>` 
                : "";

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
                            ${fileBtn}
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
        console.error("Error fetching data:", error);
    }
}

// 2. ฟังก์ชันดู PDF รายงานผล
async function viewPDF(projectId) {
    showNotification("⏳ กำลังเตรียมเอกสาร PDF...");
    try {
        const response = await fetch(`${API_URL}?action=viewPDF&projectId=${projectId}`);
        const pdfUrl = await response.text();
        
        if (pdfUrl.includes("http")) {
            window.open(pdfUrl, '_blank');
        } else {
            showNotification("❌ " + pdfUrl, false);
        }
    } catch (error) {
        showNotification("❌ ไม่สามารถเปิด PDF ได้", false);
    }
}

// 3. เปิดหน้าต่างรายงาน
function openReportModal(id, name) {
    document.getElementById('report_project_id').value = id;
    document.getElementById('report_project_name').value = name;
    const reportModal = new bootstrap.Modal(document.getElementById('reportModal'));
    reportModal.show();
}

// 4. บันทึกโครงการใหม่ (พร้อมจัดการไฟล์แนบ)
document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    
    // เตรียมข้อมูลจากฟอร์ม
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.action = "addProject";

    // จัดการไฟล์แนบ
    const fileInput = document.getElementById('attachProjectFile');
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        
        // จำกัดขนาดไฟล์ไม่เกิน 3MB เพื่อความเสถียรของ Apps Script
        if (file.size > 3 * 1024 * 1024) {
            alert("ไฟล์ขนาดใหญ่เกินไป (จำกัดไม่เกิน 3MB) กรุณาลดขนาดไฟล์ก่อนบันทึกค่ะ");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> กำลังประมวลผลไฟล์...';
        
        try {
            const base64Data = await toBase64(file);
            data.projectFile = {
                base64: base64Data,
                type: file.type,
                name: file.name
            };
        } catch (err) {
            console.error("File error:", err);
            showNotification("❌ ปัญหาเกี่ยวกับไฟล์แนบ", false);
            submitBtn.disabled = false;
            return;
        }
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> กำลังบันทึกลงระบบ...';

    try {
        const res = await fetch(API_URL, { 
            method: 'POST', 
            body: JSON.stringify(data) 
        });
        const result = await res.text();

        if (result === "Success") {
            showNotification("✅ บันทึกโครงการเรียบร้อยแล้วค่ะ");
            e.target.reset();
            bootstrap.Modal.getInstance(document.getElementById('addProjectModal')).hide();
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification("❌ ข้อผิดพลาด: " + result, false);
        }
    } catch (error) {
        console.error("Submit Error:", error);
        showNotification("❌ การเชื่อมต่อล้มเหลว", false);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "บันทึกข้อมูลลงระบบ";
    }
});

// 5. ส่งรายงานผลโครงการ (PDCA)
document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('reportSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> กำลังส่งรายงาน...';

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.action = "submitReport";
    
    // จัดการรูปภาพประกอบ (เลือกหลายรูปได้)
    const fileInput = document.getElementById('photoFiles');
    const photoData = [];
    if(fileInput && fileInput.files.length > 0) {
        for (let file of fileInput.files) {
            if (file.size < 2 * 1024 * 1024) { // จำกัดรูปละ 2MB
                const base64 = await toBase64(file);
                photoData.push({ base64: base64, type: file.type, name: file.name });
            }
        }
    }
    data.photos = photoData;

    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(data) });
        const result = await res.text();
        
        if (result === "Report Success") {
            showNotification("✨ ส่งรายงานผลเรียบร้อยแล้วค่ะ");
            bootstrap.Modal.getInstance(document.getElementById('reportModal')).hide();
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification("❌ เกิดข้อผิดพลาด: " + result, false);
        }
    } catch (error) {
        showNotification("❌ ไม่สามารถส่งรายงานได้", false);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "ส่งรายงานและบันทึกผล";
    }
});

// เริ่มโหลดข้อมูลเมื่อเปิดหน้าเว็บ
fetchDashboardData();
