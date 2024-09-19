let jsonParam = "";

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
    setOEmbedLink();

    const urlParams = new URLSearchParams(window.location.search);
    const nickParam = urlParams.get('username');
    jsonParam = urlParams.get('json');
    const idParam = urlParams.get('id').trim();

    if (idParam !== null) {

        if (idParam === "") {
            document.getElementById("paint-username").innerHTML = "Empty ID provided.";
            return;
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
                kind
                name
                tooltip
                tag
              }
            }
          }
            `,
                variables: {
                    list: [idParam],
                },
            }),
        });

        let tempJson = await request.json();
        if (tempJson["errors"]) {
            document.getElementById("paint-username").innerHTML = `GQL ERROR: ${tempJson["errors"][0]["message"]}`;
            return;
        }
        let paintJson = tempJson["data"]["cosmetics"]["paints"][0];

        if (paintJson === undefined) {
            document.getElementById("paint-username").innerHTML = `Paint not found.`;
            return;
        }

        let json = {
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
            }
        };
        jsonParam = JSON.stringify(json);
    }

    loadPaint(jsonParam, nickParam);
}

function setOEmbedLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const paintId = urlParams.get('id');
    if (paintId) {
        const oembedLink = `https://turteg.luki3507.pl/v1/paints/oembed?id=${paintId}`;
        document.getElementById('oembedLink').setAttribute('href', oembedLink);
    } else {
        console.error('No paint ID found in URL.');
    }
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
            gradientStyle = `url(${imageUrl.trim()})`;
        else if (json["data"]["function"] == "RADIAL_GRADIENT")
            gradientStyle = `${functionName}${json["data"]["function"].replaceAll("_", "-")}(${json["data"]["shape"]}, ${json["data"]["stops"].map(x =>
                `${DecimalToStringRGB(x["color"])} ${Math.round(x["at"] * 100)}%`
            )})`;
        else
            gradientStyle = `${functionName}${json["data"]["function"].replaceAll("_", "-")}(${json["data"]["angle"]}deg, ${json["data"]["stops"].map(x =>
                `${DecimalToStringRGB(x["color"])} ${Math.round(x["at"] * 100)}%`
            )})`;

        const shadowStyle = `${json["data"]["shadows"].map(x => {
            return `drop-shadow(${x["x_offset"]}px ${x["y_offset"]}px ${x["radius"]}px ${DecimalToStringRGBA(x["color"])})`;
        }).join(" ")}`;

        elements[0].style["background-image"] = `${gradientStyle}`;
        elements[0].style["filter"] = `${shadowStyle}`;
        console.log(shadowStyle); console.log(gradientStyle);
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
function submitID() {
    let id = document.getElementById("input-paint-id").value;

    const urlParams = new URLSearchParams(window.location.search);

    urlParams.set('id', id)

    window.location.href = `?${urlParams}`;
}
async function copyJSON() {

    await navigator.clipboard.writeText(jsonParam).then(
        () => { alert("JSON copied! Now import it into 7TV Extension Paint Tool!") },
        () => { alert("Something went wrong.") }
    );
    //alert("JSON copied! Now import it into 7TV Extension Paint Tool!")
}

main();