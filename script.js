// 1. กำหนดค่าเริ่มต้นและเชื่อมต่อ API
const API_URL = "https://script.google.com/macros/s/AKfycbzNgRqYHoezZkOvLXD61ZipvbL7Oiv55KWWKFcMreC2Dw7aQoSy77Ae6v1WaB3LdAxYvQ/exec"; 
let allProjectsData = []; 
let filteredData = [];    
let currentPage = 1;      
const rowsPerPage = 10;   

// 2. ฟังก์ชันดึงข้อมูลจาก Google Sheets
async function fetchDashboardData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        // แสดงล่าสุดขึ้นก่อน
        allProjectsData = data.projects.reverse(); 
        filteredData = [...allProjectsData]; 
        
        // อัปเดต Dashboard
        document.getElementById('totalProjects').innerText = data.summary.totalProjects;
        document.getElementById('reportedCount').innerText = data.summary.reportedCount;
        document.getElementById('pendingCount').innerText = data.summary.pendingCount;
        document.getElementById('totalBudget').innerText = data.summary.totalBudget.toLocaleString();
        
        updateDisplay(); 
    } catch (e) { 
        console.error("Fetch Error:", e);
        alert("ไม่สามารถโหลดข้อมูลได้");
    }
}

// 3. ควบคุมการแสดงผลหลัก
function updateDisplay() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedItems = filteredData.slice(startIndex, endIndex);
    
    renderTable(paginatedItems);
    renderPagination();
    
    const total = filteredData.length;
    document.getElementById('pageInfo').innerText = total > 0 
        ? `แสดงรายการที่ ${startIndex + 1}-${Math.min(endIndex, total)} จาก ${total}`
        : `ไม่พบข้อมูลที่ต้องการ`;
}

// 4. สร้างแถวในตาราง (เพิ่มปุ่มแก้ไขข้อมูล)
function renderTable(projects) {
    const tableBody = document.getElementById('projectTableBody');
    tableBody.innerHTML = '';
    
    if (projects.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-5 text-muted">ไม่พบข้อมูล</td></tr>';
        return;
    }

    projects.forEach(p => {
        const isDone = p.Status === 'รายงานแล้ว';
        const row = `
            <tr>
                <td class="ps-4">
                    <div class="fw-bold text-dark">${p.Project_Name}</div>
                    <small class="text-muted"><i class="bi bi-person me-1"></i>${p.Responsible_Person || '-'}</small>
                </td>
                <td><span class="badge bg-light text-dark border small">${p.Fiscal_Year}</span></td>
                <td class="fw-bold text-primary">${p.Budget_Total.toLocaleString()}</td>
                <td>
                    <span class="badge ${isDone ? 'bg-success' : 'bg-warning text-dark'} shadow-sm">
                        <i class="bi ${isDone ? 'bi-check-circle-fill' : 'bi-clock-history'} me-1"></i>${p.Status}
                    </span>
                </td>
                <td>
                    <div class="d-flex flex-column gap-2">
                        <div class="btn-group shadow-sm">
                            <button onclick="window.open('${p.Project_File_URL}', '_blank')" class="btn btn-sm btn-outline-primary" ${p.Project_File_URL === '-' ? 'disabled' : ''}>
                                <i class="bi bi-file-earmark-text"></i> แผน
                            </button>
                            <button onclick="viewPDF('${p.Project_ID}')" class="btn btn-sm btn-outline-secondary" ${!isDone ? 'disabled' : ''}>
                                <i class="bi bi-file-earmark-check"></i> รายงาน
                            </button>
                            <button onclick="openEditModal('${p.Project_ID}')" class="btn btn-sm btn-outline-warning">
                                <i class="bi bi-pencil"></i> แก้ไข
                            </button>
                        </div>
                        ${!isDone ? 
                            `<button onclick="openReportModal('${p.Project_ID}', '${p.Project_Name}')" class="btn btn-success btn-sm fw-bold">
                                <i class="bi bi-cloud-upload"></i> ส่งรายงาน
                            </button>` : ''
                        }
                    </div>
                </td>
            </tr>`;
        tableBody.innerHTML += row;
    });
}

// 5. Pagination
function renderPagination() {
    const wrapper = document.getElementById('paginationWrapper');
    wrapper.innerHTML = '';
    const pageCount = Math.ceil(filteredData.length / rowsPerPage);
    if (pageCount <= 1) return;

    for (let i = 1; i <= pageCount; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${currentPage === i ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
        wrapper.appendChild(li);
    }
}

function changePage(page) {
    event.preventDefault();
    currentPage = page;
    updateDisplay();
}

// 6. ค้นหา
document.getElementById('searchInput').addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();
    filteredData = allProjectsData.filter(p => 
        p.Project_Name.toLowerCase().includes(term) || 
        (p.Responsible_Person && p.Responsible_Person.toLowerCase().includes(term))
    );
    currentPage = 1;
    updateDisplay();
});

// 7. กรองตามกลุ่มงาน
function filterTable(dept) {
    document.getElementById('searchInput').value = '';
    document.querySelectorAll('#departmentTabs .nav-link').forEach(b => b.classList.remove('active'));
    if (event) event.target.classList.add('active');
    filteredData = dept === 'ทั้งหมด' ? allProjectsData : allProjectsData.filter(p => p.Department === dept);
    currentPage = 1;
    updateDisplay();
}

// 8. จัดการ Modal ส่งรายงาน
function openReportModal(id, name) {
    document.getElementById('report_project_id').value = id;
    document.getElementById('report_project_name').innerText = name;
    new bootstrap.Modal(document.getElementById('reportModal')).show();
}

// 9. ดู PDF
async function viewPDF(id) {
    try {
        const res = await fetch(`${API_URL}?action=viewPDF&projectId=${id}`);
        const url = await res.text();
        url.startsWith("http") ? window.open(url, '_blank') : alert("ไม่พบไฟล์รายงาน");
    } catch (e) { alert("เกิดข้อผิดพลาด"); }
}

// 10. ฟังก์ชันเปิด Modal แก้ไข (ดึงข้อมูลเก่ามาใส่ช่องว่าง)
function openEditModal(id) {
    const p = allProjectsData.find(item => item.Project_ID == id);
    if (!p) return;
    document.getElementById('edit_project_id').value = p.Project_ID;
    document.getElementById('edit_name').value = p.Project_Name;
    document.getElementById('edit_year').value = p.Fiscal_Year;
    document.getElementById('edit_budget').value = p.Budget_Total;
    document.getElementById('edit_person').value = p.Responsible_Person;
    document.getElementById('edit_auth_phone').value = ""; // ล้างเบอร์เก่าทิ้งให้กรอกใหม่
    new bootstrap.Modal(document.getElementById('editProjectModal')).show();
}

// 11. บันทึกการแก้ไข
document.getElementById('editProjectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('editSubmitBtn');
    btn.disabled = true;
    const formData = Object.fromEntries(new FormData(e.target));
    formData.action = "editProject";

    try {
        const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(formData) });
        const result = await res.json();
        if (result.status === "success") {
            showSuccess("แก้ไขสำเร็จ!", "ข้อมูลโครงการได้รับการอัปเดตแล้ว");
        } else {
            alert("ผิดพลาด: " + result.message);
            btn.disabled = false;
        }
    } catch (e) { alert("เชื่อมต่อ Server ไม่ได้"); btn.disabled = false; }
});

// 12. ลบโครงการ
async function handleDelete() {
    if (!confirm("ยืนยันการลบโครงการนี้?")) return;
    const id = document.getElementById('edit_project_id').value;
    const phone = document.getElementById('edit_auth_phone').value;
    
    if(!phone) { alert("กรุณากรอกเบอร์โทรเพื่อยืนยัน"); return; }

    try {
        const res = await fetch(API_URL, { 
            method: 'POST', 
            body: JSON.stringify({ action: "deleteProject", Project_ID: id, Auth_Phone: phone }) 
        });
        const result = await res.json();
        if (result.status === "success") {
            showSuccess("ลบสำเร็จ!", "โครงการถูกลบออกจากระบบแล้ว");
        } else {
            alert("ผิดพลาด: " + result.message);
        }
    } catch (e) { alert("ลบข้อมูลไม่สำเร็จ"); }
}

// 13. บันทึกโครงการใหม่
document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true; 
    btn.innerHTML = 'กำลังบันทึก...';
    
    const data = Object.fromEntries(new FormData(e.target));
    data.action = "addProject";
    
    const fileInput = document.getElementById('attachProjectFile');
    if(fileInput.files.length > 0) {
        const file = fileInput.files[0];
        data.projectFile = { base64: await convertFileToBase64(file), type: file.type, name: file.name };
    }
    
    try {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify(data) });
        showSuccess("บันทึกสำเร็จ!", "โครงการใหม่ถูกเพิ่มแล้ว");
    } catch (e) { alert("บันทึกไม่ได้"); btn.disabled = false; }
});

// 14. ส่งรายงานผล
document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('reportSubmitBtn');
    btn.disabled = true;
    
    const data = {
        action: "submitReport",
        Project_ID: document.getElementById('report_project_id').value
    };
    
    const fileInput = document.getElementById('reportFile');
    const file = fileInput.files[0];
    data.reportFile = { base64: await convertFileToBase64(file), type: file.type, name: file.name };
    
    try {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify(data) });
        showSuccess("ส่งรายงานแล้ว!", "อัปโหลดไฟล์เรียบร้อย");
    } catch (e) { alert("อัปโหลดไม่สำเร็จ"); btn.disabled = false; }
});

// ฟังก์ชันเสริม
function showSuccess(title, msg) {
    document.getElementById('successTitle').innerText = title;
    document.getElementById('successMessage').innerText = msg;
    new bootstrap.Modal(document.getElementById('successModal')).show();
    document.getElementById('successModal').addEventListener('hidden.bs.modal', () => location.reload());
}

function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = e => reject(e);
    });
}

fetchDashboardData();
