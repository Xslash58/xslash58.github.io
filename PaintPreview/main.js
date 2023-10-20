const DecimalToStringRGBA = (num) => {
    const r = (num >>> 24) & 0xff;
    const g = (num >>> 16) & 0xff;
    const b = (num >>> 8) & 0xff;
    const a = num & 0xff;

    return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
};
const DecimalToStringRGB = (num) => {
    const r = (num >>> 24) & 0xff;
    const g = (num >>> 16) & 0xff;
    const b = (num >>> 8) & 0xff;

    return `rgb(${r}, ${g}, ${b})`;
};

async function main() {
    const urlParams = new URLSearchParams(window.location.search);
    const nickParam = urlParams.get('username');
    const jsonParam = urlParams.get('json');

    loadPaint(jsonParam, nickParam);
}

function loadPaint(jsonParam, username) {
    let json = null;

    try {
        json = JSON.parse(jsonParam);
    } catch { }

    if (jsonParam === null || json === null) {
        document.getElementById("paint-username").innerHTML = "No/Invalid JSON provided."
        return;
    }

    try {
        let elements = document.getElementsByClassName("paint-background");

        let repeat = json["data"]["repeat"];

        let functionName = "";
        let imageUrl = json["data"]["image_url"];
        if (repeat) functionName = "repeating-";

        let gradientStyle = "";
        if (imageUrl)
            gradientStyle = `url(${imageUrl})`;
        else
            gradientStyle = `${functionName}${json["data"]["function"].replaceAll("_", "-")}(${json["data"]["angle"]}deg, ${json["data"]["stops"].map(x =>
                `${DecimalToStringRGB(x["color"])} ${x["at"] * 100}%`
            )})`;

        const shadowStyle = `drop-shadow(${json["data"]["shadows"].map(x => {
            return `${x["x_offset"]}px ${x["y_offset"]}px ${x["radius"]}px ${DecimalToStringRGBA(x["color"])}`;
        }).join(", ")})`;

        elements[0].style["background-image"] = `${gradientStyle}`;
        elements[0].style["filter"] = `${shadowStyle}`;

        if (username === null)
            setUsername(json["data"]["name"]);
    } catch {
        document.getElementById("paint-username").innerHTML = "Invalid JSON provided."
        return;
    }

    if (username !== null)
        setUsername(username);
}
function setUsername(username) {
    if (username === null) {
        document.getElementById("paint-username").innerHTML = "turtegbot";
        return;
    }
    document.getElementById("paint-username").innerHTML = username;
}

function submitJSON() {
    let json = document.getElementById("input-paint-json").value;

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('json', json.trim())

    window.location.href = `?${urlParams}`;
}
function submitUsername() {
    let username = document.getElementById("input-paint-username").value;

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('username', username)

    window.location.href = `?${urlParams}`;
}

main();