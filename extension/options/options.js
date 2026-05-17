document.getElementById("saveBtn").addEventListener("click", saveProfile);
document.getElementById("importBtn").addEventListener("click", importExcel);
document.getElementById("downloadTemplateBtn").addEventListener("click", downloadTemplate);
function downloadTemplate() {

    /**
     * HEADER
     */
    const rows = [
        ["boid", "name", "bank", "accountNo", "crn", "quantity"]
    ];

    /**
     * CREATE 200 EMPTY PREFORMATTED ROWS
     */
    for (let i = 0; i < 200; i++) {

        rows.push([
            "", // boid
            "", // name
            "", // bank
            "", // account
            "", // crn
            ""  // quantity
        ]);
    }

    /**
     * CREATE SHEET
     */
    const worksheet =
        XLSX.utils.aoa_to_sheet(rows);

    /**
     * FREEZE HEADER
     */
    worksheet["!freeze"] = {
        xSplit: 0,
        ySplit: 1
    };

    /**
     * COLUMN WIDTHS
     */
    worksheet["!cols"] = [
        { wch: 25 }, // boid
        { wch: 25 }, // name
        { wch: 45 }, // bank
        { wch: 25 }, // account
        { wch: 20 }, // crn
        { wch: 10 }  // quantity
    ];

    /**
     * FORCE TEXT FORMAT
     * FOR ALL IMPORTANT COLUMNS
     */
    for (let row = 2; row <= 201; row++) {

        // BOID
        formatTextCell(worksheet, `A${row}`);

        // NAME
        formatTextCell(worksheet, `B${row}`);

        // BANK
        formatTextCell(worksheet, `C${row}`);

        // ACCOUNT
        formatTextCell(worksheet, `D${row}`);

        // CRN
        formatTextCell(worksheet, `E${row}`);
    }

    /**
     * CREATE WORKBOOK
     */
    const workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Profiles"
    );

    /**
     * DOWNLOAD FILE
     */
    XLSX.writeFile(
        workbook,
        "meroshare-profile-template.xlsx"
    );
}


/**
 * FORCE CELL AS TEXT
 */
function formatTextCell(sheet, cell) {

    if (!sheet[cell]) {
        sheet[cell] = {
            t: "s",
            v: ""
        };
    }

    // TEXT TYPE
    sheet[cell].t = "s";

    // EXCEL TEXT FORMAT
    sheet[cell].z = "@";
}
async function importExcel() {

    const fileInput = document.getElementById("excelFile");

    const file = fileInput.files[0];

    if (!file) {
        alert("Select Excel file first");
        return;
    }

    const reader = new FileReader();

    reader.onload = async function (e) {

        const data = new Uint8Array(e.target.result);

        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0];

        const sheet = workbook.Sheets[sheetName];

        const json = XLSX.utils.sheet_to_json(sheet);

        console.log("Excel Data:", json);

        const newProfiles = json

            // REMOVE EMPTY ROWS
            .filter(r =>
                r.boid ||
                r.name ||
                r.accountNo ||
                r.crn ||
                r.bank
            )

            .map(r => ({
                boid: String(r.boid || "").trim(),
                name: String(r.name || "").trim(),
                bank: String(r.bank || "").trim(),
                accountNo: String(r.accountNo || "").trim(),
                crn: String(r.crn || "").trim(),
                quantity: Number(r.quantity || 10)
            }));

        const res = await chrome.storage.local.get("profiles");

        const existing = res.profiles || [];

        const merged = [...existing, ...newProfiles];

        await chrome.storage.local.set({ profiles: merged });


    };
    alert("Profiles imported successfully!");
    loadProfiles(); // refresh UI

    reader.readAsArrayBuffer(file);
}

async function saveProfile() {

    const profile = {
        boid: String(document.getElementById("boid").value).trim(),
        name: String(document.getElementById("name").value).trim(),
        bank: String(document.getElementById("bank").value).trim(),
        accountNo: String(document.getElementById("account").value).trim(),
        crn: String(document.getElementById("crn").value).trim(),
        quantity: Number(document.getElementById("qty").value || 10)
    };

    /**
     * SKIP EMPTY PROFILE
     */
    if (
        !profile.boid &&
        !profile.name &&
        !profile.accountNo &&
        !profile.crn &&
        !profile.bank
    ) {
        alert("Please enter profile data");
        return;
    }

    const res =
        await chrome.storage.local.get("profiles");

    const profiles = res.profiles || [];

    /**
     * REMOVE INVALID/EMPTY OLD DATA
     */
    const cleanProfiles = profiles.filter(r =>
        r &&
        (
            r.boid ||
            r.name ||
            r.accountNo ||
            r.crn ||
            r.bank
        )
    );

    /**
     * ADD NEW PROFILE
     */
    cleanProfiles.push(profile);

    /**
     * SAVE
     */
    await chrome.storage.local.set({
        profiles: cleanProfiles
    });

    clearForm();



    loadProfiles();
}

function clearForm() {
    document.querySelectorAll("input").forEach(i => i.value = "");
}

async function loadProfiles() {

    const res = await chrome.storage.local.get("profiles");
    const profiles = res.profiles || [];

    const list = document.getElementById("list");

    list.innerHTML = "";

    profiles.forEach((p, index) => {

        const div = document.createElement("div");
        div.className = "profile";

        const info = document.createElement("div");

        info.innerHTML = `
            <b>${p.name}</b><br/>
            <small>${p.boid} • ${p.bank}</small>
        `;

        const btn = document.createElement("button");
        btn.className = "deleteBtn";
        btn.textContent = "Delete";

        btn.addEventListener("click", async () => {

            const res = await chrome.storage.local.get("profiles");
            const profiles = res.profiles || [];

            profiles.splice(index, 1);

            await chrome.storage.local.set({ profiles });

            loadProfiles();
            profileForm.reset();
        });

        div.appendChild(info);
        div.appendChild(btn);

        list.appendChild(div);
    });
}
document.getElementById("downloadTemplateBtn")
    .addEventListener("click", () => {

        const ok = confirm("Download Excel template?");

        if (!ok) return;

        downloadTemplate();
    });
document.getElementById("importBtn")
    .addEventListener("click", async () => {

        const ok = confirm("Import profiles from Excel?");

        if (!ok) return;

        await importExcel();
    });
loadProfiles();