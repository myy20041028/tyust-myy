// ====================== 全局变量 ======================
let ros = null;
let connected = false;
let rosTopics = new Map();
let subs = new Map();
let pubs = new Map();

// ====================== 状态提示 ======================
function setStatus(text, color = "#94a3b8") {
    const el = document.getElementById("status");
    el.innerText = text;
    el.style.color = color;
}

// ====================== 连接 ROS ======================
function connectROS() {
    if (ros) return;
    setStatus("连接中...", "#fbbf24");

    ros = new ROSLIB.Ros({
        url: "wss://sunrise-strike-converted-ala.trycloudflare.com"
    });

    ros.on("connection", () => {
        connected = true;
        setStatus("✅ 已连接", "#22c55e");
        fetchTopics();
    });
    ros.on("error", () => setStatus("❌ 连接失败", "#ef4444"));
    ros.on("close", () => {
        connected = false;
        ros = null;
        setStatus("⚠️ 已断开", "#f59e0b");
    });
}

// ====================== 断开 ======================
function disconnectROS() {
    subs.forEach(t => t.unsubscribe());
    subs.clear();
    pubs.clear();
    if (ros) ros.close();
    ros = null;
    connected = false;
    document.getElementById("sub_container").innerHTML = "";
    document.getElementById("pub_container").innerHTML = "";
    setStatus("⛔ 已断开", "#9ca3af");
}

// ====================== 刷新话题 ======================
function fetchTopics() {
    if (!connected) {
        setStatus("请先连接！", "#f87171");
        return;
    }
    setStatus("加载话题...", "#fbbf24");

    const srv = new ROSLIB.Service({
        ros: ros,
        name: "/rosapi/topics",
        serviceType: "rosapi/Topics"
    });

    srv.callService(new ROSLIB.ServiceRequest(), (res) => {
        rosTopics.clear();
        const list = document.getElementById("topic_list");
        list.innerHTML = "";

        for (let i = 0; i < res.topics.length; i++) {
            let name = res.topics[i];
            let type = res.types[i];
            if (type.includes("/msg/")) {
                type = type.replace("/msg/", "/");
            }
            rosTopics.set(name, type);
            list.innerHTML += `<option value="${name}">`;
        }
        setStatus(`✅ 已加载 ${rosTopics.size} 个话题`, "#22c55e");
    });
}

// ====================== 订阅自动匹配类型 ======================
document.getElementById("sub_topic").oninput = function () {
    const t = rosTopics.get(this.value);
    if (t) {
        document.getElementById("sub_type").value = t;
    }
};

document.getElementById("sub_type").onchange = function () {
    document.getElementById("sub_type_custom").style.display =
        this.value === "custom" ? "inline" : "none";
};

// ====================== 发布自动匹配类型 + 默认模板 ======================
document.getElementById("pub_topic").oninput = function () {
    const t = rosTopics.get(this.value);
    if (t) {
        document.getElementById("pub_type").value = t;
    }
};

document.getElementById("pub_type").onchange = function () {
    document.getElementById("pub_type_custom").style.display =
        this.value === "custom" ? "inline" : "none";
};

// ====================== 默认消息模板 ======================
function getDefaultTemplate(type) {
    switch (type) {
        case "std_msgs/String": return '{"data":"hello"}';
        case "std_msgs/Int32": return '{"data":0}';
        case "std_msgs/Float64": return '{"data":0.0}';
        case "std_msgs/Bool": return '{"data":false}';
        case "geometry_msgs/Twist": return '{"linear":{"x":0,"y":0,"z":0},"angular":{"x":0,"y":0,"z":0}}';
        case "geometry_msgs/Pose": return '{"position":{"x":0,"y":0,"z":0},"orientation":{"x":0,"y":0,"z":0,"w":1}}';
        case "nav_msgs/Odometry": return '{"pose":{"pose":{"position":{"x":0,"y":0,"z":0}}}}';
        case "sensor_msgs/LaserScan": return '{"ranges":[], "range_min":0.1, "range_max":10}';
        case "sensor_msgs/Range": return '{"range":0.5,"min_range":0.1,"max_range":5.0}';
        default: return '{}';
    }
}

// ====================== 订阅功能 ======================
function addSubscribe() {
    if (!connected) return alert("请先连接 ROS");

    const name = document.getElementById("sub_topic").value.trim();
    const type = document.getElementById("sub_type").value;
    const customType = document.getElementById("sub_type_custom").value.trim();
    const msgType = type === "custom" ? customType : type;

    if (!name || !msgType) return alert("话题和类型不能为空");
    if (subs.has(name)) return alert("已订阅该话题");

    const topic = new ROSLIB.Topic({
        ros: ros,
        name: name,
        messageType: msgType
    });

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <div style="display:flex;justify-content:space-between;">
            <strong>📥 ${name}</strong>
            <button class="danger" onclick="unsub(this,'${name}')">取消</button>
        </div>
        <pre>等待消息...</pre>
    `;
    const pre = card.querySelector("pre");
    document.getElementById("sub_container").appendChild(card);

    topic.subscribe((msg) => {
        pre.innerText = JSON.stringify(msg, null, 2);
    });

    subs.set(name, topic);
}

function unsub(btn, name) {
    if (subs.has(name)) subs.get(name).unsubscribe();
    subs.delete(name);
    btn.closest(".card").remove();
}

// ====================== 发布功能 ======================
function addPublish() {
    if (!connected) return alert("请先连接 ROS");

    const name = document.getElementById("pub_topic").value.trim();
    const type = document.getElementById("pub_type").value;
    const customType = document.getElementById("pub_type_custom").value.trim();
    const msgType = type === "custom" ? customType : type;

    if (!name || !msgType) return alert("话题和类型不能为空");
    if (pubs.has(name)) return alert("已添加该话题的发布器");

    // 创建发布器
    const topic = new ROSLIB.Topic({
        ros: ros,
        name: name,
        messageType: msgType
    });
    pubs.set(name, topic);

    // 自动获取该类型的默认模板，作为初始消息内容
    const defaultJson = getDefaultTemplate(msgType);

    // 创建可编辑的发布项
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong>📤 ${name}</strong>
            <button class="danger" onclick="removePub(this,'${name}')">删除</button>
        </div>
        <textarea class="pub-edit-json" style="width:95%;min-height:80px;margin-top:10px;">${defaultJson}</textarea>
        <button class="sendBtn" onclick="sendMsg(this,'${name}')" style="margin-top:10px;">发送消息</button>
    `;
    document.getElementById("pub_container").appendChild(card);
}

function sendMsg(btn, name) {
    const topic = pubs.get(name);
    if (!topic) return;

    const card = btn.closest(".card");
    const textarea = card.querySelector(".pub-edit-json");
    const json = textarea.value.trim();

    try {
        const msg = new ROSLIB.Message(JSON.parse(json));
        topic.publish(msg);
        setStatus(`✅ 已发布到 ${name}`, "#22c55e");
    } catch (e) {
        alert("JSON 格式错误：" + e.message);
    }
}

function removePub(btn, name) {
    pubs.delete(name);
    btn.closest(".card").remove();
}