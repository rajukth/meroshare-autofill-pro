/**
 * =====================================================
 * AUTO START
 * =====================================================
 */

window.addEventListener("load", () => {

    setTimeout(() => {

        if (window.location.hash.includes("/asba/apply")) {

            startBoidDetection();
        }

    }, 800);

});


/**
 * =====================================================
 * BOID DETECTION
 * =====================================================
 */

function startBoidDetection() {

    let tries = 0;

    const timer = setInterval(() => {

        tries++;
console.log(tries)
        const boid = findBoid();

        if (boid) {
            clearInterval(timer);

            matchProfile(boid);
        }

        // stop after 3 tries
        if (tries >= 3) {
            clearInterval(timer);
        }

    }, 800);
}


/**
 * =====================================================
 * FIND BOID
 * =====================================================
 */

function findBoid() {

    const elements = document.querySelectorAll(
        "form label"
    );

    for (const el of elements) {

        const text =
            (el.value || el.innerText || "")
                .trim();

        const match =
            text.match(/\b\d{16}\b/);

        if (match) {
            return match[0];
        }
    }

    return null;
}


/**
 * =====================================================
 * MATCH PROFILE
 * =====================================================
 */

function matchProfile(boid) {

    chrome.storage.local.get("profiles", (res) => {

        const profiles = res.profiles || [];

        const user =
            profiles.find(p => p.boid === boid);

        if (!user) {

            return;
        }

        showAutoPopup(user);

    });
}


/**
 * =====================================================
 * FLOATING POPUP
 * =====================================================
 */

function showAutoPopup(user) {

    // prevent duplicate popup
    if (document.querySelector("#ms-auto-popup")) {
        return;
    }

    const popup = document.createElement("div");

    popup.id = "ms-auto-popup";

    popup.style = `
        position: fixed;
        right: 20px;
        bottom: 20px;
        width: 250px;
        background: white;
        padding: 15px;
        border-radius: 10px;
        z-index: 999999;
        box-shadow: 0 0 15px rgba(0,0,0,0.3);
        font-family: Arial;
    `;

    popup.innerHTML = `
        <div style="
        font-family: Arial, sans-serif;
    ">

        <!-- HEADER -->
        <div style="
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2c3e50;
        ">
            🚀 Auto Fill Ready
        </div>

        <!-- PROFILE CARD -->
        <div style="
            background: #f4f6f9;
            padding: 10px;
            border-radius: 10px;
            margin-bottom: 12px;
        ">

            <div style="font-weight: bold; font-size: 14px;">
                ${user.name}
            </div>

            <div style="
                font-size: 12px;
                color: #666;
                margin-top: 4px;
            ">
                BOID: ${user.boid}
            </div>

            <div style="
                font-size: 12px;
                color: #666;
                margin-top: 2px;
            ">
                ${user.bank}
            </div>

        </div>

        <!-- ACTION BUTTON -->
        <button id="ms-fill-btn" style="
            width: 100%;
            padding: 10px;
            background: #4a90e2;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            margin-bottom: 8px;
            transition: 0.2s;
        ">
            ⚡ Fill Form
        </button>

        <!-- CLOSE BUTTON -->
        <button id="ms-close-btn" style="
            width: 100%;
            padding: 10px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
        ">
            ✖ Close
        </button>

    </div>
    `;
    document.body.appendChild(popup);
    popup.querySelector("#ms-fill-btn").onmouseover = () => {
        popup.querySelector("#ms-fill-btn").style.opacity = "0.85";
    };

    popup.querySelector("#ms-fill-btn").onmouseout = () => {
        popup.querySelector("#ms-fill-btn").style.opacity = "1";
    };
    /**
     * FILL BUTTON
     */
    document
        .getElementById("ms-fill-btn")
        .onclick = () => {

        fillForm(user);

        popup.remove();
    };

    /**
     * CLOSE BUTTON
     */
    document
        .getElementById("ms-close-btn")
        .onclick = () => {

        popup.remove();
    };
}


/**
 * -----------------------------
 * ANGULAR SAFE VALUE SETTER
 * -----------------------------
 */
function setAngularValue(el, value) {
    if (!el) return;

    el.focus();

    // INPUT / TEXT / NUMBER
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {

        el.value = value;

        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.dispatchEvent(new Event("keyup", { bubbles: true }));
    }

    // SELECT DROPDOWN
    else if (el.tagName === "SELECT") {

        el.value = value;

        el.dispatchEvent(new Event("change", { bubbles: true }));
    }

    el.blur();
}

/**
 * -----------------------------
 * SELECT BY TEXT (BANK)
 * -----------------------------
 */
function setSelectByText(select, text) {
    if (!select) return;

    const options = Array.from(select.options);

    const match = options.find(opt =>
        opt.text.trim().toLowerCase() === text.trim().toLowerCase()
    );

    if (match) {
        select.value = match.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
        console.error("⚠ Match not found:", text);
    }
}

/**
 * -----------------------------
 * MAIN FORM FILL FUNCTION
 * -----------------------------
 */
function fillForm(user) {


    // ---------------- BANK ----------------
    const bank = document.querySelector("#selectBank");

    if (bank) {

        setSelectByText(bank, user.bank);

        // ---------------- ACCOUNT ----------------
        // wait account load after bank change
        setTimeout(() => {

            const account =
                document.querySelector("#accountNumber");

            if (account) {

                setAngularValue(
                    account,
                    user.accountNo
                );
            }

        }, 500);
    }

    // ---------------- KITTA ----------------
    const kitta = document.querySelector("#appliedKitta");

    if (kitta) {
        setAngularValue(kitta, user.quantity);
    }

    // ---------------- CRN ----------------
    const crn = document.querySelector("#crnNumber");

    if (crn) {
        setAngularValue(crn, user.crn);
    }

    // ---------------- DISCLAIMER ----------------
    const disclaimer = document.querySelector("#disclaimer");

    if (disclaimer && !disclaimer.checked) {
        disclaimer.click();
    }

}

/**
 * -----------------------------
 * MESSAGE LISTENER FROM POPUP
 * -----------------------------
 */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

    if (msg.action === "fill") {
        fillForm(msg.user);
    }
});