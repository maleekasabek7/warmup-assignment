const fs = require("fs");

function timeToSec(t) {
    let a = t.trim().split(":").map(Number);
    return a[0] * 3600 + a[1] * 60 + a[2];
}

function secToTime(s) {
    if (s < 0) s = 0;
    let h = Math.floor(s / 3600);
    let m = Math.floor((s % 3600) / 60);
    let sec = s % 60;
    return `${h}:${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`;
}

function ampmToSec(t) {
    t = t.trim().toLowerCase();
    let [time, p] = t.split(" ");
    let [h, m, s] = time.split(":").map(Number);
    if (p === "pm" && h !== 12) h += 12;
    if (p === "am" && h === 12) h = 0;
    return h * 3600 + m * 60 + s;
}

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)

// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    let s = ampmToSec(startTime);
    let e = ampmToSec(endTime);
    return secToTime(e - s);

    // TODO: Implement this function
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    let s = ampmToSec(startTime);
    let e = ampmToSec(endTime);
    let start = 8 * 3600;
    let end = 22 * 3600;
    let idle = 0;
    if (s < start) idle += Math.min(e, start) - s;
    if (e > end) idle += e - Math.max(s, end);
    return secToTime(idle);
    // TODO: Implement this function
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    return secToTime(timeToSec(shiftDuration) - timeToSec(idleTime));

    // TODO: Implement this function
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    let a = timeToSec(activeTime);
    let normal = 8*3600 + 24*60; // 8:24:00
    let eid = 6*3600; // 6:00:00
    let d = new Date(date);
    let startEid = new Date("2025-04-10");
    let endEid = new Date("2025-04-30");
    let quota = (d >= startEid && d <= endEid) ? eid : normal;
    return a >= quota;


    // TODO: Implement this function
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    let data = fs.existsSync(textFile) ? fs.readFileSync(textFile, "utf8").trim() : "";
    let rows = data ? data.split("\n") : [];

    // Check duplicate
    for (let r of rows) {
        let c = r.split(",");
        if (c[0].trim() === shiftObj.driverID.trim() && c[2].trim() === shiftObj.date.trim())
            return {};
    }

    let shiftDuration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
    let idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime);
    let activeTime = getActiveTime(shiftDuration, idleTime);
    let quota = metQuota(shiftObj.date, activeTime);

    let obj = {
        driverID: shiftObj.driverID,
        driverName: shiftObj.driverName,
        date: shiftObj.date,
        startTime: shiftObj.startTime,
        endTime: shiftObj.endTime,
        shiftDuration: shiftDuration,
        idleTime: idleTime,
        activeTime: activeTime,
        metQuota: quota,
        hasBonus: false
    };

    // Insert after last record of same driverID
    let inserted = false;
    for (let i = rows.length - 1; i >= 0; i--) {
        let c = rows[i].split(",");
        if (c[0].trim() === shiftObj.driverID.trim()) {
            rows.splice(i + 1, 0, Object.values(obj).join(","));
            inserted = true;
            break;
        }
    }
    if (!inserted) rows.push(Object.values(obj).join(","));

    fs.writeFileSync(textFile, rows.join("\n"));
    return obj;


    // TODO: Implement this function
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    let rows = fs.readFileSync(textFile, "utf8").trim().split("\n");
    for (let i = 0; i < rows.length; i++) {
        let c = rows[i].split(",");
        if (c[0].trim() === driverID.trim() && c[2].trim() === date.trim()) {
            c[9] = newValue.toString();
            rows[i] = c.join(",");
        }
    }
    fs.writeFileSync(textFile, rows.join("\n"));
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    month = parseInt(month);
    let rows = fs.readFileSync(textFile, "utf8").trim().split("\n");
    let exist = false;
    let count = 0;
    for (let r of rows) {
        let c = r.split(",");
        if (c[0].trim() === driverID.trim()) {
            exist = true;
            let m = parseInt(c[2].split("-")[1]);
            if (m === month && c[9].trim() === "true") count++;
        }
    }
    return exist ? count : -1;
}


// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    let rows = fs.readFileSync(textFile, "utf8").trim().split("\n");
    let total = 0;
    for (let r of rows) {
        let c = r.split(",");
        if (c[0].trim() === driverID.trim()) {
            let m = parseInt(c[2].split("-")[1]);
            if (m === month) total += timeToSec(c[7]);
        }
    }
    return secToTime(total);
}
// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    let rates = fs.readFileSync(rateFile, "utf8").trim().split("\n");
    let dayOff = "";
    for (let r of rates) {
        let c = r.split(",");
        if (c[0].trim() === driverID.trim()) dayOff = c[1].trim();
    }

    let rows = fs.readFileSync(textFile, "utf8").trim().split("\n");
    let total = 0;
    for (let r of rows) {
        let c = r.split(",");
        if (c[0].trim() === driverID.trim()) {
            let date = c[2].trim();
            let m = parseInt(date.split("-")[1]);
            if (m === month) {
                let d = new Date(date);
                let day = d.toLocaleString("en-US", { weekday: "long" });
                if (day === dayOff) continue;
                let quota = 8*3600 + 24*60;
                let s = new Date("2025-04-10");
                let e = new Date("2025-04-30");
                if (d >= s && d <= e) quota = 6*3600;
                total += quota;
            }
        }
    }
    total -= bonusCount * 2 * 3600;
    return secToTime(total);
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    let rows = fs.readFileSync(rateFile, "utf8").trim().split("\n");
    let base = 0;
    let tier = 0;
    for (let r of rows) {
        let c = r.split(",");
        if (c[0].trim() === driverID.trim()) {
            base = parseInt(c[2]);
            tier = parseInt(c[3]);
        }
    }

    let allowed = [0,50,20,10,3][tier];
    let actual = timeToSec(actualHours);
    let required = timeToSec(requiredHours);
    let miss = required - actual;
    if (miss <= 0) return base;
    miss -= allowed * 3600;
    if (miss <= 0) return base;
    let hours = Math.floor(miss / 3600);
    let rate = Math.floor(base / 185);
    return base - hours * rate;
}


module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
