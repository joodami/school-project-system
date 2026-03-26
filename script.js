const API_URL = "https://script.google.com/macros/s/AKfycbyMWBqKDaLkiSgYvl--HsjbYcgRgmH_LBXdkUMsD7tIGjRnf_0H7h_8Miy-wCu_RY0j6w/exec"; 

async function fetchDashboardData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        // อัปเดตตัวเลขสรุป
        document.getElementById('totalProjects').innerText = data.summary.totalProjects;
        document.getElementById('reportedCount').innerText = data.summary.reportedCount;
        document.getElementById('pendingCount').innerText = data.summary.pendingCount;

        // สร้างตารางโครงการ
        const tableBody = document.getElementById('projectTableBody');
        tableBody.innerHTML = ''; // ล้างค่าเก่า

        data.projects.forEach(project => {
            const row = `
                <tr>
                    <td>${project.Project_Name}</td>
                    <td>${project.Type}</td>
                    <td>${Number(project.Budget_Total).toLocaleString()} บาท</td>
                    <td>
                        <span class="status-badge ${project.Status === 'รายงานแล้ว' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}">
                            ${project.Status}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-secondary">ดู PDF</button>
                        <button class="btn btn-sm btn-outline-primary">รายงาน</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// เรียกทำงานทันทีที่โหลดหน้าเว็บ
fetchDashboardData();
