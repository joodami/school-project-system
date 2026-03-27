const API_URL = "https://script.google.com/macros/s/AKfycbzNgRqYHoezZkOvLXD61ZipvbL7Oiv55KWWKFcMreC2Dw7aQoSy77Ae6v1WaB3LdAxYvQ/exec"; 
let allProjectsData = [];

async function fetchDashboardData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        allProjectsData = data.projects;
        
        document.getElementById('totalProjects').innerText = data.summary.totalProjects;
        document.getElementById('reportedCount').innerText = data.summary.reportedCount;
        document.getElementById('pendingCount').innerText = data.summary.pendingCount;
        document.getElementById('totalBudget').innerText = data.summary.totalBudget.toLocaleString();
        
        renderTable(allProjectsData);
    } catch (e) { console.error("Fetch Error:", e); }
}

function renderTable(projects) {
    const tableBody = document.getElementById('projectTableBody');
    tableBody.innerHTML = '';
    projects.forEach(p => {
        const isDone = p.Status === 'รายงานแล้ว';
        const row = `
            <tr>
                <td class="ps-4">
                    <div class="fw-bold text-dark fs-6">${p.Project_Name}</div>
                    <small class="text-muted"><i class="bi bi-person me-1"></i>${p.Responsible_Person || '-'}</small>
                </td>
                <td><span class="text-secondary fw-bold">${p.Fiscal_Year || '-'}</span></td>
                <td class="fw-bold text-primary">${p.Budget_Total.toLocaleString()}</td>
                <td><span class="badge ${isDone ? 'bg-success text-white' : 'bg-warning text-dark'} shadow-sm">${p.Status}</span></td>
                <td class="text-center">
                    <div class="btn-group shadow-sm">
                        <button onclick="viewPDF('${p.Project_ID}')" class="btn btn-sm btn-light border" title="ดูไฟล์รายงาน"><i class="bi bi-file-earmark-pdf text-danger"></i></button>
                        ${!isDone ? `<button onclick="openReportModal('${p.Project_ID}', '${p.Project_Name}')" class="btn btn-sm btn-primary px-3">ส่งรายงาน</button>` : `<button class="btn btn-sm btn-outline-success" disabled><i class="bi bi-check-circle-fill"></i></button>`}
                    </div>
                </td>
            </tr>`;
        tableBody.innerHTML += row;
    });
}

function filterTable(dept) {
    document.querySelectorAll('#departmentTabs .nav-link').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (dept === 'ทั้งหมด') renderTable(allProjectsData);
    else renderTable(allProjectsData.filter(p => p.Department === dept));
}

const toBase64 = file => new Promise((res, rej) => {
    const r = new FileReader(); r.readAsDataURL(file);
    r.onload = () => res(r.result.split(',')[1]); r.onerror = e => rej(e);
});

async function viewPDF(id) {
    const res = await fetch(`${API_URL}?action=viewPDF&projectId=${id}`);
    const url = await res.text();
    if(url.startsWith("http")) window.open(url, '_blank');
    else alert("ยังไม่มีการส่งไฟล์รายงานสำหรับโครงการนี้ค่ะ");
}

function openReportModal(id, name) {
    document.getElementById('report_project_id').value = id;
    document.getElementById('report_project_name').innerText = name;
    new bootstrap.Modal(document.getElementById('reportModal')).show();
}

document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> กำลังบันทึก...';
    const data = Object.fromEntries(new FormData(e.target));
    data.action = "addProject";
    const file = document.getElementById('attachProjectFile').files[0];
    if(file) data.projectFile = { base64: await toBase64(file), type: file.type, name: file.name };
    await fetch(API_URL, { method: 'POST', body: JSON.stringify(data) });
    location.reload();
});

document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('reportSubmitBtn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> กำลังอัปโหลด...';
    const data = { action: "submitReport", Project_ID: document.getElementById('report_project_id').value };
    const file = document.getElementById('reportFile').files[0];
    data.reportFile = { base64: await toBase64(file), type: file.type, name: file.name };
    await fetch(API_URL, { method: 'POST', body: JSON.stringify(data) });
    location.reload();
});

fetchDashboardData();
