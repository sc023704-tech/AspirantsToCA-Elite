let currentUser = null;
let appState = {};

const defaultRoutine = [
    { time: "5:00–6:00 AM", task: "Brush + Exercise" },
    { time: "6:00–9:00 AM", task: "Law Comprehensive Block" },
    { time: "9:00–10:00 AM", task: "Breakfast + Bath" },
    { time: "10:00–1:00 PM", task: "Quantitative Aptitude Session" },
    { time: "1:00–3:00 PM", task: "Lunch + Strategic Rest" },
    { time: "3:00–4:00 PM", task: "Core Consolidation Revision" },
    { time: "4:00–7:00 PM", task: "Advanced Accounting Module" },
    { time: "7:00–9:00 PM", task: "Business Economics" },
    { time: "9:00–10:00 PM", task: "Law Writing Practice Sandbox" },
    { time: "10:00–11:00 PM", task: "Dinner + Execution Planning" },
    { time: "11:00 PM–5:00 AM", task: "Deep Sleep Cycles Sync" }
];

const defaultSyllabus = [
    { name: "⚖ Business Law", chapters: ["Indian Contract Act, 1872", "Sale of Goods Act, 1930", "Companies Act, 2013"], priorities: {} },
    { name: "📘 Accounting", chapters: ["Theoretical Framework", "Accounting Process", "Bank Reconciliation Statement"], priorities: {} }
];

const shivamQuotes = [
    "“Sep 2026 door nahi hai bhai, aaj ka schedule poora track par hona chahiye!”",
    "“Discipline is doing what needs to be done, even if you don't feel like it.”",
    "“Consistency is the bridge between CA Foundation preparation and success.”",
    "“Your target is clear. Make every minute count.”"
];

// Play Sensory Audio Feedback Trigger
function triggerSuccessChime() {
    const sound = document.getElementById("success-sound");
    if(sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }
    if (navigator.vibrate) {
        navigator.vibrate(40); // Native Haptic Vibration Trigger
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // FIX: Core background theme forced instantly on startup to eliminate flashing white screens
    const lastUser = localStorage.getItem("ca_active_user");
    if(lastUser) {
        let users = JSON.parse(localStorage.getItem("ca_users_db") || "{}");
        if(users[lastUser]) {
            let userPack = JSON.parse(localStorage.getItem(`ca_state_pack_v4_${lastUser}`)) || {};
            document.documentElement.setAttribute("data-theme", userPack.theme || "dark-blue");
        }
    } else {
        document.documentElement.setAttribute("data-theme", "dark-blue");
    }
    initAuthEngine();
});

function initAuthEngine() {
    const errorMsg = document.getElementById("auth-error");

    document.getElementById("go-to-signup").onclick = () => {
        document.getElementById("login-form-zone").style.display = "none";
        document.getElementById("signup-form-zone").style.display = "block";
        errorMsg.innerText = "";
    };

    document.getElementById("go-to-login").onclick = () => {
        document.getElementById("signup-form-zone").style.display = "none";
        document.getElementById("login-form-zone").style.display = "block";
        errorMsg.innerText = "";
    };

    document.getElementById("btn-signup").onclick = () => {
        const u = document.getElementById("signup-username").value.trim().toLowerCase();
        const p = document.getElementById("signup-password").value.trim();
        if(!u || !p) { errorMsg.innerText = "All parameters required."; return; }
        
        let users = JSON.parse(localStorage.getItem("ca_users_db") || "{}");
        if(users[u]) { errorMsg.innerText = "Username variant already active."; return; }

        users[u] = btoa(p);
        localStorage.setItem("ca_users_db", JSON.stringify(users));
        localStorage.setItem(`ca_state_pack_v4_${u}`, JSON.stringify(createDefaultState()));
        
        errorMsg.style.color = "var(--accent-green)";
        errorMsg.innerText = "Registered! Redirecting UI...";
        setTimeout(() => { document.getElementById("go-to-login").click(); errorMsg.style.color="var(--danger)"; }, 1000);
    };

    // FIX: Freeze resolved completely. Immediate visibility toggle state update without needing manual reload
    document.getElementById("btn-login").onclick = () => {
        const u = document.getElementById("login-username").value.trim().toLowerCase();
        const p = document.getElementById("login-password").value.trim();

        if(!u || !p) { errorMsg.innerText = "Credentials incomplete."; return; }

        let users = JSON.parse(localStorage.getItem("ca_users_db") || "{}");
        if(!users[u] || users[u] !== btoa(p)) { errorMsg.innerText = "Authentication Mismatch."; return; }
        executeLogin(u);
    };

    const session = localStorage.getItem("ca_active_user");
    if(session) {
        let users = JSON.parse(localStorage.getItem("ca_users_db") || "{}");
        if(users[session]) executeLogin(session);
        else localStorage.removeItem("ca_active_user");
    }

    document.getElementById("btn-logout").onclick = () => {
        localStorage.removeItem("ca_active_user");
        window.location.reload();
    };
}

function executeLogin(username) {
    currentUser = username;
    localStorage.setItem("ca_active_user", username);
    document.getElementById("auth-overlay").style.display = "none";
    document.getElementById("app-main-content").style.display = "block";
    loadState();
    initCoreApp();
}

function createDefaultState() {
    return {
        theme: "dark-blue",
        targetDate: "2026-09-01",
        challengeDays: 50,
        hoursLogged: { today: 0, total: 0, lastUpdated: "" },
        customRoutine: [...defaultRoutine],
        routineChecked: {},
        subjects: [...defaultSyllabus],
        chaptersChecked: {},
        todo: [],
        roadmapChecked: {},
        diary: [],
        xp: 0
    };
}

function loadState() {
    try {
        appState = JSON.parse(localStorage.getItem(`ca_state_pack_v4_${currentUser}`)) || createDefaultState();
    } catch(e) {
        appState = createDefaultState();
    }
    const today = new Date().toDateString();
    if (!appState.hoursLogged || appState.hoursLogged.lastUpdated !== today) {
        appState.hoursLogged = appState.hoursLogged || { today: 0, total: 0 };
        appState.hoursLogged.today = 0;
        appState.hoursLogged.lastUpdated = today;
        appState.routineChecked = {};
        saveState();
    }
    document.documentElement.setAttribute("data-theme", appState.theme || "dark-blue");
    document.getElementById("user-display-name").innerText = currentUser.toUpperCase();

    // NEW: Render credentials configuration profile card elements securely
    if(document.getElementById("prof-display-username")) {
        document.getElementById("prof-display-username").innerText = currentUser.toUpperCase();
        let currentSecret = localStorage.getItem("ca_users_db") ? JSON.parse(localStorage.getItem("ca_users_db"))[currentUser] : "N/A";
        document.getElementById("prof-display-token").innerText = `AES-B64:${currentSecret}`;
    }
}

function saveState() {
    localStorage.setItem(`ca_state_pack_v4_${currentUser}`, JSON.stringify(appState));
    calculateTelemetry();
}

function initCoreApp() {
    setupNavigation();
    setupThemeSelector();
    setupConfigHandler();
    startClocksAndCountdowns();
    renderRoutine();
    renderSyllabus();
    setupPomodoro();
    setupStopwatchAndTodo();
    renderRoadmap();
    setupDiary();
    selectQuote();
    setupInterSyncEngine();
}

function setupNavigation() {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", () => {
            document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
            document.querySelectorAll(".app-section").forEach(s => s.classList.remove("active"));
            item.classList.add("active");
            document.getElementById(item.getAttribute("data-target")).classList.add("active");
        });
    });
}

function setupThemeSelector() {
    document.querySelectorAll(".theme-btn").forEach(btn => {
        btn.onclick = () => {
            const t = btn.getAttribute("data-set-theme");
            document.documentElement.setAttribute("data-theme", t);
            appState.theme = t;
            saveState();
        };
    });
}

function setupInterSyncEngine() {
    document.getElementById("btn-export-data").onclick = () => {
        const payload = {
            version: "AspirantsToCA-V4",
            username: currentUser,
            secretHash: localStorage.getItem("ca_users_db") ? JSON.parse(localStorage.getItem("ca_users_db"))[currentUser] : "",
            state: appState
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ATC_${currentUser}_V4DataPack.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const fileInp = document.getElementById("import-file-input");
    document.getElementById("btn-trigger-import").onclick = () => fileInp.click();
    fileInp.onchange = (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const imported = JSON.parse(evt.target.result);
                if(imported.version !== "AspirantsToCA-V4" || !imported.state) { alert("Invalid V4 Sync Layout."); return; }
                if(confirm("Commit pack overwrite migration?")) {
                    if(imported.secretHash) {
                        let localUsers = JSON.parse(localStorage.getItem("ca_users_db") || "{}");
                        localUsers[currentUser] = imported.secretHash;
                        localStorage.setItem("ca_users_db", JSON.stringify(localUsers));
                    }
                    appState = imported.state;
                    saveState();
                    window.location.reload();
                }
            } catch(err) { alert("Corrupted json packet configuration."); }
        };
        reader.readAsText(file);
    };
}

function setupConfigHandler() {
    document.getElementById("config-target-date").value = appState.targetDate || "2026-09-01";
    document.getElementById("config-challenge-days").value = appState.challengeDays || 50;
    document.getElementById("save-config-btn").onclick = () => {
        appState.targetDate = document.getElementById("config-target-date").value;
        appState.challengeDays = parseInt(document.getElementById("config-challenge-days").value) || 50;
        saveState();
        renderRoadmap();
        alert("Challenge vectors dynamically updated!");
    };
}

function startClocksAndCountdowns() {
    setInterval(() => {
        const now = new Date();
        document.getElementById("live-clock").innerText = now.toLocaleTimeString();
        document.getElementById("current-date").innerText = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        const target = appState.targetDate ? new Date(appState.targetDate + "T00:00:00") : new Date("2026-09-01T00:00:00");
        const diff = target.getTime() - now.getTime();
        if(diff > 0) document.getElementById("exam-countdown").innerText = `${Math.floor(diff / (1000 * 60 * 60 * 24))} Days Left`;
        else document.getElementById("exam-countdown").innerText = "Target Arrived!";
    }, 1000);
}

function selectQuote() {
    document.getElementById("motivational-quote").innerText = shivamQuotes[Math.floor(Math.random() * shivamQuotes.length)];
}

function renderRoutine() {
    const container = document.getElementById("routine-tasks-container");
    container.innerHTML = "";
    if(!appState.customRoutine) appState.customRoutine = [];
    appState.customRoutine.forEach((item, idx) => {
        const checked = appState.routineChecked[idx] || false;
        const div = document.createElement("div");
        div.className = "routine-item glass";
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; flex:1;">
                <input type="checkbox" id="routine-chk-${idx}" ${checked ? 'checked' : ''}>
                <div><strong>${item.time}</strong><p style="font-size:0.85rem; color:var(--text-muted);">${item.task}</p></div>
            </div>
            <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem; min-height: 30px;">Delete</button>
        `;
        div.querySelector("input").onchange = (e) => {
            appState.routineChecked[idx] = e.target.checked;
            appState.xp += e.target.checked ? 10 : -10;
            if(e.target.checked) triggerSuccessChime();
            saveState();
        };
        div.querySelector("button").onclick = () => {
            appState.customRoutine.splice(idx, 1);
            delete appState.routineChecked[idx];
            saveState();
            renderRoutine();
        };
        container.appendChild(div);
    });
}

document.getElementById("add-routine-block-btn").onclick = () => {
    const time = document.getElementById("routine-time-input").value.trim();
    const task = document.getElementById("routine-task-input").value.trim();
    if(!time || !task) return;
    appState.customRoutine.push({ time, task });
    document.getElementById("routine-time-input").value = "";
    document.getElementById("routine-task-input").value = "";
    saveState();
    renderRoutine();
};

// NEW: Syllabus rendering integrated with exam priority weightage options (ABC Matrix Analysis)
function renderSyllabus() {
    const container = document.getElementById("subjects-container");
    container.innerHTML = "";
    if(!appState.subjects) appState.subjects = [];
    appState.subjects.forEach((sub, sIdx) => {
        if(!sub.priorities) sub.priorities = {};
        const div = document.createElement("div");
        div.className = "subject-block-card glass card-padding";
        
        let chapHtml = "";
        sub.chapters.forEach((chap) => {
            const key = `${sIdx}_${chap}`;
            const isDone = appState.chaptersChecked[key] || false;
            const activeABC = sub.priorities[chap] || "A";
            chapHtml += `
                <div class="chapter-flex-row">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span class="abc-badge abc-${activeABC.toLowerCase()}">${activeABC}</span>
                        <span>${chap}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <select class="abc-selector-inline" data-ckey="${chap}" style="padding:2px; min-height:24px; font-size:0.7rem; width:45px;">
                            <option value="A" ${activeABC==='A'?'selected':''}>A</option>
                            <option value="B" ${activeABC==='B'?'selected':''}>B</option>
                            <option value="C" ${activeABC==='C'?'selected':''}>C</option>
                        </select>
                        <input type="checkbox" data-ckey="${key}" ${isDone ? 'checked' : ''}>
                    </div>
                </div>
            `;
        });

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h3>${sub.name}</h3><button class="btn btn-danger btn-sm del-sub-btn" style="padding:2px 6px; font-size:0.7rem; min-height:28px;">Remove</button>
            </div>
            <div class="todo-form margin-bottom">
                <input type="text" placeholder="New Chapter..." class="new-chap-input"><button class="btn btn-primary add-chap-btn">+</button>
            </div>
            <div class="chapters-area">${chapHtml}</div>
        `;

        div.querySelectorAll(".abc-selector-inline").forEach(sel => {
            sel.onchange = (e) => {
                const chapterName = e.target.getAttribute("data-ckey");
                sub.priorities[chapterName] = e.target.value;
                saveState();
                renderSyllabus();
            };
        });

        div.querySelectorAll("input[type='checkbox']").forEach(box => {
            box.onchange = (e) => {
                const k = e.target.getAttribute("data-ckey");
                appState.chaptersChecked[k] = e.target.checked;
                appState.xp += e.target.checked ? 15 : -15;
                if(e.target.checked) triggerSuccessChime();
                saveState();
                renderSyllabus();
            };
        });

        div.querySelector(".add-chap-btn").onclick = () => {
            const inp = div.querySelector(".new-chap-input").value.trim();
            if(!inp) return;
            sub.chapters.push(inp);
            sub.priorities[inp] = "A";
            saveState();
            renderSyllabus();
        };

        div.querySelector(".del-sub-btn").onclick = () => {
            appState.subjects.splice(sIdx, 1);
            saveState();
            renderSyllabus();
        };
        container.appendChild(div);
    });
}

document.getElementById("create-subject-btn").onclick = () => {
    const title = document.getElementById("new-subject-name").value.trim();
    if(!title) return;
    appState.subjects.push({ name: title, chapters: [], priorities: {} });
    document.getElementById("new-subject-name").value = "";
    saveState();
    renderSyllabus();
};

let pomoInterval = null, pomoTimeLeft = 50 * 60;
function setupPomodoro() {
    const display = document.getElementById("timer-display");
    document.getElementById("pomo-start").onclick = () => {
        if (pomoInterval) return;
        pomoInterval = setInterval(() => {
            if (pomoTimeLeft > 0) { pomoTimeLeft--; display.innerText = `${Math.floor(pomoTimeLeft/60).toString().padStart(2,'0')}:${(pomoTimeLeft%60).toString().padStart(2,'0')}`; }
            else { clearInterval(pomoInterval); pomoInterval = null; triggerSuccessChime(); alert("Focus Block Terminated! Break Mode."); }
        }, 1000);
    };
    document.getElementById("pomo-pause").onclick = () => { clearInterval(pomoInterval); pomoInterval = null; };
    document.getElementById("pomo-reset").onclick = () => { clearInterval(pomoInterval); pomoInterval = null; pomoTimeLeft = 50*60; display.innerText = "50:00"; };
}

let swInterval = null, swSeconds = 0;
function setupStopwatchAndTodo() {
    const swDisplay = document.getElementById("stopwatch-display");
    document.getElementById("sw-start").onclick = () => {
        if(swInterval) return;
        swInterval = setInterval(() => {
            swSeconds++;
            const h = Math.floor(swSeconds/3600).toString().padStart(2,'0');
            const m = Math.floor((swSeconds%3600)/60).toString().padStart(2,'0');
            const s = (swSeconds%60).toString().padStart(2,'0');
            swDisplay.innerText = `${h}:${m}:${s}`;
        }, 1000);
    };
    document.getElementById("sw-pause").onclick = () => { clearInterval(swInterval); swInterval = null; };
    document.getElementById("sw-log").onclick = () => {
        clearInterval(swInterval); swInterval = null;
        const h = swSeconds / 3600;
        if(h > 0) { appState.hoursLogged.today += h; appState.hoursLogged.total += h; appState.xp += Math.round(h * 20); triggerSuccessChime(); saveState(); }
        swSeconds = 0; swDisplay.innerText = "00:00:00";
    };

    const todoInput = document.getElementById("todo-input"), list = document.getElementById("todo-list-items");
    function renderTodos() {
        list.innerHTML = "";
        if(!appState.todo) appState.todo = [];
        appState.todo.forEach((item, idx) => {
            const li = document.createElement("li"); li.className = "todo-item";
            li.innerHTML = `<span>[${item.priority}] ${item.text}</span><button class="btn btn-danger" style="padding:2px 6px; font-size:0.75rem; min-height:28px;">X</button>`;
            li.querySelector("but
