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
function generateRandomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function main() {
    const urlParams = new URLSearchParams(window.location.search);
    let nickParam = urlParams.get('username');
    let seventvid = urlParams.get('7tvid');
    let twitchId = urlParams.get('twitchid');

    let selectedPaint = undefined;
    let selectedBadge = undefined;
    let requestVariables = {};
    if (seventvid !== null) {
        let request = await fetch('https://7tv.io/v3/gql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                query GetUserCosmetics($id: ObjectID!) {
                    user(id: $id) {
                        cosmetics {
                            id
                            kind
                            selected
                        }
                    }
                }
                `,
                variables: { id: seventvid }
            }),
        });

        let tempJson = await request.json();
        if (tempJson["errors"]) {
            document.getElementById("paint-username").innerHTML = `GQL ERROR: ${tempJson["errors"][0]["message"]}`;
            return;
        }

        let cosmeticsJson = tempJson["data"]["user"]["cosmetics"];

        selectedBadge = cosmeticsJson.find(x => x["selected"] == true && x["kind"] == "BADGE");
        selectedPaint = cosmeticsJson.find(x => x["selected"] == true && x["kind"] == "PAINT");

        let cosmetics = [];
        cosmeticsJson.forEach(x => cosmetics.push(x["id"]));

        requestVariables = { list: cosmetics };
    }

    let request = await fetch('https://7tv.io/v3/gql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: `
          query GetCosmestics($list: [ObjectID!]) {
            cosmetics(list: $list) {
              paints {
                id
                kind
                name
                function
                color
                angle
                shape
                image_url
                repeat
                stops {
                  at
                  color
                }
                shadows {
                  x_offset
                  y_offset
                  radius
                  color
                }
              }
              badges {
                id
                host {
                    url
                }
                name
                tooltip
                tag
              }
            }
          }
            `,
            variables: requestVariables
        }),
    });

    let tempJson = await request.json();
    if (tempJson["errors"]) {
        document.getElementById("paint-username").innerHTML = `GQL ERROR: ${tempJson["errors"][0]["message"]}`;
        return;
    }

    let badgesJson = "";
    let paintsJsonParam = "";

    {
        badgesJson = tempJson["data"]["cosmetics"]["badges"];

        if (badgesJson === undefined) {
            document.getElementById("paint-username").innerHTML = `Badges not found.`;
            return;
        }
    }

    {
        let paintsJson = tempJson["data"]["cosmetics"]["paints"];

        if (paintsJson === undefined) {
            document.getElementById("paint-username").innerHTML = `Paints not found.`;
            return;
        }

        let json = paintsJson.map(paintJson => {
            return {
                "id": `${generateRandomUUID()}`,
                "kind": "PAINT",
                "provider": "7TV",
                "data": {
                    "name": paintJson["name"] ? paintJson["name"] : null,
                    "function": paintJson["function"] ? paintJson["function"] : null,
                    "color": paintJson["color"] ? paintJson["color"] : 0,
                    "angle": paintJson["angle"] ? paintJson["angle"] : 0,
                    "shape": paintJson["shape"] ? paintJson["shape"] : null,
                    "image_url": paintJson["image_url"] ? paintJson["image_url"] : null,
                    "repeat": paintJson["repeat"],
                    "stops": paintJson["stops"],
                    "shadows": paintJson["shadows"]
                },
                "paintId": paintJson["id"]
            }
        });
        paintsJsonParam = JSON.stringify(json);
    }

    loadBadges(badgesJson, selectedBadge);
    loadPaints(paintsJsonParam, selectedPaint, nickParam);
    loadFFZBadges(twitchId);
    loadBTTVBadges(twitchId);
    loadChatterinoBadges(twitchId);
    //loadChatterinoHomiesBadges(twitchId);
    //loadChatterinoHomiesBadges(twitchId, true);
}

function loadBadges(json, selectedBadge) {
    if (json === null)
        return;

    json.forEach(x => {
        var badge = document.createElement("div");
        badge.className = "badge";

        if (selectedBadge !== undefined && x["id"] == selectedBadge["id"])
            badge.id = "selected";

        var img = document.createElement("img");
        img.height = 72;
        img.width = 72;
        img.src = `https:${x["host"]["url"]}/3x`;

        img.addEventListener("click", () => {
            window.location.href = `https:${x["host"]["url"]}/3x`;
        }, false);

        var p = document.createElement("p");
        p.textContent = x["name"];

        badge.appendChild(img);
        badge.appendChild(p);
        document.getElementsByClassName("badges-preview")[0].appendChild(badge);
    });
}
function loadPaints(jsonParam, selectedPaint, username) {
    let json = null;

    try {
        json = JSON.parse(jsonParam);
    } catch { }

    if (jsonParam === null || json === null) {
        document.getElementById("paint-username").innerHTML = "No/Invalid JSON provided."
        return;
    }

    try {
        json.forEach(x => {
            var paintBackground = document.createElement("div");
            paintBackground.className = "paint-background";

            if (selectedPaint !== undefined && x["paintId"] == selectedPaint["id"])
                paintBackground.id = "selected";

            var paintUsername = document.createElement("p");
            paintUsername.className = "paint-username";
            paintUsername.addEventListener("click", () => {
                window.location.href = "/PaintPreview/?id=" + x["paintId"];
            }, false);

            paintBackground.appendChild(paintUsername);
            document.getElementsByClassName("paints-preview")[0].appendChild(paintBackground);
            if (username !== null)
                paintUsername.textContent = username;
            else
                paintUsername.textContent = x["data"]["name"];

            let repeat = x["data"]["repeat"];

            let functionName = "";
            let imageUrl = x["data"]["image_url"];
            if (repeat) functionName = "repeating-";

            let gradientStyle = "";
            if (imageUrl)
                gradientStyle = `url(${imageUrl})`;
            else if (x["data"]["function"] == "RADIAL_GRADIENT")
                gradientStyle = `${functionName}${x["data"]["function"].replaceAll("_", "-")}(${x["data"]["shape"]}, ${x["data"]["stops"].map(x =>
                    `${DecimalToStringRGB(x["color"])} ${Math.round(x["at"] * 100)}%`
                )})`;
            else
                gradientStyle = `${functionName}${x["data"]["function"].replaceAll("_", "-")}(${x["data"]["angle"]}deg, ${x["data"]["stops"].map(x =>
                    `${DecimalToStringRGB(x["color"])} ${Math.round(x["at"] * 100)}%`
                )})`;

            const shadowStyle = `${x["data"]["shadows"].map(x => {
                return `drop-shadow(${x["x_offset"]}px ${x["y_offset"]}px ${x["radius"]}px ${DecimalToStringRGBA(x["color"])})`;
            }).join(" ")}`;

            paintBackground.style["background-image"] = `${gradientStyle}`;
            paintBackground.style["filter"] = `${shadowStyle}`;
            console.log(shadowStyle); console.log(gradientStyle);
        });

        document.getElementById("placeholder-loading").remove();
    } catch (error) {
        console.log(error);
        document.getElementById("paint-username").innerHTML = "Invalid JSON provided."
        return;
    }
}
async function loadFFZBadges(twitchId) {
    let request = await fetch('https://api.frankerfacez.com/v1/badges/ids', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    let json = await request.json();

    let badges = json["badges"];
    let users = json["users"];

    if (twitchId == undefined) {
        for (const key in badges) {
            var badge = document.createElement("div");
            badge.className = "badge";


            var img = document.createElement("img");
            img.height = 72;
            img.width = 72;
            img.src = `${badges[key]["urls"]["4"]}`;
            img.style["backgroundColor"] = badges[key]["color"];

            img.addEventListener("click", () => {
                window.location.href = `${badges[key]["urls"]["4"]}`;
            }, false);

            var p = document.createElement("p");
            p.textContent = badges[key]["title"];

            badge.appendChild(img);
            badge.appendChild(p);
            tryCreateCategory("Other");
            document.getElementsByClassName("Other-badges-preview")[0].appendChild(badge);
        }
        return;
    }

    let badgeIds = [];
    for (const key in users) {
        if (Array.isArray(users[key]))
            if (users[key].includes(Number(twitchId))) {
                badgeIds.push(Number(key));
                break;
            }
    }

    for (const key in badges) {
        if (badgeIds.includes(badges[key]["id"])) {
            var badge = document.createElement("div");
            badge.className = "badge";


            var img = document.createElement("img");
            img.height = 72;
            img.width = 72;
            img.src = `${badges[key]["urls"]["4"]}`;
            img.style["backgroundColor"] = badges[key]["color"];

            img.addEventListener("click", () => {
                window.location.href = `${badges[key]["urls"]["4"]}`;
            }, false);

            var p = document.createElement("p");
            p.textContent = badges[key]["title"];

            badge.appendChild(img);
            badge.appendChild(p);
            tryCreateCategory("Other");
            document.getElementsByClassName("Other-badges-preview")[0].appendChild(badge);
        }
    }

}
async function loadBTTVBadges(twitchId) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    let request = await fetch("https://api.betterttv.net/3/cached/badges/twitch", requestOptions)

    let json = await request.json();

    if (twitchId == undefined) {
        let rendered = [];

        for (const key in json) {
            if (!rendered.includes(json[key]["badge"]["type"])) {
                var badge = document.createElement("div");
                badge.className = "badge";


                var img = document.createElement("img");
                img.height = 72;
                img.width = 72;
                img.src = `${json[key]["badge"]["svg"]}`;
                img.style["backgroundColor"] = json[key]["color"];

                img.addEventListener("click", () => {
                    window.location.href = `${json[key]["badge"]["svg"]}`;
                }, false);

                var p = document.createElement("p");
                p.textContent = json[key]["badge"]["description"];

                badge.appendChild(img);
                badge.appendChild(p);
                tryCreateCategory("Other");
                document.getElementsByClassName("Other-badges-preview")[0].appendChild(badge);
                rendered.push(json[key]["badge"]["type"]);
            }
        }
        return;
    }

    for (const key in json) {
        if (json[key]["providerId"] == twitchId) {
            var badge = document.createElement("div");
            badge.className = "badge";


            var img = document.createElement("img");
            img.height = 72;
            img.width = 72;
            img.src = `${json[key]["badge"]["svg"]}`;
            img.style["backgroundColor"] = json[key]["color"];

            img.addEventListener("click", () => {
                window.location.href = `${json[key]["badge"]["svg"]}`;
            }, false);

            var p = document.createElement("p");
            p.textContent = json[key]["badge"]["description"];

            badge.appendChild(img);
            badge.appendChild(p);
            tryCreateCategory("Other");
            document.getElementsByClassName("Other-badges-preview")[0].appendChild(badge);
        }
    }
}
async function loadChatterinoBadges(twitchId) {
    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    let request = await fetch("https://api.chatterino.com/badges", requestOptions)

    let json = await request.json();
    let badges = json["badges"];

    for (const key in badges) {
        if (badges[key]["users"].includes(twitchId) || twitchId == undefined) {
            var badge = document.createElement("div");
            badge.className = "badge";


            var img = document.createElement("img");
            img.height = 72;
            img.width = 72;
            img.src = `${badges[key]["image3"]}`;

            img.addEventListener("click", () => {
                window.location.href = `${badges[key]["image3"]}`;
            }, false);

            var p = document.createElement("p");
            p.textContent = badges[key]["tooltip"];

            badge.appendChild(img);
            badge.appendChild(p);

            tryCreateCategory("Other");
            document.getElementsByClassName("Other-badges-preview")[0].appendChild(badge);
        }
    }
}
async function loadChatterinoHomiesBadges(twitchId, personal) {
    var requestOptions = {
        method: 'GET'
    };

    let request = await fetch("https://itzalex.github.io/badges" + (personal ? "2" : ""), requestOptions)

    let json = await request.json();
    let badges = json["badges"];

    for (const key in badges) {
        if (badges[key]["users"].includes(twitchId) || twitchId == undefined) {
            var badge = document.createElement("div");
            badge.className = "badge";


            var img = document.createElement("img");
            img.height = 72;
            img.width = 72;
            img.src = `${badges[key]["image3"]}`;

            img.addEventListener("click", () => {
                window.location.href = `${badges[key]["image3"]}`;
            }, false);

            var p = document.createElement("p");
            p.textContent = badges[key]["tooltip"] + " [Chatterino Homies]";

            badge.appendChild(img);
            badge.appendChild(p);
            tryCreateCategory("other");
            document.getElementsByClassName("other-badges-preview")[0].appendChild(badge);
        }
    }
}

function tryCreateCategory(name) {
    if (document.getElementsByClassName(name + "-badges-preview").length > 0) return;

    let content = document.getElementsByClassName("custom-category")[0];

    let wdiv = document.createElement("div");

    let text = document.createElement("h1");
    text.innerHTML = name + ":";

    let div = document.createElement("div");
    div.className = name + "-badges-preview";

    wdiv.appendChild(text);
    wdiv.appendChild(div);
    content.appendChild(wdiv);

}

function submitJSON() {
    let json = document.getElementById("input-paint-json").value;

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('json', json.trim())

    window.location.href = `/PaintPreview/?${urlParams}`;
}
function submitUsername() {
    let username = document.getElementById("input-paint-username").value;

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('username', username)

    window.location.href = `/PaintPreview/?${urlParams}`;
}
function submitID() {
    let id = document.getElementById("input-paint-id").value;

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('id', id)

    window.location.href = `/PaintPreview/?${urlParams}`;
}

main();